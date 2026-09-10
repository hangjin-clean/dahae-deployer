const {json,auth}=require('./_shared');
exports.handler=async function(event){
 if(!auth(event))return json(401,{error:'관리자 인증이 필요합니다.'});
 const id=(event.queryStringParameters||{}).id;
 if(!id)return json(400,{error:'publish id가 없습니다.'});
 const {getStore}=await import('@netlify/blobs');
 const s=getStore({name:'dahae-bulk-publish',consistency:'strong'});
 const d=await s.get(`publish/${id}`,{type:'json'});
 return d?json(200,d):json(404,{error:'배포 작업을 찾을 수 없습니다.'});
};
