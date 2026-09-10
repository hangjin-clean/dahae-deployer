import fs from "fs";
import path from "path";

const SOURCE =
  "https://raw.githubusercontent.com/vuski/admdongkor/master/ver20260701/HangJeongDong_ver20260701.geojson";

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "public");
const OUT = path.join(OUT_DIR, "nationwide_regions.json");

const REGION_NAMES = new Set([
  "서울특별시","부산광역시","대구광역시","인천광역시",
  "대전광역시","울산광역시","세종특별자치시",
  "경기도","강원특별자치도","충청북도","충청남도",
  "전북특별자치도","경상북도","경상남도",
  "제주특별자치도","전남광주통합특별시"
]);

function s(v){ return String(v ?? "").trim(); }

function prop(p, names){
  for(const n of names){
    const v=p?.[n];
    if(v!==undefined && v!==null && s(v)) return s(v);
  }
  return "";
}

function splitAdm(adm){
  const parts=s(adm).split(/\s+/).filter(Boolean);
  return parts;
}

function cleanDong(name){
  return s(name).replace(/\s+/g," ");
}

function aliasBase(name){
  const x=cleanDong(name);
  // 행신1동, 동대신2동, 숭의1·3동, 신정4동 같은 행정동을 검색용 통합명으로 묶음
  let m=x.match(/^(.+?)(?:\d+(?:[·.\-]\d+)*)동$/);
  if(m) return m[1]+"동";
  // "종로1.2.3.4가동" 류는 과도한 가 단위 노출 대신 종로동 같은 억지 별칭을 만들지 않음
  return "";
}

function normalizeProvince(p, admParts){
  let province=prop(p,["sidonm","sido_nm","sidoName","CTP_KOR_NM"]);
  if(!province && admParts.length) province=admParts[0];
  return province;
}

function normalizeDistrict(p, admParts, province){
  let district=prop(p,["sggnm","sgg_nm","sggName","SIG_KOR_NM"]);
  if(district) return district;
  if(admParts.length>=3) return admParts.slice(1,-1).join(" ");
  if(admParts.length===2) {
    // 세종은 시군구가 따로 없으므로 자체 명칭 사용
    if(province==="세종특별자치시") return "세종시";
    return admParts[1];
  }
  return province==="세종특별자치시" ? "세종시" : "기타";
}

function normalizeDong(p, admParts){
  let dong=prop(p,["adm_nm","emd_nm","emdName","dong","name"]);
  if(dong && dong.includes(" ")) {
    const parts=dong.split(/\s+/).filter(Boolean);
    dong=parts[parts.length-1]||dong;
  }
  if(!dong && admParts.length) dong=admParts[admParts.length-1];
  return cleanDong(dong);
}

const res=await fetch(SOURCE);
if(!res.ok) throw new Error(`전국 지역 원본 다운로드 실패: HTTP ${res.status}`);
const geo=await res.json();
const features=Array.isArray(geo.features)?geo.features:[];
if(features.length<3000) throw new Error(`전국 지역 원본 행 수가 너무 적습니다: ${features.length}`);

const provinces={};
let officialRows=0;

for(const f of features){
  const p=f?.properties||{};
  const admFull=prop(p,["adm_nm","ADM_NM","full_nm","name"]);
  const admParts=splitAdm(admFull);
  const province=normalizeProvince(p,admParts);
  if(!province || !REGION_NAMES.has(province)) continue;

  const district=normalizeDistrict(p,admParts,province);
  const dong=normalizeDong(p,admParts);
  if(!district || !dong || dong===district || dong===province) continue;

  provinces[province] ||= {};
  provinces[province][district] ||= [];
  if(!provinces[province][district].some(x=>x.name===dong && !x.alias)){
    provinces[province][district].push({name:dong,alias:false,sourceAreas:[dong]});
    officialRows++;
  }
}

// 1호 최종형처럼 숫자 행정동은 공식명 유지 + 통합 검색명 별도 생성
let aliasRows=0;
for(const districts of Object.values(provinces)){
  for(const [district, rows] of Object.entries(districts)){
    const groups=new Map();
    for(const row of rows){
      const base=aliasBase(row.name);
      if(!base || base===row.name) continue;
      if(!groups.has(base)) groups.set(base,[]);
      groups.get(base).push(row.name);
    }
    for(const [base,sources] of groups){
      if(sources.length<2) continue;
      if(rows.some(x=>x.name===base)) continue;
      rows.push({name:base,alias:true,sourceAreas:[...new Set(sources)]});
      aliasRows++;
    }
    rows.sort((a,b)=>a.name.localeCompare(b.name,"ko"));
  }
}

const provinceNames=Object.keys(provinces);
const districtCount=provinceNames.reduce((n,p)=>n+Object.keys(provinces[p]).length,0);

if(provinceNames.length!==16){
  throw new Error(`전국 지역 검증 실패: 시도 ${provinceNames.length}개 (예상 16개)`);
}
if(officialRows<3400){
  throw new Error(`전국 지역 검증 실패: 공식 읍면동 ${officialRows}개`);
}

fs.mkdirSync(OUT_DIR,{recursive:true});
fs.writeFileSync(OUT,JSON.stringify({
  version:"20260701",
  source:SOURCE,
  generatedAt:new Date().toISOString(),
  stats:{provinces:provinceNames.length,districts:districtCount,officialRows,aliasRows,totalRows:officialRows+aliasRows},
  provinces
},null,2),"utf8");

console.log(`Nationwide regions built: ${provinceNames.length} top-level regions / ${districtCount} districts / ${officialRows} official areas / ${aliasRows} aliases`);
