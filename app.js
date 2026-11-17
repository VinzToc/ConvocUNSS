/* ConvocUNSS — génération des convocations PDF des compétitions UNSS (4 × A6 par page A4).
   Intégration Mes Apps EPS (eps-core.js) : identifiant d'application « convocunss », mode « lignes ». */
(function(){
'use strict';
const APP='convocunss',KEY='convocunss_v1';
const $=id=>document.getElementById(id);
const FIELDS=['activite','dateCompet','lieuCompet','horaireRdv','lieuRdv','retour','etablissement','prof','tel','infosComp'];
const OPTS=['oClasse','oCoupe','oRecap','oSave'];
const S={eleves:[],logos:{etab:null,as:null},pv:0,unss:null,eps:[],epsOK:false};
const norm=s=>(s==null?'':String(s)).normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const v=id=>($(id).value||'').trim();
const todayISO=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};

/* ---------- toasts & messages ---------- */
let tt;function toast(m,ko){const t=$('toast');t.textContent=m;t.classList.toggle('ko',!!ko);t.classList.add('on');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('on'),3800)}
const msg=(id,m)=>{$(id).textContent=m||''};

/* ---------- sauvegarde locale ---------- */
function save(){try{const f={};FIELDS.forEach(k=>f[k]=$(k).value);const o={};OPTS.forEach(k=>o[k]=$(k).checked);
 localStorage.setItem(KEY,JSON.stringify({f,o,eleves:S.eleves,logos:S.logos}))}catch(e){}}
function load(){let d=null;try{d=JSON.parse(localStorage.getItem(KEY)||'null')}catch(e){}
 if(d){FIELDS.forEach(k=>{if(d.f&&d.f[k]!=null)$(k).value=d.f[k]});OPTS.forEach(k=>{if(d.o&&k in d.o)$(k).checked=!!d.o[k]});
  S.eleves=Array.isArray(d.eleves)?d.eleves:[];S.logos=Object.assign({etab:null,as:null},d.logos||{})}
 else{const n=new Date();n.setDate(n.getDate()+7);
  $('dateCompet').value=n.getFullYear()+'-'+String(n.getMonth()+1).padStart(2,'0')+'-'+String(n.getDate()).padStart(2,'0');
  $('horaireRdv').value='13:15';$('lieuRdv').value='Devant la vie scolaire';
  $('infosComp').value="Prévoir une tenue de sport adaptée, une gourde, un goûter et la licence UNSS."}}

/* ---------- formats ---------- */
function fmtDate(iso,long){if(!iso)return'';const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);if(!m)return iso;const d=new Date(+m[1],m[2]-1,+m[3]);
 if(!long)return d.toLocaleDateString('fr-FR');const s=d.toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'});return s.charAt(0).toUpperCase()+s.slice(1)}
const fmtH=h=>{const m=/^(\d{1,2}):(\d{2})/.exec(h||'');return m?(+m[1])+'h'+m[2]:(h||'')};
function cfg(){return{act:v('activite'),dateISO:v('dateCompet'),date:fmtDate(v('dateCompet'),true),lieu:v('lieuCompet'),h:fmtH(v('horaireRdv')),lieuRdv:v('lieuRdv'),
 retour:v('retour'),etab:v('etablissement'),prof:v('prof'),tel:v('tel'),infos:($('infosComp').value||'').trim(),
 oClasse:$('oClasse').checked,oCoupe:$('oCoupe').checked,oRecap:$('oRecap').checked,oSave:$('oSave').checked}}
const rdvTxt=c=>[c.h,c.lieuRdv].filter(Boolean).join(' - ');
const profTxt=c=>{const p=[];if(c.prof)p.push('Accompagnateur : '+c.prof);if(c.tel)p.push('Tél. '+c.tel);return p.join('  ·  ')};
const subTxt=e=>{const p=[];if(e.classe)p.push('Classe : '+e.classe);if(e.cat)p.push('Catégorie : '+e.cat);return p.join('   ·   ')};

/* ---------- logos ---------- */
function imgToPng(src,max){return new Promise((ok,ko)=>{const i=new Image();i.onload=()=>{let w=i.naturalWidth,h=i.naturalHeight;const r=Math.min(1,max/Math.max(w,h));w=Math.round(w*r);h=Math.round(h*r);
 const c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(i,0,0,w,h);ok({src:c.toDataURL('image/png'),w,h})};i.onerror=()=>ko(new Error('Image illisible'));i.src=src})}
