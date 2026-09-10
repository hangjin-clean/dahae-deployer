const services=require('../../data/services.json');

function json(statusCode,data){
 return {statusCode,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'},body:JSON.stringify(data)};
}
function auth(event){
 const expected=String(process.env.ADMIN_KEY||'').trim();
 if(!expected)return true;
 const got=String(event?.headers?.['x-admin-key']||event?.headers?.['X-Admin-Key']||'').trim();
 return got===expected;
}
function slug(s=''){
 return encodeURIComponent(String(s).trim().replace(/\s+/g,'-'));
}
function esc(s=''){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function serviceById(id){return services.find(x=>x.id===id)||services[0]}
function hash(s=''){let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return (h>>>0).toString(36)}
function shortProvince(x=''){
 const m={'서울특별시':'서울','부산광역시':'부산','대구광역시':'대구','인천광역시':'인천','광주광역시':'광주',
 '대전광역시':'대전','울산광역시':'울산','세종특별자치시':'세종','경기도':'경기','강원특별자치도':'강원',
 '충청북도':'충북','충청남도':'충남','전북특별자치도':'전북','전라남도':'전남','경상북도':'경북','경상남도':'경남'};
 return m[x]||x;
}
function buildPage(input){
 const service=serviceById(input.serviceId);
 const variant=Math.max(0,Number(input.variant||0))%Math.max(1,service.titleKeywords.length);
 const keyword=service.titleKeywords[variant]||service.name;
 const province=String(input.region||'').trim();
 const district=String(input.district||'').trim();
 const dong=String(input.dong||'').trim();
 const pshort=shortProvince(province);
 const titlePatterns=[
   `${dong} ${keyword} ${district} 청소업체 다해`,
   `${dong} ${keyword} ${district} 홈클리닝 업체 비교`,
   `${district} ${dong} ${keyword} 우리동네 청소업체`,
   `${dong} ${keyword} ${pshort} ${district} 무료견적 비교`,
   `${dong} ${keyword} 다해 홈클리닝 업체 비교견적`
 ];
 const title=titlePatterns[variant%titlePatterns.length].replace(/\s+/g,' ').trim();
 const subs=(service.subkeywords||[]).slice(0,7);
 const intro=`${province} ${district} ${dong}에서 ${keyword}을 알아볼 때는 가격만 확인하기보다 작업 범위, 일정, 추가 비용 기준, 결제 조건을 함께 비교하는 것이 좋습니다. 같은 주거형태라도 창틀·주방·욕실·베란다 등 오염 상태와 필요한 작업 범위에 따라 견적은 달라질 수 있습니다. 다해는 간단한 정보를 입력하면 조건에 맞는 청소업체를 비교할 수 있도록 구성한 청소 견적 비교 플랫폼입니다.`;
 const work=`${keyword} 상담 시에는 ${subs.join(', ')} 등 필요한 범위를 먼저 정리해 두면 비교가 쉬워집니다. 업체별로 포함되는 작업과 제외되는 작업, 작업 인원, 예상 소요시간, 카드결제·세금계산서 가능 여부 등을 확인한 뒤 원하는 조건에 맞는 곳을 선택하세요. 다해는 무조건 가장 저렴한 곳보다 가격·작업범위·결제조건·업체 신뢰도를 함께 비교할 수 있도록 돕습니다.`;
 const path=`/published/${slug(pshort)}/${slug(district)}/${slug(dong)}/${service.slug}/v${variant+1}-${hash(province+'|'+district+'|'+dong+'|'+service.id+'|'+variant)}`;
 const site=String(process.env.SITE_URL||'https://dahae-clean.netlify.app').replace(/\/$/,'');
 return {
   id:hash(path), region:province,district,area:dong,dong,serviceId:service.id,serviceName:service.name,serviceSlug:service.slug,
   variant,keyword,title,
   description:`${district} ${dong} ${keyword} 비교. 우리동네에서 가까운 곳 우선, 최대 5곳 무료 견적 비교.`,
   intro,work,subkeywords:subs,
   urlPath:path,canonical:site+path,
   generatedAt:new Date().toISOString()
 };
}
module.exports={json,auth,slug,esc,serviceById,buildPage,shortProvince,hash};
