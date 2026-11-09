/* Real local integration probe. No mocked backend, database, Redis or SMTP. */
const {resolve}=require('path');
const {createRequire}=require('module');
const requireRoot=createRequire(resolve(__dirname,'../../../package.json'));
requireRoot('dotenv').config({path:resolve(__dirname,'../../../.env'),quiet:true});
const {PrismaClient}=requireRoot('@prisma/client');
const {Queue}=requireRoot('bullmq');
const {randomUUID,createHash}=require('crypto');
const {spawn}=require('child_process');
const {writeFileSync,createWriteStream,mkdirSync}=require('fs');
const assert=require('assert/strict');
const evidence=process.env.NIRAL_EVIDENCE_DIR;
if(!evidence)throw Error('Set NIRAL_EVIDENCE_DIR outside tracked source.');
mkdirSync(evidence,{recursive:true});
const url=new URL(process.env.NIRAL_TEST_DATABASE_URL||'http://invalid');
if(!['localhost','127.0.0.1'].includes(url.hostname)||!url.pathname.endsWith('_test'))throw Error('Dedicated local *_test database required.');
if(process.env.SMTP_HOST!=='localhost'||process.env.SMTP_PORT!=='1025'||process.env.EMAIL_PROVIDER!=='smtp'||process.env.MAIL_QUEUE_ENABLED!=='true')throw Error('Real local capture and queue required.');
const prisma=new PrismaClient({datasources:{db:{url:url.toString()}}});
const base='http://localhost:4000/api';
const results=[],messages=[];
let api;
const marker='integration-'+randomUUID();
const email=marker+'@example.test';
const password='LocalIntegration!123';
const newPassword='ChangedIntegration!456';
const check=(name,details={})=>{results.push({name,status:'PASS',...details});console.log('PASS',name);};
const safe=(x,allowBearer=false)=>{
 if(!x||typeof x!=='object')return;
 for(const[k,v]of Object.entries(x)){
  assert(!/^(passwordHash|password|twoFactorSecret|twoFactorBackupCodes|refresh_token|client_secret|token)$/i.test(k),'Private response field');
  if(k==='accessToken')assert(allowBearer,'Unexpected bearer token');else safe(v,allowBearer);
 }
};
async function request(path,body,bearer,method){
 const r=await fetch(base+path,{method:method||(body?'POST':'GET'),headers:{'Content-Type':'application/json',...(bearer?{Authorization:'Bearer '+bearer}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(55000)});
 const data=await r.json();safe(data,path==='/auth/login'&&r.ok);return {status:r.status,data};
}
async function captured(subject){
 const r=await fetch('http://localhost:8025/api/v2/messages?limit=100');const list=await r.json();
 const m=list.items.find(m=>m.Content.Headers.Subject?.[0]===subject&&m.To.some(t=>t.Mailbox+'@'+t.Domain===email));
 assert(m,'Actual SMTP capture missing');
 messages.push({id:m.ID,subject,recipientDomain:'example.test',capturedAt:m.Created});
 const body=JSON.stringify(m).replace(/=\\r\\n/g,'').replace(/=\r?\n/g,'').replace(/=3D/g,'=');
 return body;
}
function tokenFrom(body,purpose){const token=body.match(new RegExp(purpose+'\\.[a-f0-9]{64}'))?.[0];assert(token,'Link token missing in captured message');return token;}
async function webRoleChecks(userId) {
 const root='http://localhost:3000', cookies=new Map();
 async function web(path,options={}) {
  const r=await fetch(root+path,{...options,redirect:'manual',headers:{...(options.headers||{}),Cookie:[...cookies].map(([k,v])=>k+'='+v).join('; ')},signal:AbortSignal.timeout(60000)});
  for(const line of r.headers.getSetCookie()){const first=line.split(';')[0],cut=first.indexOf('=');cookies.set(first.slice(0,cut),first.slice(cut+1));}
  return r;
 }
 const csrf=await (await web('/api/auth/csrf')).json();
 await web('/api/auth/callback/credentials',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded',Origin:root},body:new URLSearchParams({csrfToken:csrf.csrfToken,email,password,callbackUrl:root+'/dashboard'})});
 const session=await (await web('/api/auth/session')).json();assert.equal(session.user?.email,email);
 const paths={VOLUNTEER:['/volunteer','/dashboard/volunteer'],JUDGE:['/judge','/dashboard/judge'],ORGANIZER:['/organizer','/dashboard/organizer'],ADMIN:['/master','/admin']};
 for(const role of ['PARTICIPANT','VOLUNTEER','JUDGE','ORGANIZER','ADMIN']){
  await prisma.user.update({where:{id:userId},data:{role}});
  for(const [required,[path,destination]] of Object.entries(paths)){
   const r=await web(path);assert.equal(r.status,307);assert.equal(new URL(r.headers.get('location'),root).pathname,role===required?destination:'/dashboard');
  }
  const content=await web('/api/content');assert.equal(content.status,role==='ADMIN'?200:403);
  const denied=await web('/api/content',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://untrusted.example.test'},body:'{"action":"reset"}'});assert.equal(denied.status,403);
 }
 await prisma.user.update({where:{id:userId},data:{role:'PARTICIPANT'}});
 assert.equal((await web('/apply')).status,200);
 for(const path of ['/apply','/volunteer','/judge','/organizer','/master','/dashboard/application']){
  const r=await fetch(root+path,{redirect:'manual'});assert.equal(r.status,307);assert.equal(new URL(r.headers.get('location'),root).pathname,'/login');
 }
 check('Actual NextAuth cookies and participant/staff/master route matrix (20 role checks)');
 check('Content API rejects non-admin access and cross-origin mutation');
}
async function main(){
 await prisma.$connect();
 // Refuse to exercise an unrelated API already bound to this port.
 const occupied=await new Promise(resolve=>{const socket=require('net').connect(4000,'localhost');socket.once('connect',()=>{socket.destroy();resolve(true);});socket.once('error',()=>resolve(false));});
 assert(!occupied,'Port 4000 must be free for the isolated integration API.');
 const out=createWriteStream(resolve(evidence,'api-runtime.log'));
 api=spawn(process.execPath,[resolve(__dirname,'../dist/src/main.js')],{cwd:resolve(__dirname,'..'),env:{...process.env,DATABASE_URL:url.toString(),NODE_ENV:'development',API_PORT:'4000'},stdio:['ignore','pipe','pipe']});
 api.stdout.pipe(out);api.stderr.pipe(out);
 let ready=false;for(let i=0;i<60;i++){try{const r=await fetch(base+'/health');if(r.ok){const h=await r.json();assert.equal(h.services.database,'up');assert.equal(h.services.redis,'up');ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,500));}
 assert(ready,'Real API unavailable; see runtime log');check('PostgreSQL + Redis + API health');
 const reg=await request('/auth/register',{name:'Local integration test',email,password,accountPolicyAccepted:true});assert.equal(reg.status,201);assert.equal(reg.data.emailDelivery,'accepted');check('Real account creation and queue-to-SMTP acceptance');
 const user=await prisma.user.findUniqueOrThrow({where:{email}});assert(user.passwordHash&&!user.passwordHash.includes(password));assert.equal(user.role,'PARTICIPANT');assert.equal(user.accountStatus,'PENDING');check('Persisted bcrypt hash, participant role and pending account');
 assert.equal((await request('/auth/register',{name:'Duplicate test',email,password,accountPolicyAccepted:true})).status,409);check('Duplicate identity rejected');
 assert.equal((await request('/auth/login',{email,password})).status,403);check('Unverified sign-in denied');
 const verification=tokenFrom(await captured('Verify your NIRAL 2026 account'),'email-verify');
 const stored=await prisma.verificationToken.findUnique({where:{token:createHash('sha256').update(verification).digest('hex')}});assert(stored);assert(stored.token!==verification,'Verification token must be hashed at rest');check('Bearer verification link hashed at rest');
 assert.equal((await request('/auth/verify-email',{token:verification})).status,201);assert.equal((await request('/auth/verify-email',{token:verification})).status,400);check('One-click link verifies account once');
 const login=await request('/auth/login',{email,password});assert.equal(login.status,201);let bearer=login.data.accessToken;assert(bearer);assert.equal((await request('/auth/me',null,bearer)).status,200);check('Verified login and real persisted session');
 const event=await prisma.event.create({data:{name:'ISOLATED LOCAL INTEGRATION TEST',slug:marker,startsAt:new Date(Date.now()+86400000),endsAt:new Date(Date.now()+172800000),isActive:true,isPublished:true,status:'REGISTRATION_OPEN',registrationEnabled:true,eventMode:'OFFLINE'}});
 const application={eventId:event.id,mode:'ONSITE',rulesAccepted:true,eligibilityConfirmed:true,application:{institution:'Local integration test',department:'Verification',degree:'Engineering',interests:['IoT'],technologies:['TypeScript']}};
 const duplicates=await Promise.all([request('/enrollment',application,bearer),request('/enrollment',application,bearer)]);assert.deepEqual(duplicates.map(x=>x.status).sort(),[201,409]);const submitted=duplicates.find(x=>x.status===201).data;assert.match(submitted.registrationId,/^NIRAL-[A-F0-9]{16}$/);assert.equal(submitted.status,'PENDING');assert.equal(submitted.emailDelivery,'accepted');check('Transactional concurrent submission: one 201, one 409',{registrationId:submitted.registrationId});
 await captured('NIRAL application submitted');
 const saved=await prisma.eventEnrollment.findUniqueOrThrow({where:{userId_eventId:{userId:user.id,eventId:event.id}}});assert.equal(saved.registrationId,submitted.registrationId);assert(saved.consentAcceptedAt);assert.deepEqual(saved.applicationData.institution,application.application.institution);assert.equal(await prisma.eventEnrollment.count({where:{userId:user.id,eventId:event.id}}),1);check('Database application snapshot, ID, status and consent persisted');
 const second=new PrismaClient({datasources:{db:{url:url.toString()}}});try{const again=await second.eventEnrollment.findUniqueOrThrow({where:{id:saved.id}});assert.equal(again.registrationId,saved.registrationId);}finally{await second.$disconnect();}check('Persistence verified through independent database connection');
 const status=await request('/enrollment/me',null,bearer);assert.equal(status.data.enrollment.registrationId,saved.registrationId);check('Authenticated application status retrieves persisted record');
 try{await prisma.eventEnrollment.create({data:{userId:user.id,eventId:event.id,registrationId:'NIRAL-'+randomUUID(),mode:'ONSITE'}});assert.fail('Unique constraint missing');}catch(e){assert.equal(e.code,'P2002');}check('PostgreSQL user/event unique constraint rejects direct duplicates');
 assert.equal((await request('/enrollment/'+saved.id+'/status',{status:'CONFIRMED'},bearer,'PATCH')).status,403);check('Participant cannot approve applications');
 for(const role of ['VOLUNTEER','JUDGE','ORGANIZER','ADMIN']){
  await prisma.user.update({where:{id:user.id},data:{role}});
  assert.equal((await request('/auth/me',null,bearer)).data.role,role);
  const ping=await request('/auth/admin/ping',null,bearer);assert.equal(ping.status,['ORGANIZER','ADMIN'].includes(role)?200:403);
  const judged=await request('/judge/assignments',null,bearer);assert.equal(judged.status,['JUDGE','ORGANIZER','ADMIN'].includes(role)?200:403);
 }
 check('Live role guards for volunteer, judge, organizer and master/admin');
 if (process.env.NIRAL_VERIFY_WEB === 'true') await webRoleChecks(user.id);
 await prisma.user.update({where:{id:user.id},data:{role:'ORGANIZER'}});
 assert.equal((await request('/enrollment/'+saved.id+'/status',{status:'REJECTED'},bearer,'PATCH')).status,200);
 assert.equal((await request('/enrollment/'+saved.id+'/status',{status:'CONFIRMED'},bearer,'PATCH')).status,409);check('Authorized status persistence and invalid transition rejection');
 await prisma.user.update({where:{id:user.id},data:{role:'PARTICIPANT'}});
 const forgot=await request('/auth/forgot-password',{email});const absent=await request('/auth/forgot-password',{email:marker+'-absent@example.test'});assert.deepEqual(forgot,absent);check('Recovery response is neutral and contains no raw token');
 const reset=tokenFrom(await captured('Reset your NIRAL 2026 password'),'password-reset');
 const resetResult=await request('/auth/reset-password',{token:reset,password:newPassword});assert.equal(resetResult.status,201);assert.equal((await request('/auth/reset-password',{token:reset,password:newPassword})).status,400);assert.equal((await request('/auth/me',null,bearer)).status,401);check('Password reset single-use and existing-session revocation');
 await captured('Your NIRAL password was changed');
 assert.equal((await request('/auth/login',{email,password})).status,401);
 const finalLogin=await request('/auth/login',{email,password:newPassword});assert.equal(finalLogin.status,201);bearer=finalLogin.data.accessToken;check('Old password denied; replacement password signs in');
 assert.equal((await request('/auth/logout',{},bearer)).status,201);assert.equal((await request('/auth/me',null,bearer)).status,401);check('Logout revokes actual stored session');
 const queue=new Queue('niral-transactional-email',{connection:{host:'localhost',port:6379}});
 try{const jobs=await queue.getJobs(['completed'],0,99);assert(jobs.length>=4);for(const j of jobs){const serial=JSON.stringify(j.data);assert(!serial.includes(email)&&!serial.includes(verification)&&!serial.includes(reset));assert(j.data.body&&j.data.iv&&j.data.tag);}check('Redis queue completed jobs contain encrypted payloads only',{completedJobs:jobs.length});}finally{await queue.close();}
 check('API responses exclude password hashes, recovery/verification tokens and private secrets');
 writeFileSync(resolve(evidence,'email-evidence.json'),JSON.stringify({capture:'MailHog localhost only; no external delivery',messages},null,2));
}
main().catch(e=>{results.push({name:'Integration probe',status:'FAIL',error:e.message});console.error('FAIL',e.message);process.exitCode=1;}).finally(async()=>{api?.kill();await prisma.$disconnect();writeFileSync(resolve(evidence,'integration-results.json'),JSON.stringify({database:'dedicated local niral_integration_test',scope:'Real API + PostgreSQL + Redis queue + SMTP capture; isolated test data',results},null,2));});