function readFile(f){return new Promise((ok,ko)=>{const r=new FileReader();r.onload=()=>ok(r.result);r.onerror=()=>ko(r.error);r.readAsDataURL(f)})}
async function setLogo(k,file){if(!file)return;try{S.logos[k]=await imgToPng(await readFile(file),600);save();renderLogos();renderPreview();toast('Logo enregistré')}catch(e){toast('Image illisible.',true)}}
function renderLogos(){[['etab','pvEtab','ppEtab','Logo<br>établissement','Logo étab.'],['as','pvAs','ppAs','Logo<br>AS','AS']].forEach(([k,a,b,ta,tb])=>{const L=S.logos[k];
 $(a).innerHTML=L?`<img src="${L.src}" alt="">`:ta;$(a).classList.toggle('ok',!!L);
 $(b).innerHTML=L?`<img src="${L.src}" alt="">`:`<span>${tb}</span>`;$(b).classList.toggle('has',!!L);
 document.querySelector(`[data-del="${k}"]`).hidden=!L})}

/* ---------- liste des élèves ---------- */
function renderList(){const L=$('liste');$('nb').textContent=S.eleves.length;
 if(!S.eleves.length){L.innerHTML='';renderPreview();return}
 L.innerHTML='<div class="el hd"><span>#</span><span>Nom</span><span>Prénom</span><span>Classe</span><span>Cat.</span><span></span></div>'+
 S.eleves.map((e,i)=>`<div class="el" data-i="${i}"><span class="n" title="${e.id?'Relié à Mes Apps EPS':''}" style="${e.id?'color:var(--ok)':''}">${i+1}</span>`+
  `<input class="nom" data-k="nom" value="${esc(e.nom)}" placeholder="NOM" aria-label="Nom"><input data-k="prenom" value="${esc(e.prenom)}" placeholder="Prénom" aria-label="Prénom">`+
  `<input class="cl" data-k="classe" value="${esc(e.classe)}" placeholder="Classe" aria-label="Classe"><input class="ct" data-k="cat" value="${esc(e.cat)}" placeholder="Cat." aria-label="Catégorie">`+
  `<button class="x" data-x="${i}" aria-label="Retirer">✕</button></div>`).join('');
 if(S.pv>=S.eleves.length)S.pv=Math.max(0,S.eleves.length-1);renderPreview()}
function addEleves(list,replace){const out=replace?[]:S.eleves.slice();const seen=new Set(out.map(e=>norm(e.nom)+'_'+norm(e.prenom)));let n=0;
 list.forEach(e=>{const k=norm(e.nom)+'_'+norm(e.prenom);if(!e.nom&&!e.prenom||seen.has(k))return;seen.add(k);out.push(e);n++});S.eleves=out;linkEps();save();renderList();return n}

/* ---------- aperçu ---------- */
function renderPreview(){const c=cfg(),n=S.eleves.length;if(S.pv>=n)S.pv=Math.max(0,n-1);const e=S.eleves[S.pv]||{nom:'DUPONT',prenom:'Jean',classe:'2de 1',cat:'MG'};
 $('ppNom').textContent=((e.nom||'NOM')+' '+(e.prenom||'')).trim();$('ppCl').textContent=c.oClasse?subTxt(e):'';
 $('ppAct').textContent=c.act||'-';$('ppDate').textContent=c.date||'-';$('ppLieu').textContent=c.lieu||'-';
 $('ppRdv').textContent=rdvTxt(c)||'-';$('ppRet').textContent=c.retour?'Retour prévu : '+c.retour:'';
 $('ppInf').textContent=c.infos;$('ppInfW').hidden=!c.infos;$('ppProf').textContent=profTxt(c);$('ppEtabN').textContent=c.etab;
 $('pvIdx').textContent=n?`${S.pv+1} / ${n}`:'exemple';$('pvPrev').disabled=S.pv<=0;$('pvNext').disabled=S.pv>=n-1}

