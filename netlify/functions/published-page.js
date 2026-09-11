const {esc,blobStore,buildPage}=require('./_shared');
const services=require('../../data/services.json');

const PROVINCE_BY_SHORT={
  '서울':'서울특별시','부산':'부산광역시','대구':'대구광역시','인천':'인천광역시',
  '광주':'광주광역시','대전':'대전광역시','울산':'울산광역시','세종':'세종특별자치시',
  '경기':'경기도','강원':'강원특별자치도','충북':'충청북도','충남':'충청남도',
  '전북':'전북특별자치도','전남':'전라남도','경북':'경상북도','경남':'경상남도'
};

exports.handler=async function(event){
  try{
    const raw=(event.queryStringParameters||{}).path||'';
    const path='/' + String(raw).replace(/^\/+/,'');
    const pages=await blobStore('dahae-published-pages');

    // 1) 정상 저장 키 조회
    let p=await getPage(pages,path);

    // 2) 과거 발행분에서 Blob 페이지가 누락된 경우 URL 자체로 페이지 복구
    if(!p){
      p=rebuildFromPath(path);
    }

    if(!p)return simple(404,'페이지를 찾을 수 없습니다.');

    return {
      statusCode:200,
      headers:{
        'Content-Type':'text/html; charset=utf-8',
        'Cache-Control':'public, max-age=300'
      },
      body:html(p)
    };
  }catch(e){
    return simple(500,'페이지 로딩 오류: '+(e.message||String(e)));
  }
};

async function getPage(pages,path){
  const candidates=new Set([path]);
  try{candidates.add(decodeURIComponent(path))}catch(e){}
  try{candidates.add(encodeURI(decodeURIComponent(path)))}catch(e){}

  for(const candidate of candidates){
    try{
      const p=await pages.get(`page/${encodeURIComponent(candidate)}`,{type:'json'});
      if(p)return p;
    }catch(e){}
  }
  return null;
}

function rebuildFromPath(path){
  try{
    const decoded=decodeURIComponent(path);
    const parts=decoded.split('/').filter(Boolean);
    if(parts.length<6 || parts[0]!=='published')return null;

    const provinceShort=parts[1];
    const district=parts[2];
    const dong=parts[3];
    const serviceSlug=parts[4];
    const versionPart=parts[5];

    const service=services.find(x=>x.slug===serviceSlug);
    if(!service)return null;

    const m=/^v([1-5])-/.exec(versionPart);
    if(!m)return null;
    const variant=Number(m[1])-1;

    const region=PROVINCE_BY_SHORT[provinceShort]||provinceShort;
    const p=buildPage({
      region,
      district,
      dong,
      serviceId:service.id,
      variant
    });

    // 요청 URL을 그대로 canonical/urlPath로 사용하여 기존 100개 URL도 살립니다.
    const site=String(process.env.SITE_URL||'https://dahae-clean.netlify.app').replace(/\/$/,'');
    p.urlPath=decoded;
    p.canonical=site+decoded;
    return p;
  }catch(e){
    return null;
  }
}

function html(p){
  const reviews=[
    ['★★★★★',`${p.serviceName} / 경기 수원시`,'신축아파트 입주 전이라 여러 업체 조건을 한 번에 비교할 수 있어서 편했어요. 상담도 빠르고 원하는 날짜에 맞춰 진행할 수 있어서 준비가 훨씬 수월했습니다.','김*진'],
    ['★★★★★','이사청소 / 서울 송파구','이사 날짜가 촉박했는데 여러 곳을 따로 찾지 않아도 되어 편했습니다. 견적과 작업범위를 비교하고 일정에 맞는 업체를 선택할 수 있었어요.','박*영'],
    ['★★★★★','홈클리닝 / 경기 성남시','비용뿐 아니라 작업범위와 결제조건을 같이 비교할 수 있어서 원하는 조건에 맞는 곳을 찾기 좋았습니다.','이*호']
  ];
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(p.title)}</title><meta name="description" content="${esc(p.description)}"><meta name="robots" content="index,follow"><link rel="canonical" href="${esc(p.canonical)}">
<style>${CSS}</style></head><body>
<header class="top">
  <div class="topin">
    <div class="logobox">
      <img src="/dahae-logo.png.png" alt="다해">
    </div>
    <div class="topnote">필요한 일, 다해에서 한 번에</div>
    <div class="platform">청소 견적 비교 플랫폼</div>
  </div>
