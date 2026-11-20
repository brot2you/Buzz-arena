import {firebaseConfig} from './firebase-config.js';
import {initializeApp} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js';
import {getAuth, signInAnonymously, signInWithPopup, GoogleAuthProvider, onAuthStateChanged} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js';
import {getDatabase, ref, get, set, update, onValue, runTransaction, serverTimestamp} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js';
const $=id=>document.getElementById(id);const screens=[...document.querySelectorAll('.screen')];
let auth,db,user,room='',role='',me='',roomData=null,stopRoom=null,heartbeat=null,teacherSession=false,knownBuzz='';
const ready=!firebaseConfig.apiKey.startsWith('REMPLACER');
const sessionsPath='sessions';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const message=(id,s)=>{$(id).textContent=s;};
function show(id){screens.forEach(s=>s.classList.toggle('active',s.id===id));window.scrollTo({top:0,behavior:'instant'});}
function clearListeners(){if(stopRoom){stopRoom();stopRoom=null;}if(heartbeat){clearInterval(heartbeat);heartbeat=null;}roomData=null;knownBuzz='';}
function resetView(){clearListeners();room='';role='';me='';show('home');history.replaceState(null,'',location.pathname);}
function bind(id,fn){$(id).addEventListener('click',fn);}
function fail(err){const code=err?.code||'';if(code==='PERMISSION_DENIED'||code==='permission-denied')return 'Accès refusé : vérifie les règles de sécurité Firebase et le compte professeur.';if(code==='auth/popup-blocked')return 'La fenêtre de connexion a été bloquée : autorise les fenêtres pop-up.';if(code==='auth/unauthorized-domain')return 'Ajoute ton domaine GitHub Pages aux domaines autorisés dans Firebase Authentication.';return err?.message||'Une erreur est survenue.';}
function ensureConfigured(label){if(ready)return true;message(label,'Configuration Firebase manquante : remplis firebase-config.js avant de jouer en ligne.');return false;}
try{if(ready){const app=initializeApp(firebaseConfig);auth=getAuth(app);db=getDatabase(app);onAuthStateChanged(auth,u=>{user=u;});}}catch(err){console.error('Firebase:',err);}
async function anonymous(){if(!auth)throw Error('Firebase non configuré.');if(auth.currentUser)return auth.currentUser;const data=await signInAnonymously(auth);user=data.user;return user;}
async function google(){if(!auth)throw Error('Firebase non configuré.');const data=await signInWithPopup(auth,new GoogleAuthProvider());user=data.user;return user;}
function makeCode(){const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789',bytes=new Uint8Array(6);crypto.getRandomValues(bytes);return [...bytes].map(b=>chars[b%chars.length]).join('');}
function listen(code){clearListeners();room=code;stopRoom=onValue(ref(db,`${sessionsPath}/${room}`),s=>{if(!s.exists()){if(role==='teacher')message('teacherMsg','La session a été supprimée.');else if(role==='student')message('studentHint','Cette partie est terminée.');return;}const prev=knownBuzz;roomData=s.val();knownBuzz=roomData.buzz?.uid||'';
if(role==='student'&&me&&(!roomData.players?.[me])){
  clearListeners();role='';me='';show('join');
  $('playerName').value='';message('joinMsg','Le professeur t’a retiré de la partie. Tu peux la rejoindre à nouveau avec un pseudo approprié.');
  return;
}if(role==='teacher')renderTeacher();if(role==='student')renderStudent();if(role==='projection')renderProjection();if(knownBuzz && prev!==knownBuzz)playWinnerSound();},err=>{const msg=fail(err);if(role==='teacher')message('teacherMsg',msg);if(role==='student')message('studentHint',msg);});}
function showJoinQR(code){const target=$('joinQrCode');if(!target)return;target.replaceChildren();$('qrRoomCode').textContent=code;const joinUrl=new URL(location.pathname,location.origin);joinUrl.searchParams.set('room',code);if(typeof window.QRCode==='function'){new window.QRCode(target,{text:joinUrl.href,width:190,height:190,colorDark:'#21365c',colorLight:'#ffffff',correctLevel:window.QRCode.CorrectLevel.M});message('qrMessage','');}else{message('qrMessage','QR indisponible. Utilise « Copier le lien élève ».');}}
const buzzerFiles={"voice":"sounds/the-voice.mp3","loud":"sounds/loud-correct-buzzer.mp3","tv":"sounds/tv-total-buzzer.mp3","champion":"sounds/question-pour-un-champion.mp3","funny":"sounds/funny-correct-buzzer.mp3","mario_no":"sounds/mario-ohhh-nooo.mp3","airhorn":"sounds/airhorn.mp3","sms":"sounds/sms-squeez.mp3","slap":"sounds/slap.mp3","metal":"sounds/metal-gear-alert.mp3","netflix":"sounds/netflix.mp3","heehee":"sounds/michael-jackson-hee-hee.mp3","mario_jump":"sounds/mario-jump.mp3","mushroom":"sounds/mario-bros-mushroom.mp3","klaxon":"sounds/klaxon.mp3","luigi":"sounds/luigi-yahoo.mp3"};
const knownSounds=new Set(Object.keys(buzzerFiles));
let activePreview=null;
let teacherAudioEnabled=false;
let projectionAudioEnabled=false;
let teacherAudioUnlocked=false;
let projectionAudioUnlocked=false;
let lastMode='pc';
function selectedSound(value){return knownSounds.has(value)?value:'tv';}
function playSelectedSound(id,reportId=''){
  const src=new URL(buzzerFiles[selectedSound(id)],import.meta.url).href;
  try{
    if(activePreview){activePreview.pause();activePreview.currentTime=0;}
    const audio=new Audio(src);
    activePreview=audio;
    audio.volume=(id==='voice'||id==='mushroom')?1:.85;
    // Renforce les extraits moins audibles (The Voice et Mario Champignon).
    if(id==='voice'||id==='mushroom'){
      try{
        const AudioCtx=window.AudioContext||window.webkitAudioContext;
        if(AudioCtx){
          const ctx=new AudioCtx();
          const source=ctx.createMediaElementSource(audio);
          const gain=ctx.createGain();
          gain.gain.value=id==='mushroom'?2.8:1.85;
          const limiter=ctx.createDynamicsCompressor();
          limiter.threshold.value=-12;
          limiter.knee.value=8;
          limiter.ratio.value=12;
          limiter.attack.value=.003;
          limiter.release.value=.15;
          source.connect(gain).connect(limiter).connect(ctx.destination);
          audio.addEventListener('ended',()=>ctx.close().catch(()=>{}),{once:true});
          audio.addEventListener('error',()=>ctx.close().catch(()=>{}),{once:true});
          ctx.resume().catch(()=>{});
        }
      }catch(err){console.warn('Amplification The Voice indisponible',err);}
    }
    audio.play().then(()=>{if(reportId)message(reportId,'');}).catch(err=>{
      console.error('Lecture audio impossible',src,err);
      if(reportId){
        const file=decodeURIComponent(new URL(src).pathname.split('/').pop());
        const why=err?.name==='NotAllowedError'?'Le navigateur bloque le son : appuie sur Écouter.':
          err?.name==='NotSupportedError'?'Le navigateur ne reconnaît pas le format de '+file+'.':
          'Impossible de lire '+file+' ('+(err?.name||'erreur inconnue')+').';
        message(reportId,why);
      }
    });
  }catch(err){if(reportId)message(reportId,'Impossible de lire ce son.');}
}
function soundFromWinner(){const uid=roomData?.buzz?.uid;return uid?selectedSound(roomData?.players?.[uid]?.sound):'tv';}
function playWinnerSound(){const mode=roomData?.meta?.audioMode==='both'?'both':'pc';if(role==='student'&&mode==='both')playSelectedSound(soundFromWinner());else if(role==='teacher'&&teacherAudioEnabled)playSelectedSound(soundFromWinner());else if(role==='projection'&&projectionAudioEnabled)playSelectedSound(soundFromWinner());}
function ping(){try{const context=new AudioContext(),osc=context.createOscillator(),gain=context.createGain();osc.connect(gain);gain.connect(context.destination);osc.type='sine';osc.frequency.setValueAtTime(740,context.currentTime);osc.frequency.exponentialRampToValueAtTime(460,context.currentTime+.16);gain.gain.setValueAtTime(.12,context.currentTime);gain.gain.exponentialRampToValueAtTime(.001,context.currentTime+.22);osc.start();osc.stop(context.currentTime+.22);}catch{}}
function playerEntries(){return Object.entries(roomData?.players||{}).map(([uid,p])=>({uid,...p}));}
function teamScore(name){return playerEntries().filter(p=>p.team===name).reduce((sum,p)=>sum+Number(roomData?.scores?.[p.uid]||0),0);}
function scoreEntries(){const ps=playerEntries();if(roomData?.meta?.mode==='teams')return(roomData.meta.teams||[]).map(name=>({name,score:teamScore(name),uid:null})).sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name,'fr'));return ps.map(p=>({uid:p.uid,name:p.name,score:Number(roomData?.scores?.[p.uid]||0)})).sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name,'fr'));}
function scoreboardRows(entries,highlightUid='',limit=0){
 const chosen=limit?entries.slice(0,limit):entries;
 if(!chosen.length)return '<p class="score-empty">Les participants apparaîtront ici dès leur connexion.</p>';
 return chosen.map((s,i)=>{
   const badge=(s.name||'?').trim().slice(0,1).toLocaleUpperCase('fr');
   const isBuzz=!!(highlightUid&&s.uid===highlightUid);
   const label=isBuzz?'Premier à buzzer':i===0?'En tête':'';
   return `<div class="score-row ${isBuzz?'score-row--active':''} ${i===0?'score-row--leader':''}" style="--row-index:${i}" aria-label="${i+1}e place : ${esc(s.name)}, ${s.score} points">
     <span class="score-rank">${i+1}</span>
     <span class="score-avatar" aria-hidden="true">${esc(badge)}</span>
     <span class="score-name-wrap"><span class="score-name">${esc(s.name)}</span>${label?'<span class="score-note">'+label+'</span>':''}</span>
     <strong class="score-points">${Number(s.score)||0}<small>pts</small></strong>
   </div>`;
 }).join('');
}
function winner(){const id=roomData?.buzz?.uid;return id?(roomData?.players?.[id]||{name:'Joueur déconnecté'}):null;}
function renderTeacher(){const data=roomData||{};$('audioOutputMode').value=data.meta?.audioMode==='both'?'both':'pc';const winnerP=winner(),status=data.meta?.status||'closed',online=playerEntries().filter(p=>Date.now()-(p.lastSeen||0)<65000);$('roomCode').textContent=room;$('connectionBadge').textContent=status==='open'?'● Buzzers ouverts':'● Buzzers verrouillés';$('connectionBadge').style.background=status==='open'?'#4cb889':'#e89c64';$('teacherState').textContent=winnerP?'LE PLUS RAPIDE !':status==='open'?'LES BUZZERS SONT OUVERTS':'BUZZERS VERROUILLÉS';$('winnerDisplay').textContent=winnerP?'⚡ '+winnerP.name+(winnerP.team?' · '+winnerP.team:''):status==='open'?'À vos marques... BUZZ !':'✦ Prêt pour la prochaine manche ?';$('winnerDisplay').classList.toggle('won',!!winnerP);$('playerCount').textContent=online.length;$('playersList').innerHTML=playerEntries().sort((a,b)=>a.name.localeCompare(b.name)).map(p=>`<div class="player-item"><span><span class="player-dot" style="background:${Date.now()-(p.lastSeen||0)<65000?'#45c29b':'#d0d5e1'}"></span><strong style="display:inline">${esc(p.name)}</strong><small style="display:block;padding-left:18px">${esc(p.team||'Individuel')}</small></span><div class="player-manage"><strong>${Number(data.scores?.[p.uid]||0)} ★</strong><button type="button" class="kick-player" data-player-id="${esc(p.uid)}" aria-label="Retirer ${esc(p.name)} de la partie" title="Retirer ce joueur (réinscription autorisée)">✕ Retirer</button></div></div>`).join('')||'<p class="empty">Les élèves apparaîtront ici.</p>';$('scoreboardList').innerHTML=scoreboardRows(scoreEntries(),data.buzz?.uid);$('addPoint').disabled=!winnerP;$('subtractPoint').disabled=!winnerP;}
function renderStudent(){const data=roomData||{},status=data.meta?.status||'closed',win=data.buzz?.uid,btn=$('buzzButton');$('studentRoom').textContent='PARTIE '+room;$('studentName').textContent=data.players?.[me]?.name||'JOUEUR';$('myScore').textContent=data.scores?.[me]||0;const team=data.players?.[me]?.team||'';$('myTeam').textContent=team;$('myTeam').classList.toggle('hidden',!team);btn.disabled=status!=='open'||!!win;let title,hint;if(win===me){title='TU AS BUZZÉ EN PREMIER !';hint='Prépare ta réponse : le professeur t’écoute.';}else if(win){title='QUELQU’UN A BUZZÉ !';hint=`${data.players?.[win]?.name||'Un autre joueur'} a été plus rapide.`;}else if(status==='open'){title='À TOI DE JOUER !';hint='Appuie le plus vite possible sur le buzzer.';}else{title='EN ATTENTE DU PROFESSEUR';hint='Le professeur va bientôt ouvrir les buzzers.';}$('studentState').textContent=title;$('studentHint').textContent=hint;}
function renderProjection(){const d=roomData||{},w=winner(),status=d.meta?.status||'closed';$('projectionCode').textContent=room;$('projectionState').textContent=w?'PREMIER BUZZ !':status==='open'?'À VOUS DE BUZZER !':'PRÊTS À JOUER ?';$('projectionWinner').textContent=w?'⚡ '+w.name:'⚡';$('projectionPlayers').textContent=playerEntries().filter(p=>Date.now()-(p.lastSeen||0)<65000).length+' joueurs connectés';$('projectionScores').innerHTML=scoreboardRows(scoreEntries(),d.buzz?.uid,8);}
async function create(){
  if(!ensureConfigured('teacherAuthMsg'))return;
  const btn=$('createSession');btn.disabled=true;
  try{
    message('teacherAuthMsg','Connexion au compte professeur…');
    const u=await google();
    if(u.isAnonymous)throw Error('Le compte professeur doit utiliser Google.');
    const mode=$('mode').value;
    const teams=$('teamNames').value.split(',').map(s=>s.trim().slice(0,24)).filter(Boolean).slice(0,8);
    if(mode==='teams'&&teams.length<2)throw Error('Indique au moins deux équipes.');
    const code=makeCode();
    const meta={owner:u.uid,status:'closed',mode,audioMode:'pc',teams:mode==='teams'?teams:[],createdAt:Date.now()};
    message('teacherAuthMsg','Compte Google connecté. Création de la session '+code+'…');
    try{
      await set(ref(db,sessionsPath+'/'+code+'/meta'),meta);
    }catch(err){
      console.error('BUZZ ARENA - écriture meta Firebase refusée', {project:firebaseConfig.projectId, path:sessionsPath+'/'+code+'/meta', uid:u.uid, provider:u.providerData?.map(p=>p.providerId), error:err});
      throw Error('Écriture Firebase refusée (étape création). Projet : '+firebaseConfig.projectId+' ; chemin : /'+sessionsPath+'/'+code+'/meta ; connexion : '+(u.providerData?.map(p=>p.providerId).join(',')||'inconnue')+'. Vérifie que les règles de CE projet sont publiées. Détail : '+(err.code||err.message));
    }
    role='teacher';teacherSession=true;room=code;show('teacher');showJoinQR(code);
    message('teacherMsg','Session créée. Connexion à la régie…');
    listen(code);
    history.replaceState(null,'','?room='+code+'&view=teacher');
  }catch(err){message('teacherAuthMsg',fail(err));}
  finally{btn.disabled=false;}
}
async function loadTeamChoices(){if(!ready)return;const code=$('codeInput').value.trim().toUpperCase();$('joinTeamField').classList.add('hidden');if(code.length!==6)return;try{await anonymous();const s=await get(ref(db,sessionsPath+'/'+code+'/meta'));if(s.exists()&&s.val().mode==='teams'){$('chooseTeam').innerHTML=(s.val().teams||[]).map(n=>`<option value="${esc(n)}">${esc(n)}</option>`).join('');$('joinTeamField').classList.remove('hidden');}}catch{}}
async function join(e){e.preventDefault();if(!ensureConfigured('joinMsg'))return;const code=$('codeInput').value.trim().toUpperCase(),name=$('playerName').value.trim();if(!/^[A-HJ-NP-Z2-9]{6}$/.test(code)){message('joinMsg','Le code doit contenir 6 caractères.');return;}if(name.length<2){message('joinMsg','Entre un prénom ou pseudo (au moins 2 caractères).');return;}try{const u=await anonymous(),snap=await get(ref(db,sessionsPath+'/'+code+'/meta'));if(!snap.exists())throw Error('Partie introuvable. Vérifie le code.');const meta=snap.val();let team='';if(meta.mode==='teams'){team=$('chooseTeam').value;if(!meta.teams.includes(team))throw Error('Sélectionne une équipe valide.');}await set(ref(db,`${sessionsPath}/${code}/players/${u.uid}`),{name:name.slice(0,22),team,sound:selectedSound($('soundChoice').value),lastSeen:Date.now()});me=u.uid;role='student';listen(code);show('student');history.replaceState(null,'','?room='+code);heartbeat=setInterval(()=>{if(role==='student'&&room)update(ref(db,`${sessionsPath}/${room}/players/${me}`),{lastSeen:Date.now()}).catch(()=>{});},25000);}catch(err){message('joinMsg',fail(err));}}
async function kickPlayer(uid){
  if(role!=='teacher'||!room||!roomData?.players?.[uid])return;
  const name=roomData.players[uid].name||'ce joueur';
  if(!window.confirm('Retirer « '+name+' » de cette partie ? Son pseudo et ses points disparaîtront, mais il pourra rejoindre à nouveau avec un autre pseudo.'))return;
  const changes={['players/'+uid]:null,['scores/'+uid]:null};
  if(roomData.buzz?.uid===uid)changes.buzz=null;
  try{
    await update(ref(db,sessionsPath+'/'+room),changes);
    message('teacherMsg',name+' a été retiré. Il peut rejoindre à nouveau avec un pseudo correct.');
  }catch(err){message('teacherMsg','Impossible de retirer ce joueur : '+fail(err));}
}
$('playersList').addEventListener('click',event=>{
  const button=event.target.closest('button.kick-player');
  if(button&&$('playersList').contains(button))kickPlayer(button.dataset.playerId);
});
async function teacherAction(patch){if(role!=='teacher'||!room)return;try{await update(ref(db,sessionsPath+'/'+room+'/meta'),patch);message('teacherMsg','');}catch(e){message('teacherMsg',fail(e));}}
async function reset(){if(role!=='teacher')return;try{await teacherAction({status:'closed'});await set(ref(db,`${sessionsPath}/${room}/buzz`),null);await teacherAction({status:'open'});}catch(e){message('teacherMsg',fail(e));}}
async function buzz(){if(!room||role!=='student'||!me||!roomData||roomData.meta.status!=='open'||roomData.buzz)return;const button=$('buzzButton');button.disabled=true;try{const t=await runTransaction(ref(db,`${sessionsPath}/${room}/buzz`),v=>v===null?{uid:me,at:Date.now()}:undefined,{applyLocally:false});if(!t.committed)message('studentHint','Un autre élève a buzzé avant toi !');}catch(e){message('studentHint',fail(e));button.disabled=false;}}
async function award(delta){const id=roomData?.buzz?.uid;if(!id||role!=='teacher')return;const old=Number(roomData.scores?.[id]||0);try{await runTransaction(ref(db,`${sessionsPath}/${room}/scores/${id}`),value=>Math.max(0,Math.min(100000,Number(value||0)+delta)));message('teacherMsg',delta>0?'Point attribué !':'Score corrigé.');}catch(e){message('teacherMsg',fail(e));}}
async function copyLink(){const url=new URL(location.href);url.search='?room='+room;try{await navigator.clipboard.writeText(url.href);message('teacherMsg','Lien élève copié.');}catch{message('teacherMsg','Lien élève : '+url.href);}}
function exportCSV(){const rows=[['Nom','Équipe','Points'],...playerEntries().map(p=>[p.name,p.team||'',String(roomData?.scores?.[p.uid]||0)])];const csv='\ufeff'+rows.map(r=>r.map(s=>'"'+String(s).replaceAll('"','""')+'"').join(';')).join('\r\n');const blob=new Blob([csv],{type:'text/csv;charset=utf-8'});const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download='buzz-arena-'+room+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(u),2000);}
function projection(){if(!room)return;window.open(location.origin+location.pathname+'?room='+room+'&view=projection','_blank','noopener');}
async function viewProjection(code){if(!ensureConfigured('joinMsg')){show('join');return;}try{await anonymous();const s=await get(ref(db,sessionsPath+'/'+code+'/meta'));if(!s.exists())throw Error('Partie introuvable.');role='projection';listen(code);show('projection');}catch(e){show('join');message('joinMsg',fail(e));}}
bind('goTeacher',()=>show('teacherAuth'));bind('goStudent',()=>show('join'));document.querySelectorAll('[data-target]').forEach(b=>b.addEventListener('click',()=>show(b.dataset.target)));bind('createSession',create);$('mode').addEventListener('change',()=> $('teamField').classList.toggle('hidden',$('mode').value!=='teams'));$('joinForm').addEventListener('submit',join);$('codeInput').addEventListener('input',()=>{$('codeInput').value=$('codeInput').value.toUpperCase().replace(/[^A-HJ-NP-Z2-9]/g,'');loadTeamChoices();});bind('previewSound',()=>playSelectedSound($('soundChoice').value,'joinMsg'));$('audioOutputMode').addEventListener('change',async()=>{const mode=$('audioOutputMode').value;await teacherAction({audioMode:mode});message('teacherMsg',mode==='both'?'Son diffusé sur le PC et les smartphones (si les navigateurs le permettent).':'Son diffusé uniquement sur le PC.');});bind('enableTeacherSound',()=>{teacherAudioEnabled=true;playSelectedSound('tv','teacherMsg');$('enableTeacherSound').textContent='♫ Son du PC activé';});bind('enableProjectionSound',()=>{projectionAudioEnabled=true;playSelectedSound('tv');$('enableProjectionSound').textContent='♫ Son activé';});bind('buzzButton',buzz);bind('openBuzz',()=>teacherAction({status:'open'}));bind('closeBuzz',()=>teacherAction({status:'closed'}));bind('resetBuzz',reset);bind('addPoint',()=>award(1));bind('subtractPoint',()=>award(-1));bind('copyLink',copyLink);bind('exportResults',exportCSV);bind('project',projection);bind('exitTeacher',resetView);bind('exitStudent',resetView);bind('exitProjection',resetView);
const params=new URLSearchParams(location.search),precode=(params.get('room')||'').toUpperCase();if(/^[A-HJ-NP-Z2-9]{6}$/.test(precode)){if(params.get('view')==='projection')viewProjection(precode);else if(params.get('view')==='teacher'){if(!ready){show('teacherAuth');message('teacherAuthMsg','Configure Firebase pour accéder à la régie.');}else{show('teacherAuth');message('teacherAuthMsg','Reconnecte-toi pour créer une nouvelle session ou ouvre la régie dans ton onglet d’origine.');}}else{$('codeInput').value=precode;show('join');loadTeamChoices();}}