/* ---------- import de l'export UNSS ---------- */
const AL={nom:['nom','nomeleve','nomlicencie','nomdulicencie','nomfamille','nomdefamille','nomdusage','eleve','eleves','licencie','licencies','participant'],
 nomprenom:['nomprenom','nometprenom','nomprenoms','identite','nomcomplet'],
 prenom:['prenom','prenoms','prenomeleve','prenomlicencie','prenomdulicencie'],
 classe:['classe','division','classeeleve','niveauclasse'],
 cat:['categorie','cat','categoriedage','categorieage','categ','categoriesexe'],
 act:['activite','sport','discipline','libelleactivite','activitesportive','libellecompetition','competition','intitulecompetition','epreuve']};
function colIdx(h,k){const n=h.map(norm);for(const a of AL[k]){const i=n.indexOf(a);if(i>=0)return i}
 if(k==='nom'){return n.findIndex(x=>x.startsWith('nom')&&!/etab|ecole|equipe|activ|compet|prof|resp|club|as$|prenom|naiss|usage/.test(x))}
 if(k==='prenom')return n.findIndex(x=>x.startsWith('prenom'));
 if(k==='cat')return n.findIndex(x=>x.startsWith('categ'));return -1}
const splitName=s=>{if(window.EPS&&EPS.splitName)return EPS.splitName(s);const w=String(s).trim().split(/\s+/);return[w[0]||'',w.slice(1).join(' ')]};
function parseRows(rows){let hi=-1,ix={};
 for(let r=0;r<Math.min(rows.length,25);r++){const h=(rows[r]||[]).map(x=>String(x==null?'':x));const t={};for(const k in AL)t[k]=colIdx(h,k);
  if((t.nom>=0&&t.prenom>=0)||t.nomprenom>=0||(t.nom>=0&&h.filter(Boolean).length>=2)){hi=r;ix=t;break}}
 if(hi<0)return null;const out=[];let act='';
 for(const r of rows.slice(hi+1)){if(!r)continue;const g=i=>i>=0&&r[i]!=null?String(r[i]).trim():'';
  let nom=g(ix.nom),prenom=g(ix.prenom);
  if(!nom&&!prenom&&ix.nomprenom>=0){[nom,prenom]=splitName(g(ix.nomprenom))}
  else if(nom&&ix.prenom<0){[nom,prenom]=splitName(nom)}
  if(!nom&&!prenom)continue;
  out.push({nom:nom.toUpperCase(),prenom:prenom.replace(/(^|[\s-])\S/g,m=>m.toUpperCase()),classe:g(ix.classe),cat:g(ix.cat)});
  if(!act&&ix.act>=0)act=g(ix.act)}
 return{eleves:out,act}}
async function importUnss(file){if(!file)return;try{
 if(!window.XLSX)throw new Error('Lecteur Excel indisponible.');
 const wb=XLSX.read(new Uint8Array(await file.arrayBuffer()),{type:'array',cellDates:false});let res=null;
 for(const n of wb.SheetNames){const rows=XLSX.utils.sheet_to_json(wb.Sheets[n],{header:1,defval:'',raw:false});const p=parseRows(rows);if(p&&p.eleves.length){res=p;break}}
 if(!res)throw new Error("Colonnes « Nom » et « Prénom » introuvables dans ce fichier.");
 const rep=!S.eleves.length||confirm(`${res.eleves.length} élève(s) trouvés.\n\nOK : remplacer la liste actuelle (${S.eleves.length} élève(s)).\nAnnuler : les ajouter à la liste.`);
 if(res.act){$('activite').value=res.act}
 await refreshEps();const n=addEleves(res.eleves,rep);
 const lk=S.eleves.filter(e=>e.id).length;
 toast(`${n} élève(s) importé(s)`+(S.epsOK&&S.eps.length?` · ${lk} relié(s) à Mes Apps EPS`:''));onForm()}
 catch(e){console.error(e);toast(e.message||'Fichier illisible.',true)}}

/* ---------- Mes Apps EPS ---------- */
async function refreshEps(){try{S.eps=await EPS.all();S.epsOK=true}catch(e){S.eps=[];S.epsOK=false}renderEpsInfo()}
function renderEpsInfo(){const el=$('epsInfo');
 if(!S.epsOK){el.textContent="⚠ Mes Apps EPS n'est pas accessible dans ce navigateur : utilisez l'export .xlsx.";return}
 if(!S.eps.length){el.innerHTML="Aucune liste d'élèves sur cet appareil. Importez d'abord votre fichier Pronote dans <b>Mes Apps EPS</b>, ou utilisez « Charger la liste ».";return}
 const lk=S.eleves.filter(e=>e.id).length,cls=new Set(S.eps.map(e=>e.classe).filter(Boolean)).size;
 el.textContent=`✅ ${S.eps.length} élèves (${cls} classes) dans Mes Apps EPS · ${lk} / ${S.eleves.length} convoqué(s) relié(s).`}
