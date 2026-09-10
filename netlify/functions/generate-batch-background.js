const {auth,buildPage}=require('./_shared');

exports.handler=async function(event){
 if(!auth(event)){console.log('Unauthorized generation');return}
 let payload={};try{payload=JSON.parse(event.body||'{}')}catch(e){return}
 const {jobId,region,targets,serviceId}=payload;
 if(!jobId||!region||!Array.isArray(targets)||!targets.length||!serviceId)return;
 const {getStore}=await import('@netlify/blobs');
 const store=getStore({name:'dahae-generation-jobs',consistency:'strong'});
 const job={
   id:jobId,status:'running',region,serviceId,total:targets.length,completed:0,failed:0,
   createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),
   items:targets.map(t=>({target:t,status:'queued'}))
 };
 const save=()=>store.setJSON(`jobs/${jobId}`,job);
 await save();
 const concurrency=Math.min(10,Math.max(1,Number(process.env.GENERATION_CONCURRENCY||5)));
 let cursor=0;
 async function worker(){
   while(true){
     const i=cursor++; if(i>=targets.length)return;
     const t=targets[i], item=job.items[i];
     item.status='generating';job.updatedAt=new Date().toISOString();await save();
     try{
       const page=buildPage({region,district:t.district,dong:t.dong,serviceId,variant:t.variant});
       item.page=page;item.status='completed';job.completed++;
     }catch(e){
       item.status='failed';item.error=e.message;job.failed++;
     }
     job.updatedAt=new Date().toISOString();await save();
   }
 }
 try{
   await Promise.all(Array.from({length:Math.min(concurrency,targets.length)},()=>worker()));
   job.status=job.failed===job.total?'failed':'completed';
 }catch(e){job.status='failed';job.error=e.message}
 job.finishedAt=new Date().toISOString();job.updatedAt=job.finishedAt;await save();
};
