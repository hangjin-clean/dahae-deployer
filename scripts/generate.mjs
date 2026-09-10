import fs from "fs";
import path from "path";

const cwd = process.cwd();
const svc = JSON.parse(fs.readFileSync(path.join(cwd,"data","services.json"),"utf8"));
let regions = JSON.parse(fs.readFileSync(path.join(cwd,"data","regions.json"),"utf8"));
try{
  const nationwide=JSON.parse(fs.readFileSync(path.join(cwd,"public","nationwide_regions.json"),"utf8"));
  if(nationwide?.provinces && Object.keys(nationwide.provinces).length){
    regions=nationwide.provinces;
  }
}catch(e){}
const cfg = JSON.parse(fs.readFileSync(path.join(cwd,"deploy-config.json"),"utf8"));
const out = path.join(cwd,"dist");
fs.rmSync(out,{recursive:true,force:true});
fs.mkdirSync(out,{recursive:true});

const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const count=clamp(Number(process.env.PAGE_COUNT||cfg.count||100),1,10000);
const esc=s=>String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const slug=s=>encodeURIComponent(String(s).trim().replace(/\s+/g,"-"));

const areas=[];
for(const [metro,districts] of Object.entries(regions)){
  for(const [district,dongs] of Object.entries(districts)){
    for(const row of dongs){
      const dong=typeof row==="string"?row:String(row?.name||"").trim();
      if(!dong) continue;
      areas.push({
        metro,district,dong,
        alias:typeof row==="object"&&!!row.alias,
        sourceAreas:typeof row==="object"?(row.sourceAreas||[dong]):[dong]
      });
    }
  }
}
const variants=[];
for(const s of svc.primary){
  for(const v of s.variants) variants.push({...s,variant:v});
}

const reviewPool = [
  ["★★★★★","입주청소 / 경기 수원시","신축아파트 입주 전이라 먼지랑 창틀 상태가 걱정됐는데 여러 업체 조건을 한 번에 비교할 수 있어서 편했어요. 상담도 빠르고 원하는 날짜에 맞춰 진행할 수 있어서 입주 준비가 훨씬 수월했습니다.","김*진"],
  ["★★★★★","이사청소 / 서울 송파구","이사 날짜가 촉박해서 급하게 업체를 찾았는데 여러 군데 따로 알아보지 않아도 돼서 좋았어요. 견적이랑 작업범위를 비교하고 선택할 수 있어서 생각보다 쉽게 결정했고 일정도 잘 맞춰 진행했습니다.","박*영"],
  ["★★★★★","거주청소 / 경기 성남시","집 전체를 한 번 정리하고 싶어서 알아봤는데 비용뿐 아니라 결제조건과 작업범위까지 같이 비교할 수 있어서 편했습니다. 원하는 조건에 맞는 업체를 찾는 데 도움이 됐어요.","이*호"]
];