</header>

<section class="hero">
  <div class="wrap">
    <div class="eyebrow">CLEAN LIFE · BETTER TOMORROW</div>
    <h1>청소가 필요할 땐,<br><strong>다해에서</strong></h1>
    <div class="sub">간단한 정보만 입력하고<br>검증된 청소업체의 견적을 최대 5곳까지 비교하세요.</div>
    <div class="location">● ${esc(p.district)} ${esc(p.area)} · ${esc(p.keyword||p.serviceName)}</div>

    <div class="chips">
      <div class="benefit"><b>회원가입 없음</b><span>간편하게 바로 신청</span></div>
      <div class="benefit"><b>30초 신청</b><span>빠른 견적 요청</span></div>
      <div class="benefit"><b>무료 견적</b><span>비용 부담 없이</span></div>
      <div class="benefit"><b>최대 5곳 비교</b><span>여러 업체 한 번에</span></div>
      <div class="benefit"><b>검증 업체 우선</b><span>믿을 수 있는 업체</span></div>
    </div>
  </div>
</section>

<section class="quotearea">
  <div class="wrap">
    <div class="quote">
      <h2>무료 견적 신청</h2>
      <p>필요한 정보만 간단하게 입력해주세요.</p>

      <div class="quoteinfo">
        <b>${esc(p.area)} 지역과 ${esc(p.keyword||p.serviceName)}</b> 등 필요한 정보를 간단하게 입력하면<br>
        <strong>최대 5곳의 청소 견적을 비교</strong>할 수 있습니다.
      </div>

      <a class="cta" href="https://forms.gle/kNoQu5FJc2wDoC2t6">무료 견적 신청하기 ›</a>

      <div class="safe">
        <span>🔒 개인정보 안전보호</span>
        <span>◷ 빠른 업체 매칭</span>
        <span>♡ 무료 비교견적</span>
      </div>
    </div>
  </div>
</section>

<section class="section">
  <div class="wrap">
    <h2 class="title"><strong>다해</strong>가 선택받는 이유</h2>
    <div class="reasonGrid">
      <div class="reason">
        <div class="ricon">✓</div>
        <h3>검증된 청소업체</h3>
        <p>기본적인 사업자 정보와 서비스 조건을 확인한 업체를 우선 연결합니다.</p>
      </div>
      <div class="reason">
        <div class="ricon">₩</div>
        <h3>합리적인 비용</h3>
        <p>여러 업체의 견적과 작업 조건을 비교해 원하는 조건을 선택할 수 있습니다.</p>
      </div>
      <div class="reason">
        <div class="ricon">◷</div>
        <h3>빠른 견적 & 매칭</h3>
        <p>지역과 청소 정보를 입력하고 필요한 업체의 견적을 편리하게 비교하세요.</p>
      </div>
      <div class="reason">
        <div class="ricon">♡</div>
        <h3>다양한 청소 서비스</h3>
        <p>입주·이사·거주청소 등 지역별 필요한 청소 서비스를 비교할 수 있습니다.</p>
      </div>
    </div>
  </div>
</section>

<section class="section how">
  <div class="wrap">
    <h2 class="title">다해는 이렇게 이용해요</h2>
    <div class="grid3">
      <div class="step"><div class="num">1</div><h3>정보 입력</h3><p>지역과 청소 종류 등 필요한 정보만 간단하게 입력합니다.</p></div>
      <div class="step"><div class="num">2</div><h3>견적 받기</h3><p>조건에 맞는 청소업체의 견적을 최대 5곳까지 받아봅니다.</p></div>
      <div class="step"><div class="num">3</div><h3>비교 후 선택</h3><p>가격과 일정, 작업범위를 비교하고 원하는 업체를 선택합니다.</p></div>
    </div>
  </div>
