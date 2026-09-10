const {json,auth,blobStore}=require('./_shared');

exports.handler=async function(event){
 if(!auth(event))return json(401,{error:'관리자 인증이 필요합니다.'});
 try{
   const manifests=await blobStore('dahae-publish-manifests');
   const listed=await manifests.list({prefix:'manifest/'});
   const blobs=(listed.blobs||[]).slice().sort((a,b)=>String(b.key).localeCompare(String(a.key)));
   let urls=[];
   for(const b of blobs){
     const m=await manifests.get(b.key,{type:'json'});
     if(m&&Array.isArray(m.urls))urls.push(...m.urls);
     if(urls.length>=100)break;
   }
   urls=[...new Set(urls)];
   if(!urls.length)return json(200,{pass:false,total:0,sample:[],error:'공개 manifest URL이 없습니다.'});

   const origin=String(process.env.URL||process.env.DEPLOY_PRIME_URL||'https://dahae-clean.netlify.app').replace(/\/$/,'');
   const sample=[];
   for(const raw of urls.slice(0,10)){
     const u=String(raw||'');
     const url=/^https?:\/\//i.test(u)?u:origin+(u.startsWith('/')?'':'/')+u;
     try{
       const r=await fetch(url,{redirect:'follow'});
       const body=await r.text();
       sample.push({url,status:r.status,ok:r.ok,finalUrl:r.url,body:body.slice(0,220).replace(/\s+/g,' ')});
     }catch(e){
       sample.push({url,status:0,ok:false,error:e.message||String(e)});
     }
   }
   return json(200,{pass:sample.length>0&&sample.every(x=>x.ok),total:urls.length,sample});
 }catch(e){
   return json(500,{pass:false,total:0,sample:[],error:e.message||String(e)});
 }
};