function matchEps(e){if(!S.eps.length)return null;if(e.id&&S.eps.some(x=>x.id===e.id))return S.eps.find(x=>x.id===e.id);
 let c=S.eps.filter(x=>norm(x.nom)===norm(e.nom)&&norm(x.prenom)===norm(e.prenom));
 if(!c.length){const full=norm(e.nom+e.prenom);c=S.eps.filter(x=>norm(x.nom+x.prenom)===full||norm(x.prenom+x.nom)===full)}
 if(c.length>1&&e.classe)c=c.filter(x=>norm(x.classe)===norm(e.classe));return c.length===1?c[0]:null}
function linkEps(){S.eleves.forEach(e=>{const m=matchEps(e);if(m){e.id=m.id;if(!e.classe&&m.classe)e.classe=m.classe}else delete e.id});renderEpsInfo()}
function ligne(c){const l={Date:c.dateISO||todayISO(),'Activité':c.act||'',Lieu:c.lieu||'','Rendez-vous':rdvTxt(c)};if(c.retour)l['Retour']=c.retour;return l}
async function saveEps(quiet){const c=cfg();if(!S.eleves.length){msg('msgE','Aucun élève dans la liste.');return null}
 await refreshEps();if(!S.epsOK||!S.eps.length){if(!quiet)msg('msgE',"⚠ Aucune liste d'élèves Mes Apps EPS sur cet appareil : rien n'a été enregistré.");return null}
 linkEps();let ok=0,ko=[];for(const e of S.eleves){const m=e.id;if(!m){ko.push((e.nom+' '+e.prenom).trim());continue}
  try{await EPS.addLigne(APP,m,Object.assign({},ligne(c),e.cat?{'Catégorie':e.cat}:{}));ok++}catch(x){ko.push((e.nom+' '+e.prenom).trim())}}
 save();renderList();const t=`💾 ${ok} convocation(s) enregistrée(s) dans Mes Apps EPS`+(ko.length?` · ${ko.length} élève(s) absent(s) de la liste : ${ko.slice(0,6).join(', ')}${ko.length>6?'…':''}`:'.');
 msg('msgE',t);return{ok,ko}}
async function exportEps(){await refreshEps();linkEps();const ids=S.eleves.map(e=>e.id).filter(Boolean);
 if(!ids.length){msg('msgE','Aucun élève convoqué relié à Mes Apps EPS : rien à exporter.');return}
 try{EPS.downloadXLSX(await EPS.exportXLSX({ids,apps:[APP]}),`ConvocUNSS_${todayISO()}.xlsx`);msg('msgE',`⬇ Fichier exporté (${ids.length} élève(s)). Importez-le dans Mes Apps EPS sur un autre appareil.`)}
 catch(e){msg('msgE',"⚠ "+(e.message||e)+" Enregistrez d'abord les convocations.")}}
async function loadEpsList(file){if(!file)return;try{const r=await EPS.importFile(file);await refreshEps();linkEps();save();renderList();
 toast(`Liste chargée : ${r.add||0} ajouté(s), ${r.upd||0} mis à jour`)}catch(e){toast(e.message||'Fichier illisible.',true)}}

/* ---------- choisir dans Mes Apps EPS ---------- */
const PK=new Set();
async function openPick(){await refreshEps();if(!S.epsOK||!S.eps.length){toast("Aucune liste d'élèves dans Mes Apps EPS sur cet appareil.",true);return}
 PK.clear();const cl=[...new Set(S.eps.map(e=>e.classe||'—'))].sort((a,b)=>a.localeCompare(b,'fr',{numeric:true}));
 $('pkC').innerHTML='<option value="">Toutes les classes</option>'+cl.map(c=>`<option>${esc(c)}</option>`).join('');$('pkS').value='';renderPick();$('pick').hidden=false}
