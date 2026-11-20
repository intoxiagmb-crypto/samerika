// Loopback development fixtures only. Never connects to a remote database.
import {fileURLToPath} from 'node:url';
import {DatabaseSync} from 'node:sqlite';
import {readdirSync,readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {randomBytes} from 'node:crypto';
import {Business} from '../lib/business.mjs';
import {hashPassword} from '../lib/local-auth.mjs';
const folder=new URL('../.wrangler/state/v3/d1/miniflare-D1DatabaseObject/',import.meta.url);
const candidates=readdirSync(folder).filter(f=>f.endsWith('.sqlite')&&f!=='metadata.sqlite');
if(candidates.length!==1)throw new Error('Expected one local D1 database. Start npm run dev first and check the local database.');
const sqlite=new DatabaseSync(fileURLToPath(new URL(candidates[0],folder)));sqlite.exec('PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;');
if(!sqlite.prepare("SELECT name FROM sqlite_master WHERE name='users'").get())for(const file of readdirSync(new URL('../drizzle/',import.meta.url)).filter(f=>f.endsWith('.sql')).sort())sqlite.exec(readFileSync(new URL('../drizzle/'+file,import.meta.url),'utf8'));
else sqlite.exec(readFileSync(new URL('../drizzle/0003_local_portal_auth.sql',import.meta.url),'utf8'));
const db={prepare(sql){return {bind(...args){return {async first(){return sqlite.prepare(sql).get(...args)||null;},async all(){return {results:sqlite.prepare(sql).all(...args)};},async run(){const r=sqlite.prepare(sql).run(...args);return {meta:{changes:Number(r.changes)}};}};}};},async batch(stmts){sqlite.exec('BEGIN');try{const result=[];for(const s of stmts)result.push(await s.run());sqlite.exec('COMMIT');return result;}catch(e){sqlite.exec('ROLLBACK');throw e;}}};
const service=new Business(db),now=new Date().toISOString();
mkdirSync(new URL('../.sites-runtime/',import.meta.url),{recursive:true});
const credentialFile=new URL('../.sites-runtime/demo-credentials.json',import.meta.url);
const credentials=existsSync(credentialFile)?JSON.parse(readFileSync(credentialFile,'utf8')):{agent:{email:'agent@solaris.demo',password:'Agent-'+randomBytes(9).toString('base64url')},company:{email:'company@solaris.demo',password:'Company-'+randomBytes(9).toString('base64url')}};
for(const [key,role,name] of [['company','ADMIN','Aarav Sharma'],['agent','PARTNER','Riya Mehta']]){
 const id='local-demo-'+key,credential=credentials[key];
 sqlite.prepare("INSERT OR IGNORE INTO users(id,email,name,role,status,profile,created_at) VALUES(?,?,?,?,?,'{}',?)").run(id,credential.email,name,role,'Active',now);
 if(!sqlite.prepare('SELECT user_id FROM local_credentials WHERE user_id=?').get(id)){const {salt,hash}=hashPassword(credential.password);sqlite.prepare('INSERT INTO local_credentials(user_id,salt,password_hash) VALUES(?,?,?)').run(id,salt,hash);}
}
writeFileSync(credentialFile,JSON.stringify(credentials,null,2),{mode:0o600});
const company=await service.one('SELECT * FROM users WHERE id=?','local-demo-company'),agent=await service.one('SELECT * FROM users WHERE id=?','local-demo-agent');
// Existing user records and company configuration are preserved.
for(const [id,name,role] of [['local-demo-sales','Kabir Shah','SALES'],['local-demo-manager','Ananya Rao','MANAGER'],['local-demo-tech','Dev Patel','TECHNICAL'],['local-demo-review','Neha Singh','VERIFIER']])sqlite.prepare("INSERT OR IGNORE INTO users(id,email,name,role,status,profile,created_at) VALUES(?,?,?,?,?,'{}',?)").run(id,id+'@solaris.demo',name,role,'Active',now);
let product=await service.one("SELECT * FROM records WHERE kind='product' AND json_extract(data,'$.name')=?",'Demo · Rooftop solar kit');
if(!product){const id=await service.act(company,'product.create',{name:'Demo · Rooftop solar kit',brand:'Solaris Demo',category:'Solar kit',capacity:3,price:165000,system:'On-grid',warranty:'Illustrative demo terms; final warranty in quotation',description:'Sample product for exploring the workflow. Not a commercial offer.'});product=await service.one('SELECT * FROM records WHERE id=?',id);}
const fixtures=[['demo-home-1','Aditya Kapoor','9000000101',3,'Residential','Jaipur','New'],['demo-home-2','Meera Joshi','9000000102',5,'Residential','Udaipur','Survey'],['demo-shop-3','Greenleaf Studio','9000000103',8,'Commercial','Jaipur','Quotation'],['demo-home-4','Vikram Sethi','9000000104',4,'Residential','Ajmer','Installation'],['demo-home-5','Nisha Verma','9000000105',3,'Residential','Kota','Interested']];
for(const [key,name,mobile,capacity,property,city,stage] of fixtures){
 const email=key+'@solaris.demo';if(await service.one('SELECT id FROM leads WHERE customer_email=?',email))continue;
 const leadId=await service.act(agent,'lead.create',{name,mobile,email,capacity,property,city,state:'Rajasthan',pin:'302001',address:'Demo site · 24 Green Park',finance:'Cash',system:'On-grid',remarks:'Sample customer requirement for exploring Solaris. No actual customer or installation.'});
 if(stage==='New')continue;
 await service.act(company,'lead.update',{id:leadId,status:stage==='Interested'?'Interested':'Qualified',assignedTo:'local-demo-sales',note:'Demo enquiry reviewed; customer requirement recorded.'});
 if(stage==='Interested')continue;
 const projectId=await service.act(company,'project.create',{leadId});
 await service.act(company,'project.update',{id:projectId,assignment:{managerId:'local-demo-manager',technicianId:'local-demo-tech',verifierId:'local-demo-review'}});
 const due=new Date();due.setDate(due.getDate()+14);
 await service.act(company,'project.update',{id:projectId,status:stage,dueDate:due.toISOString().slice(0,10),note:'Demo project at '+stage+' stage.'});
 if(stage==='Survey')continue;
 const survey=await service.act(company,'survey.create',{projectId,date:now.slice(0,10),roofType:'RCC',area:capacity*100,shading:'Demo: minimal shading',feasibility:'Feasible',notes:'Illustrative feasibility assessment.'});
 await service.act(company,'record.update',{id:survey,status:'Approved',note:'Demo survey approved.'});
 const quote=await service.act(company,'quote.create',{projectId,productId:product.id,installation:10000,discount:0,validUntil:due.toISOString().slice(0,10),terms:'Demo quotation only. Not a commercial offer.'});
 await service.act(company,'record.update',{id:quote,status:'Approved'});await service.act(company,'record.update',{id:quote,status:'Sent'});
 if(stage==='Installation'){await service.act(company,'record.update',{id:quote,status:'Accepted',note:'Demo acceptance for preview only.'});for(let i=0;i<2;i++)await service.act(company,'project.update',{id:projectId,phase:i,evidence:'Demo milestone, for preview only.'});}
}
sqlite.close();console.log('Local demo prepared. Credentials saved privately in .sites-runtime/demo-credentials.json. Existing records preserved.');
