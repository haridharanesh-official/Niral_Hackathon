// Creates only new, ignored LOCAL secrets. Never rotates existing keys or loads root .env.
const fs=require('node:fs'),path=require('node:path'),{randomBytes}=require('node:crypto');
const dir=path.resolve('tmp/staging');fs.mkdirSync(dir,{recursive:true});
const file=path.join(dir,'compose.env');
if(fs.existsSync(file)){console.log('Existing local staging secrets preserved.');process.exit(0)}
const db=randomBytes(24).toString('hex'),jwt=randomBytes(48).toString('hex'),mail=randomBytes(32).toString('base64'),auth=randomBytes(48).toString('hex');
const local={NODE_ENV:'development',DATABASE_URL:`postgresql://niral_stage:${db}@localhost:55432/niral_staging_test?connect_timeout=3&pool_timeout=3`,NIRAL_TEST_DATABASE_URL:`postgresql://niral_stage:${db}@localhost:55432/niral_staging_test?connect_timeout=3&pool_timeout=3`,REDIS_URL:'redis://localhost:56379',JWT_SECRET:jwt,AUTH_SECRET:auth,AUTH_URL:'http://localhost:3000',NEXTAUTH_URL:'http://localhost:3000',NEXT_PUBLIC_SITE_URL:'http://localhost:3000',API_URL:'http://localhost:4100',API_PORT:'4100',WEB_URL:'http://localhost:3000',CORS_ORIGIN:'http://localhost:3000',EMAIL_PROVIDER:'smtp',EMAIL_FROM:'staging@niral.example.test',SMTP_HOST:'localhost',SMTP_PORT:'51025',MAIL_CAPTURE_URL:'http://localhost:58025',MAIL_QUEUE_ENABLED:'false',MAIL_QUEUE_KEY:mail,GMAIL_RECONCILIATION_ENABLED:'false',UPI_RECONCILIATION_WORKER_ENABLED:'false',PAYMENT_WORKER_ENABLED:'false',MANUAL_UPI_ENABLED:'false',FAMAPP_SANDBOX_ENABLED:'false',FAMAPP_PERSONAL_TEST_AUTHORIZED:'false',UPI_SYNTHETIC_MODE:'false'};
fs.writeFileSync(path.join(dir,'local.env'),Object.entries(local).map(([k,v])=>k+'='+v).join('\n')+'\n',{mode:0o600,flag:'wx'});
fs.writeFileSync(file,`STAGING_DB_PASSWORD=${db}\nSTAGING_JWT_SECRET=${jwt}\nSTAGING_MAIL_KEY=${mail}\n`,{mode:0o600,flag:'wx'});
console.log('Created ignored local staging configuration (no secret values printed). No cloud resources provisioned.');