</section>

<section class="section reviews">
  <div class="wrap">
    <h2 class="title">실제 이용 고객 후기</h2>
    <p class="sectiondesc">다해를 통해 견적을 받은 고객들의 생생한 후기입니다.</p>
    <div class="grid3">
      ${reviews.map(r=>`
        <div class="review">
          <div class="stars">${r[0]}</div>
          <p>${esc(r[1])}</p>
          <div class="reviewer">${esc(r[2])}</div>
        </div>
      `).join('')}
    </div>
  </div>
</section>

<section class="section alt">
  <div class="wrap">
    <h2 class="title">${esc(p.area)} ${esc(p.serviceName)} 안내</h2>
    <div class="content">
      <p>${esc(p.intro)}</p>
      <p>${esc(p.work)}</p>
    </div>
    <div class="seo">
      ${(p.subkeywords||[]).map(x=>`<span>${esc(x)}</span>`).join('')}
    </div>
  </div>
</section>

<section class="dark">
  <div class="wrap">
    <h2 class="title">아무 업체나 연결하지 않습니다.</h2>
    <p class="lead">다해는 단순 연결에서 끝나는 플랫폼이 아니라,<br>고객이 안심하고 맡길 수 있는 조건을 갖춘 업체를 우선 연결합니다.</p>

    <div class="grid4">
      <div class="trust"><div class="icon">✓</div><h3>영업배상책임보험 가입 업체</h3><p>보험 가입 여부를 확인한 업체를 우선 연결합니다.</p></div>
      <div class="trust"><div class="icon">₩</div><h3>사업자 정보 확인</h3><p>사업장 고객이 비용처리를 편리하게 할 수 있는 업체 정보를 안내합니다.</p></div>
      <div class="trust"><div class="icon">▣</div><h3>세금계산서 발급 가능</h3><p>세금계산서 발급 가능 여부를 비교할 수 있도록 돕습니다.</p></div>
      <div class="trust"><div class="icon">♡</div><h3>검증 업체 우선</h3><p>기본적인 사업자 정보와 서비스 조건을 확인한 업체를 우선합니다.</p></div>
    </div>

    <div class="bluebox">
      <h3>견적만 연결하고 끝? 다해는 다릅니다.</h3>
      <p>업체 선택부터 작업 진행, 문제가 생겼을 때의 확인까지.<br>다해가 끝까지 책임지는 청소 견적 플랫폼을 지향합니다.</p>
    </div>
  </div>
</section>

<section class="final">
  <div class="wrap">
    <div>
      <div class="finalsmall">견적만 연결하고 끝? 다해는 다릅니다.</div>
      <h2>청소가 필요할 땐, 다해에서</h2>
      <p>간단하게 신청하고 최대 5곳의 청소 견적을 비교해보세요.</p>
    </div>
    <a class="whitebtn" href="https://forms.gle/kNoQu5FJc2wDoC2t6">무료 견적 신청하기 ›</a>
  </div>
