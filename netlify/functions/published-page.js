const {esc}=require('./_shared');

exports.handler=async function(event){
 try{
   const raw=(event.queryStringParameters||{}).path||'';
   const path='/' + String(raw).replace(/^\/+/,'');
   const {getStore}=await import('@netlify/blobs');
   const pages=getStore({name:'dahae-published-pages',consistency:'strong'});
   let p=await pages.get(`page/${encodeURIComponent(path)}`,{type:'json'});
   if(!p){
     try{p=await pages.get(`page/${encodeURIComponent(decodeURIComponent(path))}`,{type:'json'})}catch(e){}
   }
   if(!p)return simple(404,'페이지를 찾을 수 없습니다.');
   return {statusCode:200,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'public, max-age=300'},body:html(p)};
 }catch(e){return simple(500,'페이지 로딩 오류: '+e.message)}
};
function html(p){
 const reviews=[
  ['★★★★★',`${p.serviceName} / 경기 수원시`,'신축아파트 입주 전이라 여러 업체 조건을 한 번에 비교할 수 있어서 편했어요. 상담도 빠르고 원하는 날짜에 맞춰 진행할 수 있어서 준비가 훨씬 수월했습니다.','김*진'],
  ['★★★★★','이사청소 / 서울 송파구','이사 날짜가 촉박했는데 여러 곳을 따로 찾지 않아도 되어 편했습니다. 견적과 작업범위를 비교하고 일정에 맞는 업체를 선택할 수 있었어요.','박*영'],
  ['★★★★★','홈클리닝 / 경기 성남시','비용뿐 아니라 작업범위와 결제조건을 같이 비교할 수 있어서 원하는 조건에 맞는 곳을 찾기 좋았습니다.','이*호']
 ];
 return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(p.title)}</title><meta name="description" content="${esc(p.description)}"><meta name="robots" content="index,follow"><link rel="canonical" href="${esc(p.canonical)}">
