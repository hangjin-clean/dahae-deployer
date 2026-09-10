const {json,auth}=require('./_shared');
exports.handler=async function(event){
 if(!auth(event))return json(401,{error:'관리자 인증이 필요합니다.'});
 const id=(event.queryStringParameters||{}).id;
 if(!id)return json(400,{error:'job id가 없습니다.'});
 const {getStore}=await import('@netlify/blobs');
 const store=getStore({name:'dahae-generation-jobs',consistency:'strong'});
 const d=await store.get(`jobs/${id}`,{type:'json'});
 return d?json(200,d):json(404,{error:'작업을 찾을 수 없습니다.'});
};
