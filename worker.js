const J=(o,s=200,c='no-store')=>new Response(JSON.stringify(o),{status:s,headers:{'content-type':'application/json','cache-control':c}});
const sha=async s=>new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)));
async function auth(req,env){
  const pw=env.ADMIN_PASSWORD,ip=req.headers.get('CF-Connecting-IP')||'?';
  if(!pw||pw.length<12)return{err:J({error:'Chưa cấu hình mật khẩu admin'},503)};
  const n=(await env.DB.prepare("SELECT COUNT(*) c FROM log WHERE action='fail' AND email=? AND ts>datetime('now','-15 minutes')").bind(ip).first()).c;
  if(n>=5)return{err:J({error:'Sai quá nhiều lần, thử lại sau 15 phút'},429)};
  let k='';try{k=decodeURIComponent(req.headers.get('X-Admin-Key')||'')}catch(e){}
  const x=await sha(k),y=await sha(pw);let d=0;for(let i=0;i<32;i++)d|=x[i]^y[i];
  if(d){await env.DB.prepare("INSERT INTO log(email,action,detail) VALUES(?,'fail','')").bind(ip).run();return{err:J({error:'Sai mật khẩu'},403)}}
  return{me:'admin'};
}
const rows=async(env,sql)=>(await env.DB.prepare(sql).all()).results.map(r=>[r.k,r.n1,r.n2,r.n3,r.n4,r.n5,r.n6]);
async function admin(req,env){
  const au=await auth(req,env);if(au.err)return au.err;const me=au.me;
  const last=async()=>(await env.DB.prepare('SELECT MAX(k) m FROM draws').first()).m||0;
  const log=(a,d)=>env.DB.prepare('INSERT INTO log(email,action,detail) VALUES(?,?,?)').bind(me,a,d);
  if(req.method==='GET')return J({email:me,last:await rows(env,'SELECT * FROM draws ORDER BY k DESC LIMIT 8')});
  if(req.method==='DELETE'){const m=await last();if(!m)return J({error:'Không có dữ liệu'},400);
    await env.DB.batch([env.DB.prepare('DELETE FROM draws WHERE k=?').bind(m),log('delete',String(m))]);return J({ok:1,deleted:m})}
  if(req.method==='POST'){
    let b;try{b=await req.json()}catch(e){return J({error:'Dữ liệu không hợp lệ'},400)}
    const d=b.draws;if(!Array.isArray(d)||!d.length||d.length>200)return J({error:'Cần 1 đến 200 kỳ'},400);
    let k=await last();const st=[];
    for(const r of d){
      if(!Array.isArray(r)||r.length!==7||!r.every(Number.isInteger))return J({error:'Sai định dạng'},400);
      const [kk,...n]=r;
      if(kk!==k+1)return J({error:`Kỳ phải là #${k+1}, nhận được #${kk}`},400);
      if(n.some(x=>x<1||x>45)||new Set(n).size!==6)return J({error:`Kỳ #${kk}: cần 6 số khác nhau từ 1 đến 45`},400);
      n.sort((a,b)=>a-b);st.push(env.DB.prepare('INSERT INTO draws VALUES(?,?,?,?,?,?,?)').bind(kk,...n));k=kk;
    }
    st.push(log('add',d.length+' kỳ, đến #'+k));await env.DB.batch(st);return J({ok:1,added:d.length,last:k});
  }
  return J({error:'Không hỗ trợ'},405);
}
export default{async fetch(req,env){
  const p=new URL(req.url).pathname;
  if(p==='/api/draws')return J(await rows(env,'SELECT * FROM draws ORDER BY k'),200,'public, max-age=30');
  if(p==='/api/admin/draws')return admin(req,env);
  return env.ASSETS.fetch(req);
}};
