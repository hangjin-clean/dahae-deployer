const fs=require('fs');
const path=require('path');

const SOURCE='https://raw.githubusercontent.com/vuski/admdongkor/master/ver20260701/HangJeongDong_ver20260701.geojson';
const OUT=path.join(__dirname,'..','public','nationwide_regions.json');

// 2026-07 원본은 광주+전남 통합이 반영되어 '전남광주통합특별시'가 하나의 시도로 들어갑니다.
// 고정 명칭 목록으로 걸러내면 광주/전남 2개가 빠져 14/16 오류가 나므로,
// 원본 GeoJSON의 실제 시도명을 그대로 사용하고 마지막에 '16개'만 검증합니다.

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
   if(!province)continue;

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

 const sourceProvinceNames=[...new Set(features.map(f=>{
   const p=f.properties||{},parts=splitAdm(p);
   return val(p,['sidonm','sido_nm','CTP_KOR_NM']) || parts[0] || '';
 }).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'ko'));
 if(sourceProvinceNames.length!==16){
   throw new Error(`전국 원본 시도 수 검증 실패: ${sourceProvinceNames.length}/16 · ${sourceProvinceNames.join(', ')}`);
 }
 const provinceNames=Object.keys(provinces);
 const districts=provinceNames.reduce((n,p)=>n+Object.keys(provinces[p]).length,0);
 if(provinceNames.length!==16){
   throw new Error(`전국 지역 생성 검증 실패: 시도 ${provinceNames.length}/16 · ${provinceNames.join(', ')}`);
 }
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