<style>${CSS}</style></head><body>
<header class="top"><div class="topin"><div class="logo"><b>다</b>해</div><div class="topnote">청소 견적 비교 플랫폼</div></div></header>
<section class="hero"><h1>청소가 필요할 땐,<br><strong>다해</strong>에서</h1><div class="sub">간단한 정보만 입력하고<br>검증된 청소업체의 견적을 최대 5곳까지 비교하세요.</div>
<div class="location">${esc(p.district)} ${esc(p.area)} · ${esc(p.keyword||p.serviceName)}</div>
<div class="chips"><span class="chip">회원가입 없음</span><span class="chip">30초 신청</span><span class="chip">무료 견적</span><span class="chip">최대 5곳 비교</span><span class="chip">검증 업체 우선</span></div>
<div class="quote"><h2>무료 견적 신청</h2><p>필요한 정보만 간단하게 입력해주세요.</p><div class="center">${esc(p.area)} 지역과 ${esc(p.keyword||p.serviceName)} 등 필요한 정보를 간단하게 입력하면<br>최대 5곳의 청소 견적을 비교할 수 있습니다.</div><a class="cta" href="https://dahae-platform.netlify.app/">무료 견적 신청하기</a><p class="tiny">버튼을 누르면 다해 무료견적 신청 폼으로 이동합니다.</p></div></section>
<section class="section"><div class="wrap"><h2 class="title">다해는 이렇게 이용해요</h2><div class="grid3">
<div class="step"><div class="num">1</div><h3>정보 입력</h3><p>지역과 청소 종류 등 필요한 정보만 간단하게 입력합니다.</p></div>
<div class="step"><div class="num">2</div><h3>견적 받기</h3><p>조건에 맞는 청소업체의 견적을 최대 5곳까지 받아봅니다.</p></div>
<div class="step"><div class="num">3</div><h3>비교 후 선택</h3><p>가격과 일정, 작업범위를 비교하고 원하는 업체를 선택합니다.</p></div></div></div></section>
<section class="section alt"><div class="wrap"><h2 class="title">다해 이용후기</h2><p class="example">다해 이용후기 화면 구성 예시입니다. 실제 이용후기가 접수되면 실제 고객 후기로 교체됩니다.</p><div class="grid3">${reviews.map(r=>`<div class="review"><div class="stars">${r[0]}</div><h3>${esc(r[1])}</h3><p>${esc(r[2])}</p><div class="name">${esc(r[3])}</div></div>`).join('')}</div></div></section>
<section class="section"><div class="wrap"><h2 class="title">${esc(p.area)} ${esc(p.serviceName)} 안내</h2><div class="content"><p>${esc(p.intro)}</p><p>${esc(p.work)}</p><div class="seo">${(p.subkeywords||[]).map(x=>`<span>${esc(x)}</span>`).join('')}</div></div></div></section>
<section class="dark"><div class="wrap"><h2 class="title">아무 업체나 연결하지 않습니다.</h2><p class="lead">다해는 단순 연결에서 끝나는 플랫폼이 아니라,<br>고객이 안심하고 맡길 수 있는 조건을 갖춘 업체를 우선 연결합니다.</p>
<div class="grid4"><div class="trust"><div class="icon">🛡️</div><h3>영업배상책임보험 가입 업체</h3><p>보험 가입 여부를 확인한 업체를 우선 연결합니다.</p></div><div class="trust"><div class="icon">🧾</div><h3>세금계산서 발급 가능</h3><p>사업장 고객이 비용처리를 편리하게 할 수 있는 업체 정보를 안내합니다.</p></div><div class="trust"><div class="icon">💳</div><h3>카드결제 가능 업체</h3><p>카드결제가 가능한 업체를 비교할 수 있도록 돕습니다.</p></div><div class="trust"><div class="icon">✅</div><h3>검증되지 않은 업체 연결 NO</h3><p>기본적인 사업자 정보와 서비스 조건을 확인한 업체를 우선합니다.</p></div></div>
<div class="bluebox"><h3>견적만 연결하고 끝? 다해는 다릅니다.</h3><p>업체 선택부터 작업 진행, 문제가 생겼을 때의 확인까지.<br>다해가 끝까지 책임지는 청소 견적 플랫폼을 지향합니다.</p></div></div></section>
<section class="final"><div class="finalbox"><h2>청소가 필요할 땐, 다해에서</h2><p>간단하게 신청하고 최대 5곳의 청소 견적을 비교해보세요.</p><a class="whitebtn" href="https://dahae-platform.netlify.app/">무료 견적 신청하기</a></div></section></body></html>`;
}
const CSS=`*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;font-family:Arial,"Noto Sans KR","Apple SD Gothic Neo",sans-serif;color:#081226;background:#fff;line-height:1.65}a{text-decoration:none;color:inherit}.top{height:58px;border-bottom:1px solid #e5e7eb;background:#fff}.topin{max-width:1120px;margin:auto;height:100%;display:flex;align-items:center;justify-content:space-between;padding:0 22px}.logo{font-size:26px;font-weight:900;letter-spacing:-2px}.logo b{color:#2864ef}.topnote{font-size:13px;color:#64748b}.hero{background:linear-gradient(#fff,#f3f6fb);padding:52px 20px 56px;text-align:center}.hero h1{font-size:42px;line-height:1.18;letter-spacing:-2.6px;margin:0 0 22px;font-weight:900}.hero h1 strong{color:#2864ef}.sub{font-size:18px;line-height:1.7;color:#42526b}.location{font-size:15px;color:#64748b;margin:8px 0 18px}.chips{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin:20px 0 34px}.chip{padding:9px 13px;background:#edf3ff;color:#1f5be8;border-radius:999px;font-weight:800;font-size:13px}.quote{max-width:720px;margin:auto;background:#fff;border:1px solid #e3e7ef;border-radius:20px;text-align:left;padding:28px;box-shadow:0 18px 44px rgba(15,23,42,.09)}.quote h2{font-size:27px;margin:0 0 8px}.quote p{color:#64748b}.quote .center{text-align:center;color:#43516a;line-height:1.7;margin:28px 0 18px}.cta{display:block;background:#2d64e8;color:#fff;text-align:center;font-weight:900;border-radius:11px;padding:17px;font-size:18px}.tiny{text-align:center;font-size:11px!important}.section{padding:64px 20px}.section.alt{background:#f7f9fc}.wrap{max-width:1040px;margin:auto}.title{text-align:center;font-size:30px;letter-spacing:-1.6px;margin:0 0 32px}.grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}.grid4{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}.step,.review,.trust,.content{border:1px solid #dfe4ec;border-radius:16px;background:#fff;padding:28px}.step{text-align:center;min-height:170px}.num{width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#edf3ff;color:#2864ef;font-weight:900;margin:0 auto 16px}.step h3,.review h3{margin:0 0 8px}.step p,.review p,.trust p,.content p{color:#64748b}.review{min-height:230px}.stars{font-size:20px}.name{font-size:12px;color:#94a3b8;margin-top:18px}.example{text-align:center;color:#64748b;margin:-18px 0 30px}.seo{display:flex;gap:8px;flex-wrap:wrap;margin-top:18px}.seo span{background:#f1f5f9;border-radius:999px;padding:7px 10px;font-size:13px}.dark{background:#0d172a;color:#fff;padding:60px 20px}.dark .title{color:#fff;margin-bottom:8px}.lead{text-align:center;color:#d0d8e8}.trust{color:#0f172a;min-height:210px}.icon{font-size:28px}.bluebox{margin-top:24px;background:#2d64e8;border-radius:16px;padding:28px;text-align:center}.bluebox h3{font-size:25px;margin:0 0 8px}.bluebox p{color:#e8efff}.final{background:#f5f7fb;padding:34px 20px 70px}.finalbox{max-width:1040px;margin:auto;background:#2d64e8;border-radius:20px;color:#fff;text-align:center;padding:42px 20px}.whitebtn{display:inline-block;background:#fff;color:#2864ef;border-radius:12px;padding:15px 64px;font-weight:900;margin-top:14px}@media(max-width:800px){.hero h1{font-size:34px}.grid3,.grid4{grid-template-columns:1fr}.quote{padding:22px}}`;
function simple(statusCode,msg){return {statusCode,headers:{'Content-Type':'text/html; charset=utf-8'},body:`<!doctype html><meta charset="utf-8"><h1>${esc(msg)}</h1>`}}