function pickList(){const c=$('pkC').value,q=norm($('pkS').value);
 return S.eps.filter(e=>(!c||(e.classe||'—')===c)&&(!q||norm(e.nom+e.prenom+e.classe).includes(q)))
  .sort((a,b)=>(a.classe||'').localeCompare(b.classe||'','fr',{numeric:true})||(a.nom+a.prenom).localeCompare(b.nom+b.prenom,'fr'))}
function renderPick(){const L=pickList(),in_=new Set(S.eleves.map(e=>e.id).filter(Boolean));let g=null,h='';
 L.forEach(e=>{const k=e.classe||'—';if(k!==g){g=k;h+=`<div class="grp">${esc(k)}</div>`}
  const dis=in_.has(e.id);h+=`<label><input type="checkbox" data-id="${esc(e.id)}" ${PK.has(e.id)||dis?'checked':''} ${dis?'disabled':''}> ${esc(e.nom)} ${esc(e.prenom)}<small>${dis?'déjà convoqué(e)':''}</small></label>`});
 $('pkL').innerHTML=h||'<p class="rgpd" style="padding:12px">Aucun élève.</p>';$('pkN').textContent=PK.size+' sélectionné(s)'}

/* ---------- PDF ---------- */
const MAPC={'’':"'",'‘':"'",'“':'"','”':'"','«':'"','»':'"','–':'-','—':'-','…':'...','œ':'oe','Œ':'OE',' ':' ',' ':' ','€':'EUR'};
const T=s=>String(s==null?'':s).replace(/[‘’“”–—…œŒ  €]/g,c=>MAPC[c]).replace(/[^\x09\x0A\x0D\x20-\xFF]/g,'');
const fit=(L,mw,mh)=>{const r=Math.min(mw/L.w,mh/L.h);return{w:L.w*r,h:L.h*r}};
const NAVY=[13,45,110],ORANGE=[255,138,31];
function drawCard(doc,x,y,e,c){const CW=105,CH=148.5,mx=x+9,W=CW-18,R=mx+W;
 doc.setLineDashPattern([],0);doc.setDrawColor(203,213,225);doc.setLineWidth(0.25);doc.roundedRect(x+4,y+4,CW-8,CH-8,2,2,'S');
 let cy=y+9;const LH=13;
 if(S.logos.etab){const f=fit(S.logos.etab,24,LH);doc.addImage(S.logos.etab.src,'PNG',mx,cy+(LH-f.h)/2,f.w,f.h,'etab','FAST')}
 let rx=R;if(S.unss){const f=fit(S.unss,20,10.5);rx-=f.w;doc.addImage(S.unss.src,'PNG',rx,cy+(LH-f.h)/2,f.w,f.h,'unss','FAST');rx-=2.5}
 if(S.logos.as){const f=fit(S.logos.as,17,LH);rx-=f.w;doc.addImage(S.logos.as.src,'PNG',rx,cy+(LH-f.h)/2,f.w,f.h,'as','FAST')}
 cy+=LH+3;
 // bandeau titre
 doc.setFillColor(...NAVY);doc.roundedRect(mx,cy,W,10,1.2,1.2,'F');doc.setFillColor(...ORANGE);doc.rect(mx,cy+9,W,1.1,'F');
 doc.setFont('helvetica','bold');doc.setFontSize(13);doc.setTextColor(255,255,255);const ttl='CONVOCATION',cs=1;doc.setCharSpace(cs);
 const tw=doc.getTextWidth(ttl)+cs*(ttl.length-1);doc.text(ttl,mx+(W-tw)/2,cy+6.6);doc.setCharSpace(0);
 cy+=14;
 // élève
 const nm=T(((e.nom||'')+' '+(e.prenom||'')).trim())||' ';let fs=13;doc.setFont('helvetica','bold');
 while(fs>9){doc.setFontSize(fs);if(doc.getTextWidth(nm)<=W-8)break;fs-=0.5}doc.setFontSize(fs);
 const nl=doc.splitTextToSize(nm,W-8).slice(0,2),sub=c.oClasse?T(subTxt(e)):'';const lh=fs*0.42;
 const bh=6+nl.length*lh+(sub?4.4:0)+1.5;
 doc.setFillColor(234,242,255);doc.roundedRect(mx,cy,W,bh,1.2,1.2,'F');
 doc.setFontSize(6.5);doc.setTextColor(100,116,139);doc.setCharSpace(0.3);doc.text('ÉLÈVE CONVOQUÉ(E)',mx+4,cy+4);doc.setCharSpace(0);
 doc.setFontSize(fs);doc.setTextColor(15,23,42);doc.text(nl,mx+4,cy+5.2+lh,{lineHeightFactor:1.15});
 if(sub){doc.setFont('helvetica','normal');doc.setFontSize(8);doc.setTextColor(51,65,85);doc.text(sub,mx+4,cy+bh-2.6)}
 cy+=bh+5;
 // détails
 const LW=17;[['Activité',c.act],['Date',c.date],['Lieu',c.lieu]].forEach(([l,val])=>{doc.setFont('helvetica','bold');doc.setFontSize(9);doc.setTextColor(...NAVY);doc.text(l,mx,cy);
  doc.setFont('helvetica','normal');doc.setTextColor(15,23,42);const ls=doc.splitTextToSize(T(val||'-'),W-LW).slice(0,2);doc.text(ls,mx+LW,cy,{lineHeightFactor:1.15});cy+=ls.length*4.2+1.2});
 cy+=1.5;
 // rendez-vous
 doc.setFont('helvetica','bold');doc.setFontSize(9.5);const rl=doc.splitTextToSize(T(rdvTxt(c)||'-'),W-8).slice(0,2);
 doc.setFont('helvetica','normal');doc.setFontSize(8);const rt=c.retour?doc.splitTextToSize(T('Retour prévu : '+c.retour),W-8).slice(0,2):[];
 const rh=5.5+rl.length*4.3+rt.length*3.6+1.5;
 doc.setFillColor(255,244,214);doc.roundedRect(mx,cy,W,rh,1,1,'F');doc.setFillColor(...ORANGE);doc.rect(mx,cy,1.3,rh,'F');
 doc.setFont('helvetica','bold');doc.setFontSize(7);doc.setTextColor(180,83,9);doc.setCharSpace(0.3);doc.text('RENDEZ-VOUS',mx+4,cy+4);doc.setCharSpace(0);
 doc.setFontSize(9.5);doc.setTextColor(15,23,42);doc.text(rl,mx+4,cy+8.3,{lineHeightFactor:1.15});
 if(rt.length){doc.setFont('helvetica','normal');doc.setFontSize(8);doc.setTextColor(51,65,85);doc.text(rt,mx+4,cy+8.3+rl.length*4.3,{lineHeightFactor:1.15})}
 cy+=rh+4.5;
 // pied
 const bot=y+CH-8.5,pt=T(profTxt(c));let py=bot;doc.setFont('helvetica','normal');doc.setFontSize(7.2);
 const pl=pt?doc.splitTextToSize(pt,W).slice(0,2):[];const sep=bot-3.4-pl.length*3.2;
 doc.setDrawColor(219,226,234);doc.setLineWidth(0.25);doc.line(mx,sep,R,sep);
 if(pl.length){doc.setTextColor(51,65,85);doc.text(pl,mx,sep+3.3,{lineHeightFactor:1.2})}
 doc.setFontSize(7.2);doc.setTextColor(100,116,139);doc.text(doc.splitTextToSize(T(c.etab),W*0.62)[0]||'',mx,py);doc.text('Association Sportive',R,py,{align:'right'});
 // informations (dans l'espace restant)
 if(c.infos){const top=cy,lim=sep-2;if(lim-top>6){doc.setFont('helvetica','bold');doc.setFontSize(7.8);doc.setTextColor(15,23,42);doc.text('Informations utiles',mx,top+3);
  doc.setFont('helvetica','normal');doc.setFontSize(7.8);doc.setTextColor(71,85,105);let ls=doc.splitTextToSize(T(c.infos),W);const lh2=3.4,max=Math.max(0,Math.floor((lim-(top+3))/lh2));
  if(ls.length>max){ls=ls.slice(0,max);if(max)ls[max-1]=ls[max-1].replace(/\s*\S{0,3}$/,'')+'...'}if(ls.length)doc.text(ls,mx,top+3+lh2,{lineHeightFactor:1.25})}}}