</section>
</body></html>`;
}

const CSS=`
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{
  margin:0;
  font-family:Arial,"Noto Sans KR","Apple SD Gothic Neo",sans-serif;
  color:#10213d;
  background:#f3f8ff;
  line-height:1.65;
  word-break:keep-all;
  overflow-wrap:break-word
}
a{text-decoration:none;color:inherit}
.wrap{width:min(1100px,calc(100% - 40px));margin:0 auto}
.top{height:76px;background:#fff;border-bottom:1px solid #e7eef8;display:flex;align-items:center}
.topin{width:min(1100px,calc(100% - 40px));margin:auto;display:flex;align-items:center;gap:18px}
.logobox{width:82px;height:54px;overflow:hidden;display:flex;align-items:center;justify-content:center}
.logobox img{width:155px;max-width:none;transform:scale(1.5)}
.topnote{font-size:15px;font-weight:700;color:#344762}
.platform{margin-left:auto;background:#edf6ff;color:#1262d8;padding:9px 16px;border-radius:999px;font-weight:700;font-size:14px}

.hero{
  padding:70px 0 35px;
  background:
    radial-gradient(circle at 80% 20%,rgba(87,169,255,.25),transparent 30%),
    linear-gradient(135deg,#f9fcff 0%,#eaf5ff 100%)
}
.eyebrow{font-size:13px;color:#2d78e8;letter-spacing:1.5px;font-weight:700;margin-bottom:12px}
.hero h1{font-size:54px;line-height:1.16;letter-spacing:-2.5px;margin:0 0 20px;color:#07162d}
.hero h1 strong{color:#1267e8}
.sub{font-size:21px;line-height:1.65;color:#40546f;letter-spacing:-.5px}
.location{display:inline-block;margin-top:20px;background:#fff;padding:9px 16px;border-radius:999px;color:#163e72;font-weight:700;box-shadow:0 4px 18px rgba(20,75,140,.08)}

.chips{display:grid;grid-template-columns:repeat(5,1fr);gap:14px;margin-top:35px}
.benefit{background:rgba(255,255,255,.92);border-radius:22px;padding:20px 10px;text-align:center;box-shadow:0 8px 25px rgba(30,88,160,.08)}
.benefit b{display:block;font-size:17px;color:#0c1b34}
.benefit span{display:block;margin-top:5px;font-size:13px;color:#65758b}

.quotearea{padding:28px 0 50px;background:linear-gradient(#eaf5ff,#f5f9ff)}
.quote{background:#fff;border-radius:28px;padding:36px;box-shadow:0 15px 45px rgba(28,76,140,.12)}
.quote h2{font-size:34px;margin:0 0 4px;color:#07162d;letter-spacing:-1px}
.quote>p{margin:0 0 24px;color:#66758a}
.quoteinfo{background:#eef7ff;border-radius:18px;padding:20px;text-align:center;font-size:17px;color:#334967}
.cta{display:block;margin-top:16px;background:linear-gradient(90deg,#1670ed,#2f65e7);color:#fff;text-align:center;padding:19px;border-radius:16px;font-size:22px;font-weight:800;box-shadow:0 10px 25px rgba(25,101,225,.22)}
.safe{display:flex;justify-content:center;gap:45px;margin-top:18px;color:#5c6e86;font-size:13px}

.section{padding:58px 0;background:#f6faff}
.section.alt{background:#fff}
.title{font-size:32px;line-height:1.3;letter-spacing:-1.2px;margin:0 0 25px;color:#07162d}
.title strong{color:#1267e8}
.sectiondesc{margin-top:-15px;color:#728096}

.reasonGrid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
.reason,.step,.review{background:#fff;border-radius:22px;padding:25px;box-shadow:0 8px 25px rgba(22,71,135,.08)}
.ricon{width:44px;height:44px;border-radius:50%;background:#e7f2ff;color:#1670ed;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:900;margin-bottom:12px}
.reason h3,.step h3,.trust h3{margin:0 0 8px;font-size:18px}
.reason p,.step p,.trust p{margin:0;color:#697a90;font-size:14px}

.grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
.step .num{width:38px;height:38px;border-radius:50%;background:#176eec;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;margin-bottom:13px}

.reviews{background:#edf6ff}
.review .stars{color:#ff9d00;font-size:17px;margin-bottom:10px}
.review p{font-size:15px;color:#344861;min-height:76px}
.reviewer{border-top:1px solid #edf0f4;padding-top:12px;font-size:13px;color:#708097}

.content{background:#f7faff;border:1px solid #e6eef8;border-radius:20px;padding:25px;color:#40536d}
.seo{display:flex;flex-wrap:wrap;gap:8px;margin-top:15px}
.seo span{background:#eaf3ff;color:#2861a7;padding:7px 11px;border-radius:999px;font-size:12px}

.dark{background:#0c1a32;color:#fff;padding:65px 0}
.dark .title{color:#fff}
.lead{color:#bcc9dc}
.grid4{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-top:25px}
.trust{background:#fff;color:#13223a;border-radius:20px;padding:23px}
.trust .icon{font-size:26px;color:#176eec;margin-bottom:8px}
.bluebox{margin-top:28px;background:linear-gradient(90deg,#1762d7,#326ce9);border-radius:20px;padding:26px 32px}
.bluebox h3{margin:0 0 8px;font-size:22px}
.bluebox p{margin:0;color:#eaf3ff}

.final{background:#edf5ff;padding:42px 0 55px}
.final .wrap{background:linear-gradient(100deg,#0752b8,#2f6dea);border-radius:26px;padding:34px 40px;color:#fff;display:flex;align-items:center;justify-content:space-between;gap:25px}
.finalsmall{font-size:14px;opacity:.9;margin-bottom:5px}
.final h2{font-size:30px;margin:0 0 7px;letter-spacing:-1px}
.final p{margin:0;color:#e7f0ff}
.whitebtn{background:#fff;color:#1265df;font-weight:800;padding:17px 25px;border-radius:16px;white-space:nowrap}

@media(max-width:800px){
  .wrap,.topin{width:calc(100% - 28px)}
  .top{height:66px}
  .logobox{width:62px;height:45px}
  .logobox img{width:125px;transform:scale(1.45)}
  .topnote{display:none}
  .platform{font-size:12px;padding:7px 11px}

  .hero{padding:45px 0 25px;text-align:center}
  .eyebrow{font-size:11px}
  .hero h1{
    font-size:38px;
    line-height:1.22;
    letter-spacing:-1.5px;
    margin-bottom:18px
  }
  .sub{
    font-size:17px;
    line-height:1.7;
    padding:0 5px
  }
  .location{font-size:14px;margin-top:17px}

  .chips{grid-template-columns:repeat(2,1fr);gap:10px;margin-top:25px}
  .benefit:last-child{grid-column:1 / -1}
  .benefit{padding:16px 7px;border-radius:18px}
  .benefit b{font-size:15px}
  .benefit span{font-size:12px}

  .quotearea{padding:18px 0 35px}
  .quote{padding:25px 18px;border-radius:22px}
  .quote h2{font-size:27px}
  .quoteinfo{font-size:15px;line-height:1.75;padding:17px 12px}
  .cta{font-size:19px;padding:17px 10px}
  .safe{gap:7px;justify-content:space-between;font-size:10px;flex-wrap:wrap}

  .section{padding:42px 0}
  .title{font-size:27px;margin-bottom:20px}
  .reasonGrid,.grid3,.grid4{grid-template-columns:1fr}
  .reason,.step,.review,.trust{padding:20px}
  .review p{min-height:auto}

  .dark{padding:45px 0}
  .lead br,.bluebox p br{display:none}
  .bluebox{padding:22px 20px}

  .final{padding:28px 0}
  .final .wrap{padding:27px 20px;display:block;text-align:center}
  .final h2{font-size:26px}
  .whitebtn{display:block;margin-top:20px;width:100%;padding:16px 10px}

  body{font-size:15px}
}

@media(max-width:420px){
  .hero h1{font-size:34px}
  .sub{font-size:16px}
  .quote h2,.title{font-size:25px}
  .chips{gap:8px}
  .benefit b{font-size:14px}
}
`;

function simple(statusCode,msg){return {statusCode,headers:{'Content-Type':'text/html; charset=utf-8'},body:`<!doctype html><meta charset="utf-8"><h1>${esc(msg)}</h1>`}}