function pageTemplate(a,v,i){
  const seoTitle = `${a.dong} ${v.variant} ${a.district} 홈클리닝 청소업체 다해`;
  const desc = `${a.metro} ${a.district} ${a.dong} ${v.variant} 비교. 우리동네에서 가까운 곳 우선, 최대 5곳 견적 비교, 무료 견적 신청.`;
  const reviews = [
    [reviewPool[0][0],`${v.name} / ${a.metro} ${a.district}`,reviewPool[(i+0)%reviewPool.length][2],reviewPool[(i+0)%reviewPool.length][3]],
    [reviewPool[1][0],`이사청소 / ${a.metro} ${a.district}`,reviewPool[(i+1)%reviewPool.length][2],reviewPool[(i+1)%reviewPool.length][3]],
    [reviewPool[2][0],`홈클리닝 / ${a.metro} ${a.district}`,reviewPool[(i+2)%reviewPool.length][2],reviewPool[(i+2)%reviewPool.length][3]]
  ];
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(seoTitle)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="robots" content="index,follow">
<link rel="canonical" href="/${slug(a.metro)}/${slug(a.district)}/${slug(a.dong)}/${v.slug}/${i+1}/">
<style>
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;font-family:Arial,"Noto Sans KR","Apple SD Gothic Neo",sans-serif;color:#081226;background:#fff}
a{text-decoration:none;color:inherit}
.top{height:58px;border-bottom:1px solid #e5e7eb;background:#fff}
.topin{max-width:1120px;margin:auto;height:100%;display:flex;align-items:center;justify-content:space-between;padding:0 22px}
.logo{font-size:26px;font-weight:900;letter-spacing:-2px}.logo b{color:#2864ef}
.topnote{font-size:13px;color:#64748b}
.hero{background:linear-gradient(#fff,#f3f6fb);padding:52px 20px 56px;text-align:center}
.hero h1{font-size:42px;line-height:1.18;letter-spacing:-2.6px;margin:0 0 22px;font-weight:900}
.hero h1 strong{color:#2864ef}
.sub{font-size:18px;line-height:1.7;color:#42526b;margin-bottom:18px}
.location{font-size:15px;color:#64748b;margin:6px 0 18px}
.chips{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin:20px 0 34px}
.chip{padding:9px 13px;background:#edf3ff;color:#1f5be8;border-radius:999px;font-weight:800;font-size:13px}
.quote{max-width:720px;margin:0 auto;background:#fff;border:1px solid #e3e7ef;border-radius:20px;text-align:left;padding:28px;box-shadow:0 18px 44px rgba(15,23,42,.09)}
.quote h2{font-size:27px;margin:0 0 8px;letter-spacing:-1.5px}
.quote p{color:#64748b;margin:0 0 22px}
.quote .center{text-align:center;color:#43516a;line-height:1.7;margin:28px 0 18px}
.cta{display:block;background:#2d64e8;color:#fff;text-align:center;font-weight:900;border-radius:11px;padding:17px;font-size:18px}
.tiny{text-align:center;font-size:11px!important;margin:12px 0 0!important;color:#6b7280!important}
.section{padding:64px 20px}
.section.alt{background:#f7f9fc}
.wrap{max-width:1040px;margin:auto}
.title{text-align:center;font-size:30px;letter-spacing:-1.6px;margin:0 0 32px}
.grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.step,.review,.trust{border:1px solid #dfe4ec;border-radius:16px;background:#fff;padding:28px}
.step{text-align:center;min-height:170px}
.num{width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#edf3ff;color:#2864ef;font-weight:900;margin:0 auto 16px}
.step h3{margin:0 0 8px;font-size:18px}.step p,.review p,.trust p{color:#64748b;line-height:1.7;margin:0}
.review{min-height:230px}.stars{font-size:20px;letter-spacing:1px;margin-bottom:10px}.review h3{font-size:16px;margin:0 0 8px}.name{font-size:12px;color:#94a3b8;margin-top:18px}
.dark{background:#0d172a;color:#fff;padding:60px 20px}
.dark .title{color:#fff;margin-bottom:8px}
.dark .lead{text-align:center;color:#d0d8e8;line-height:1.7;margin:0 0 30px}
.grid4{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
.trust{color:#0f172a;min-height:210px}.icon{font-size:28px;margin-bottom:12px}.trust h3{font-size:18px;line-height:1.4;margin:0 0 10px}
.bluebox{max-width:1040px;margin:24px auto 0;background:#2d64e8;border-radius:16px;padding:28px;text-align:center}
.bluebox h3{font-size:25px;margin:0 0 8px}.bluebox p{margin:0;color:#e8efff;line-height:1.7}
.final{background:#f5f7fb;padding:34px 20px 70px}
.finalbox{max-width:1040px;margin:auto;background:#2d64e8;border-radius:20px;color:#fff;text-align:center;padding:42px 20px}
.finalbox h2{font-size:28px;margin:0 0 10px}.finalbox p{color:#e8efff}
.whitebtn{display:inline-block;background:#fff;color:#2864ef;border-radius:12px;padding:15px 64px;font-weight:900;margin-top:14px}
@media(max-width:800px){
.hero h1{font-size:34px}.grid3,.grid4{grid-template-columns:1fr}.quote{padding:22px}.section{padding:48px 16px}
}
</style>
</head>
<body>
<header class="top"><div class="topin"><div class="logo"><b>다</b>해</div><div class="topnote">청소 견적 비교 플랫폼</div></div></header>

<section class="hero">
  <h1>청소가 필요할 땐,<br><strong>다해</strong>에서</h1>
  <div class="sub">간단한 정보만 입력하고<br>검증된 청소업체의 견적을 최대 5곳까지 비교하세요.</div>
  <div class="location">${esc(a.metro)} ${esc(a.district)} ${esc(a.dong)} · ${esc(v.variant)}</div>
  <div class="chips">
    <span class="chip">회원가입 없음</span><span class="chip">30초 신청</span><span class="chip">무료 견적</span><span class="chip">최대 5곳 비교</span><span class="chip">검증 업체 우선</span>
  </div>
  <div class="quote">
    <h2>무료 견적 신청</h2>
    <p>필요한 정보만 간단하게 입력해주세요.</p>
    <div class="center">${esc(a.dong)} 지역과 ${esc(v.variant)} 등 필요한 정보를 간단하게 입력하면<br>최대 5곳의 청소 견적을 비교할 수 있습니다.</div>
    <a class="cta" href="https://dahae-platform.netlify.app/">무료 견적 신청하기</a>
    <p class="tiny">버튼을 누르면 다해 무료견적 신청 폼으로 이동합니다.</p>
  </div>
</section>

<section class="section"><div class="wrap">
  <h2 class="title">다해는 이렇게 이용해요</h2>
  <div class="grid3">
    <div class="step"><div class="num">1</div><h3>정보 입력</h3><p>지역과 청소 종류 등 필요한 정보만 간단하게 입력합니다.</p></div>
    <div class="step"><div class="num">2</div><h3>견적 받기</h3><p>조건에 맞는 청소업체의 견적을 최대 5곳까지 받아봅니다.</p></div>
    <div class="step"><div class="num">3</div><h3>비교 후 선택</h3><p>가격과 일정, 작업범위를 비교하고 원하는 업체를 선택합니다.</p></div>
  </div>
</div></section>

<section class="section alt"><div class="wrap">
  <h2 class="title">다해 이용후기</h2>
  <p style="text-align:center;color:#64748b;margin:-18px 0 30px">다해 이용후기 화면 구성 예시입니다. 실제 이용후기가 접수되면 실제 고객 후기로 교체됩니다.</p>
  <div class="grid3">
    ${reviews.map(r=>`<div class="review"><div class="stars">${r[0]}</div><h3>${esc(r[1])}</h3><p>${esc(r[2])}</p><div class="name">${esc(r[3])}</div></div>`).join("")}
  </div>
</div></section>

<section class="dark"><div class="wrap">
  <h2 class="title">아무 업체나 연결하지 않습니다.</h2>
  <p class="lead">다해는 단순 연결에서 끝나는 플랫폼이 아니라,<br>고객이 안심하고 맡길 수 있는 조건을 갖춘 업체를 우선 연결합니다.</p>
  <div class="grid4">
    <div class="trust"><div class="icon">🛡️</div><h3>영업배상책임보험 가입 업체</h3><p>작업 중 발생할 수 있는 사고까지 고려해 보험 가입 여부를 확인한 업체를 우선 연결합니다.</p></div>
    <div class="trust"><div class="icon">🧾</div><h3>세금계산서 발급 가능</h3><p>사업장 고객이 비용처리를 편리하게 할 수 있도록 발급 가능한 업체 정보를 안내합니다.</p></div>
    <div class="trust"><div class="icon">💳</div><h3>카드결제 가능 업체</h3><p>현금 결제만 강요하지 않고 카드결제가 가능한 업체를 비교할 수 있도록 돕습니다.</p></div>
    <div class="trust"><div class="icon">✅</div><h3>검증되지 않은 업체 연결 NO</h3><p>가격만 보고 연결하지 않습니다. 기본적인 사업자 정보와 서비스 조건을 확인한 업체를 우선합니다.</p></div>
  </div>
  <div class="bluebox"><h3>견적만 연결하고 끝? 다해는 다릅니다.</h3><p>업체 선택부터 작업 진행, 문제가 생겼을 때의 확인까지.<br>다해가 끝까지 책임지는 청소 견적 플랫폼을 지향합니다.</p></div>
  <p style="text-align:center;color:#d0d8e8;font-size:12px;margin-top:20px">무조건 가장 저렴한 업체보다, 가격·작업범위·결제조건·업체 신뢰도를 함께 비교할 수 있도록 돕습니다.</p>
</div></section>

<section class="final"><div class="finalbox">
  <h2>청소가 필요할 땐, 다해에서</h2>
  <p>간단하게 신청하고 최대 5곳의 청소 견적을 비교해보세요.</p>
  <a class="whitebtn" href="https://dahae-platform.netlify.app/">무료 견적 신청하기</a>
</div></section>
</body></html>`;
}

const items=[];
for(let i=0;i<count;i++){
  const a=areas[i%areas.length];
  const v=variants[(i*7+Math.floor(i/areas.length))%variants.length];
  const rel=path.join(slug(a.metro),slug(a.district),slug(a.dong),v.slug,String(i+1));
  const dir=path.join(out,rel);
  fs.mkdirSync(dir,{recursive:true});
  fs.writeFileSync(path.join(dir,"index.html"),pageTemplate(a,v,i));
  items.push({a,v,url:`/${rel.replaceAll("\\","/")}/`});
}

const homeA=areas[0], homeV=variants[0];
fs.writeFileSync(path.join(out,"index.html"),pageTemplate(homeA,homeV,0));
fs.copyFileSync(path.join(cwd,"admin.html"),path.join(out,"admin.html"));

const base=process.env.URL||"https://dahae-clean.netlify.app";
const urls=items.map(x=>base.replace(/\/$/,"")+x.url);
fs.writeFileSync(path.join(out,"sitemap.xml"),`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(u=>`<url><loc>${esc(u)}</loc></url>`).join("")}</urlset>`);
fs.writeFileSync(path.join(out,"robots.txt"),`User-agent: *\nAllow: /\nSitemap: ${base.replace(/\/$/,"")}/sitemap.xml\n`);
console.log(`Generated ${count} Dahae landing pages.`);