function cutLines(doc){doc.setDrawColor(150,150,150);doc.setLineWidth(0.2);doc.setLineDashPattern([2,1.6],0);doc.line(105,0,105,297);doc.line(0,148.5,210,148.5);doc.setLineDashPattern([],0);
 doc.setFont('helvetica','normal');doc.setFontSize(6);doc.setTextColor(150,150,150);doc.text('- - découper - -',106,147.6)}
function recap(doc,c){doc.addPage();let y=18;const head=()=>{doc.setFillColor(...NAVY);doc.rect(15,y,180,8,'F');doc.setFont('helvetica','bold');doc.setFontSize(8.5);doc.setTextColor(255,255,255);
  [['N°',17],['NOM',27],['Prénom',82],['Classe',130],['Catégorie',152],['Présent',178]].forEach(([t,x])=>doc.text(t,x,y+5.4));y+=8};
 doc.setFont('helvetica','bold');doc.setFontSize(15);doc.setTextColor(...NAVY);doc.text(T('Liste des élèves convoqués - '+(c.act||'Compétition UNSS')),15,y);
 if(S.unss){const f=fit(S.unss,22,12);doc.addImage(S.unss.src,'PNG',195-f.w,y-9,f.w,f.h,'unss','FAST')}
 y+=7;doc.setFont('helvetica','normal');doc.setFontSize(9.5);doc.setTextColor(51,65,85);
 [c.date&&'Date : '+c.date,c.lieu&&'Lieu : '+c.lieu,rdvTxt(c)&&'Rendez-vous : '+rdvTxt(c),c.retour&&'Retour prévu : '+c.retour,profTxt(c),c.etab&&c.etab+' - Association Sportive'].filter(Boolean).forEach(l=>{doc.text(T(l),15,y);y+=5});
 doc.text(T(`${S.eleves.length} élève(s) convoqué(s)`),15,y);y+=5;head();
 S.eleves.forEach((e,i)=>{if(y>280){doc.addPage();y=18;head()}if(i%2){doc.setFillColor(243,246,251);doc.rect(15,y,180,7,'F')}
  doc.setFont('helvetica','normal');doc.setFontSize(9);doc.setTextColor(15,23,42);doc.text(String(i+1),17,y+4.8);doc.setFont('helvetica','bold');doc.text(doc.splitTextToSize(T(e.nom),52)[0]||'',27,y+4.8);
  doc.setFont('helvetica','normal');doc.text(doc.splitTextToSize(T(e.prenom),46)[0]||'',82,y+4.8);doc.text(T(e.classe||''),130,y+4.8);doc.text(T(e.cat||''),152,y+4.8);
  doc.setDrawColor(148,163,184);doc.rect(181,y+1.3,4.4,4.4);y+=7});
 doc.setFontSize(7.5);doc.setTextColor(148,163,184);doc.text(T('Généré avec ConvocUNSS le '+fmtDate(todayISO())),15,290)}
