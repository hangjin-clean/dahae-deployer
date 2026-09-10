exports.handler=async function(){
 const {getStore}=await import('@netlify/blobs');
 const m=getStore({name:'dahae-publish-manifests',consistency:'strong'});
 const latest=await m.get('latest',{type:'json'});
 const site=String(process.env.SITE_URL||'https://dahae-clean.netlify.app').replace(/\/$/,'');
 const urls=[site+'/',...((latest&&latest.urls)||[])];
 const xml=`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${[...new Set(urls)].map(u=>`<url><loc>${x(u)}</loc></url>`).join('')}</urlset>`;
 return {statusCode:200,headers:{'Content-Type':'application/xml; charset=utf-8','Cache-Control':'public,max-age=300'},body:xml};
};
function x(s=''){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
