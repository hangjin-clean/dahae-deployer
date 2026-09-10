const fs=require('fs');
const path=require('path');

const SOURCE='https://raw.githubusercontent.com/vuski/admdongkor/master/ver20260701/HangJeongDong_ver20260701.geojson';
const OUT=path.join(__dirname,'..','public','nationwide_regions.json');

// 1호 운영 범위와 동일하게 제주를 제외한 16개 시·도
const ALLOWED=new Set([
 '서울특별시','부산광역시','대구광역시','인천광역시','광주광역시','대전광역시','울산광역시','세종특별자치시',
 '경기도','강원특별자치도','충청북도','충청남도','전북특별자치도','전라남도','경상북도','경상남도'
]);

function val(p,keys){
 for(const k of keys){const v=p&&p[k];if(v!==undefined&&v!==null&&String(v).trim())return String(v).trim()}
 return '';
}
function uniq(arr){return [...new Set(arr.filter(Boolean))]}
function aliasName(name){
 const s=String(name||'').trim();
 const m=s.match(/^(.+?)(?:\d+(?:[·.\-]\d+)*)동$/);
 return m ? m[1]+'동' : '';
}
function splitAdm(p){
 const full=val(p,['adm_nm','ADM_NM','name','full_nm']);
 return full.split(/\s+/).filter(Boolean);
}
async function run(){
 const r=await fetch(SOURCE,{headers:{'User-Agent':'dahae-deployer-regions'}});
 if(!r.ok)throw new Error('전국지역 원본 다운로드 실패 HTTP '+r.status);
 const geo=await r.json();
 const features=Array.isArray(geo.features)?geo.features:[];
 if(features.length<3000)throw new Error('전국지역 원본 행 수가 비정상입니다: '+features.length);

 const provinces={}; let official=0;
 for(const f of features){
   const p=f.properties||{}, parts=splitAdm(p);
   let province=val(p,['sidonm','sido_nm','CTP_KOR_NM']) || parts[0] || '';
   if(!ALLOWED.has(province))continue;

   let district=val(p,['sggnm','sgg_nm','SIG_KOR_NM']);
   let dong=val(p,['emd_nm','emdName','adm_nm','name']);
   if(dong.includes(' ')){const a=dong.split(/\s+/);dong=a[a.length-1]}
   if(!dong && parts.length)dong=parts[parts.length-1];

   if(!district){
     if(province==='세종특별자치시')district='세종시';
     else if(parts.length>=3)district=parts.slice(1,-1).join(' ');
     else if(parts.length===2)district=parts[1];
   }
   if(!district||!dong||district===dong)continue;
   provinces[province] ||= {};
   provinces[province][district] ||= [];
   const arr=provinces[province][district];
   if(!arr.some(x=>x.name===dong && !x.alias)){
     arr.push({name:dong,alias:false,sourceAreas:[dong]}); official++;
   }
 }

 let aliases=0;
 for(const districts of Object.values(provinces)){
   for(const rows of Object.values(districts)){
     const groups={};
     for(const row of rows){
       const a=aliasName(row.name);
       if(!a||a===row.name)continue;
       (groups[a] ||= []).push(row.name);
     }
     for(const [name,sources] of Object.entries(groups)){
       const u=uniq(sources);
       if(u.length<2 || rows.some(x=>x.name===name))continue;
       rows.push({name,alias:true,type:'search-alias',sourceAreas:u}); aliases++;
     }
     rows.sort((a,b)=>a.name.localeCompare(b.name,'ko'));
   }
 }

 const provinceNames=Object.keys(provinces);
 const districts=provinceNames.reduce((n,p)=>n+Object.keys(provinces[p]).length,0);
 if(provinceNames.length!==16)throw new Error(`전국 지역 검증 실패: 시도 ${provinceNames.length}/16`);
 if(official<3000)throw new Error(`전국 지역 검증 실패: 공식 읍면동 ${official}개`);
 const out={
   version:'20260701',source:SOURCE,generatedAt:new Date().toISOString(),
   stats:{provinces:provinceNames.length,districts,officialRows:official,aliasRows:aliases,totalRows:official+aliases},
   provinces
 };
 fs.mkdirSync(path.dirname(OUT),{recursive:true});
 fs.writeFileSync(OUT,JSON.stringify(out,null,2));
 console.log(`Nationwide regions built: ${provinceNames.length} top-level regions / ${districts} districts / ${official} official areas / ${aliases} aliases`);
}
run().catch(e=>{console.error(e);process.exit(1)});