async function genPdf(){const c=cfg();if(!S.eleves.length){toast('Ajoutez au moins un élève.',true);return}
 if(!window.jspdf){toast('Générateur PDF indisponible.',true);return}
 const{jsPDF}=window.jspdf;const doc=new jsPDF({orientation:'portrait',unit:'mm',format:'a4',compress:true});
 S.eleves.forEach((e,i)=>{const p=i%4;if(i&&!p)doc.addPage();if(!p&&c.oCoupe)cutLines(doc);drawCard(doc,(p%2)*105,Math.floor(p/2)*148.5,e,c)});
 if(c.oRecap)recap(doc,c);
 doc.setProperties({title:T('Convocations UNSS - '+(c.act||'')),creator:'ConvocUNSS'});
 const slug=(c.act||'competition').normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^A-Za-z0-9]+/g,'_').replace(/^_|_$/g,'');
 doc.save(`Convocations_UNSS_${slug}${c.dateISO?'_'+c.dateISO:''}.pdf`);
 const pages=Math.ceil(S.eleves.length/4);let t=`📄 PDF généré : ${S.eleves.length} convocation(s) sur ${pages} page(s) A4.`;
 if(c.oSave){const r=await saveEps(true);if(r)t+=` 💾 ${r.ok} enregistrée(s) dans Mes Apps EPS.`}
 msg('msg',t);toast('PDF téléchargé')}

