import fs from "fs";
import path from "path";

const cwd = process.cwd();
const svc = JSON.parse(fs.readFileSync(path.join(cwd,"data","services.json"),"utf8"));
const regions = JSON.parse(fs.readFileSync(path.join(cwd,"data","regions.json"),"utf8"));
const cfg = JSON.parse(fs.readFileSync(path.join(cwd,"deploy-config.json"),"utf8"));
const out = path.join(cwd,"dist");
fs.rmSync(out,{recursive:true,force:true});
fs.mkdirSync(out,{recursive:true});

const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const count=clamp(Number(process.env.PAGE_COUNT||cfg.count||100),1,10000);

const esc=s=>String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));
const slug=s=>encodeURIComponent(String(s).trim().replace(/\s+/g,"-"));
const areas=[];
for(const [metro,districts] of Object.entries(regions)){
  for(const [district,dongs] of Object.entries(districts)){
    for(const dong of dongs) areas.push({metro,district,dong});
  }
}
const variants=[];
for(const s of svc.primary){
  for(const v of s.variants) variants.push({...s,variant:v});
}

const openings=[
 "새로운 집에 들어가기 전 가장 신경 쓰이는 부분은 눈에 잘 보이지 않는 먼지와 생활 오염입니다.",
 "입주와 이사를 앞두고 있다면 청소 범위를 미리 나눠 확인하는 것이 좋습니다.",
 "같은 평수라도 창틀, 주방, 욕실 상태에 따라 필요한 작업은 달라질 수 있습니다.",
 "집 전체를 한 번에 정리하려면 공간별 오염도와 작업 순서를 먼저 확인하는 것이 효율적입니다.",
 "입주 전 청소는 단순히 바닥만 닦는 작업이 아니라 손이 자주 닿는 곳까지 점검하는 과정이 중요합니다."
];

const details=[
 ["창틀·창문 주변 먼지 제거","주방 상하부장 및 싱크대 주변 정리","욕실 물때·수전·배수구 주변 청소","바닥 및 걸레받이 마감","문틀·스위치·수납장 표면 정리"],
 ["주방 기름때와 수납공간 확인","욕실 물때와 배수구 점검","창틀 및 베란다 먼지 제거","바닥 오염도에 맞춘 마감","생활 접촉면 정리"],
 ["공간별 먼지 제거","창틀과 레일 틈새 청소","주방·욕실 집중관리","방문과 몰딩 주변 정리","작업 후 전체 확인"]
];

function htmlPage(a,v,i){
  const title=`${a.dong} ${v.variant} ${a.district} 다해 홈클리닝`;
  const desc=`${a.metro} ${a.district} ${a.dong} ${v.variant}. 우리동네에서 가까운 곳 우선으로 비교하고 필요한 청소 범위를 확인하세요.`;
  const open=openings[i%openings.length];
  const list=details[i%details.length];
  return `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><meta name="description" content="${esc(desc)}">
<meta name="robots" content="index,follow">
<link rel="canonical" href="/${slug(a.metro)}/${slug(a.district)}/${slug(a.dong)}/${v.slug}/${i+1}/">
<style>
body{font-family:Arial,"Noto Sans KR",sans-serif;margin:0;background:#f7f8fa;color:#15171a;line-height:1.7}
.wrap{max-width:860px;margin:auto;padding:24px}.hero{background:white;border-radius:18px;padding:34px;box-shadow:0 8px 30px rgba(0,0,0,.06)}
.badge{display:inline-block;padding:7px 11px;border-radius:999px;background:#eef3ff;font-weight:700}
h1{font-size:32px;line-height:1.25;margin:16px 0}.cta{display:block;text-align:center;margin:24px 0;padding:16px;border-radius:12px;background:#111827;color:white;text-decoration:none;font-weight:800}
.card{background:white;border-radius:16px;padding:24px;margin-top:18px}ul{padding-left:22px}.near{font-weight:800;font-size:20px}
small{color:#666}</style></head>
<body><main class="wrap">
<section class="hero"><span class="badge">다해 홈클리닝</span>
<h1>${esc(title)}</h1><p class="near">우리동네에서 가까운 곳 우선</p>
<p>${esc(open)}</p>
<a class="cta" href="#check">무료 비교 요청하기</a></section>
<section class="card" id="check"><h2>${esc(v.variant)} 체크 범위</h2><ul>${list.map(x=>`<li>${esc(x)}</li>`).join("")}</ul></section>
<section class="card"><h2>${esc(a.dong)}에서 업체를 고를 때</h2>
<p>가격만 비교하기보다 작업 인원, 포함 범위, 추가요금 기준, 일정 가능 여부, 작업 전후 확인 방법을 함께 비교하는 것이 좋습니다. 다해는 지역과 요청 내용을 기준으로 가까운 업체를 우선 확인할 수 있도록 구성했습니다.</p></section>
<section class="card"><h2>다해 이용 흐름</h2>
<p>지역 선택 → 필요한 청소 선택 → 요청 내용 확인 → 업체 비교 → 일정 협의 순서로 진행할 수 있습니다.</p>
<small>실제 비용과 작업 범위는 현장 상태와 업체 조건에 따라 달라질 수 있습니다.</small></section>
</main></body></html>`;
}

const items=[];
for(let i=0;i<count;i++){
  const a=areas[i%areas.length];
  const v=variants[(i*7+Math.floor(i/areas.length))%variants.length];
  const rel=path.join(slug(a.metro),slug(a.district),slug(a.dong),v.slug,String(i+1));
  const dir=path.join(out,rel);
  fs.mkdirSync(dir,{recursive:true});
  fs.writeFileSync(path.join(dir,"index.html"),htmlPage(a,v,i));
  items.push({a,v,url:`/${rel.replaceAll("\\","/")}/`});
}

const home=`<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>다해 홈클리닝</title>
<style>body{font-family:Arial,"Noto Sans KR",sans-serif;max-width:900px;margin:40px auto;padding:20px;line-height:1.7}a{display:block;margin:8px 0}</style></head><body>
<h1>다해 홈클리닝</h1><p><b>우리동네에서 가까운 곳 우선</b></p><p>입주청소·이사청소·거주청소 등 홈클리닝 비교 페이지입니다.</p>
<h2>최근 생성 페이지</h2>${items.slice(0,50).map(x=>`<a href="${x.url}">${esc(x.a.dong)} ${esc(x.v.variant)}</a>`).join("")}</body></html>`;
fs.writeFileSync(path.join(out,"index.html"),home);

// Admin page shipped inside dist
fs.copyFileSync(path.join(cwd,"admin.html"),path.join(out,"admin.html"));

const base = process.env.URL || "https://example.netlify.app";
const urls = items.map(x=>base.replace(/\/$/,"")+x.url);
fs.writeFileSync(path.join(out,"sitemap.xml"),`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(u=>`<url><loc>${esc(u)}</loc></url>`).join("")}</urlset>`);
fs.writeFileSync(path.join(out,"robots.txt"),`User-agent: *\nAllow: /\nSitemap: ${base.replace(/\/$/,"")}/sitemap.xml\n`);
console.log(`Generated ${count} pages.`);