/* ---------- événements ---------- */
function onForm(){save();renderPreview()}
async function init(){$('ver').textContent=typeof APP_VERSION!=='undefined'?APP_VERSION:'';load();renderLogos();renderList();
 try{const r=await fetch('icons/logo-unss.png');S.unss=await imgToPng(await readFile(await r.blob()),400)}catch(e){S.unss=null}
 FIELDS.forEach(k=>$(k).addEventListener('input',onForm));OPTS.forEach(k=>$(k).addEventListener('change',onForm));
 $('fEtab').onchange=e=>{setLogo('etab',e.target.files[0]);e.target.value=''};$('fAs').onchange=e=>{setLogo('as',e.target.files[0]);e.target.value=''};
 document.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{S.logos[b.dataset.del]=null;save();renderLogos()});
 $('fUnss').onchange=e=>{importUnss(e.target.files[0]);e.target.value=''};
 $('bAdd').onclick=()=>{S.eleves.push({nom:'',prenom:'',classe:'',cat:''});save();renderList();S.pv=S.eleves.length-1;renderPreview();const r=$('liste').querySelector(`[data-i="${S.eleves.length-1}"] input`);if(r)r.focus()};
 $('liste').addEventListener('input',e=>{const t=e.target,row=t.closest('[data-i]');if(!row||!t.dataset.k)return;const i=+row.dataset.i;
  S.eleves[i][t.dataset.k]=t.dataset.k==='nom'?t.value.toUpperCase():t.value;if(t.dataset.k==='nom'||t.dataset.k==='prenom')delete S.eleves[i].id;S.pv=i;save();renderPreview()});
 $('liste').addEventListener('change',e=>{if(e.target.dataset.k==='nom'||e.target.dataset.k==='prenom'){linkEps();save();renderList()}});
 $('liste').addEventListener('focusin',e=>{const row=e.target.closest('[data-i]');if(row){S.pv=+row.dataset.i;renderPreview()}});
 $('liste').addEventListener('click',e=>{const x=e.target.closest('[data-x]');if(!x)return;S.eleves.splice(+x.dataset.x,1);save();renderList();renderEpsInfo()});
 $('bSort').onclick=()=>{S.eleves.sort((a,b)=>(a.nom+' '+a.prenom).localeCompare(b.nom+' '+b.prenom,'fr'));save();renderList()};
 $('bSortC').onclick=()=>{S.eleves.sort((a,b)=>(a.classe||'').localeCompare(b.classe||'','fr',{numeric:true})||(a.nom+' '+a.prenom).localeCompare(b.nom+' '+b.prenom,'fr'));save();renderList()};
 $('bClr').onclick=()=>{if(S.eleves.length&&confirm('Vider la liste des élèves convoqués ?')){S.eleves=[];S.pv=0;save();renderList();renderEpsInfo()}};
 $('pvPrev').onclick=()=>{S.pv=Math.max(0,S.pv-1);renderPreview()};$('pvNext').onclick=()=>{S.pv=Math.min(S.eleves.length-1,S.pv+1);renderPreview()};
 $('bPdf').onclick=()=>genPdf().catch(e=>{console.error(e);toast('Erreur pendant la génération du PDF.',true)});
 $('bSave').onclick=()=>saveEps(false);$('bExp').onclick=exportEps;$('fEps').onchange=e=>{loadEpsList(e.target.files[0]);e.target.value=''};
 $('bPick').onclick=openPick;$('pkX').onclick=()=>$('pick').hidden=true;$('pick').onclick=e=>{if(e.target.id==='pick')$('pick').hidden=true};
 $('pkC').onchange=renderPick;$('pkS').oninput=renderPick;
 $('pkL').onchange=e=>{const id=e.target.dataset.id;if(!id)return;e.target.checked?PK.add(id):PK.delete(id);$('pkN').textContent=PK.size+' sélectionné(s)'};
 $('pkAll').onclick=()=>{pickList().forEach(e=>{if(!S.eleves.some(x=>x.id===e.id))PK.add(e.id)});renderPick()};$('pkNone').onclick=()=>{PK.clear();renderPick()};
 $('pkOk').onclick=()=>{const L=S.eps.filter(e=>PK.has(e.id)).map(e=>({id:e.id,nom:(e.nom||'').toUpperCase(),prenom:e.prenom||'',classe:e.classe||'',cat:''}));
  const n=addEleves(L,false);$('pick').hidden=true;toast(`${n} élève(s) ajouté(s)`)};
 document.addEventListener('keydown',e=>{if(e.key==='Escape')$('pick').hidden=true});
 await refreshEps();if(S.eps.length){linkEps();save();renderList()}
 if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
