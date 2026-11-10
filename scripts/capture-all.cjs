const { spawn } = require('node:child_process');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = path.resolve(__dirname, '../tmp/screenshots');
fs.mkdirSync(outDir, { recursive: true });

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class CdpClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.id = 1;
    this.callbacks = new Map();
  }

  async connect() {
    this.ws = new WebSocket(this.wsUrl);
    await new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
    });
    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && this.callbacks.has(msg.id)) {
        const { resolve, reject } = this.callbacks.get(msg.id);
        this.callbacks.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
      }
    };
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.id++;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async navigate(url) {
    await this.send('Page.navigate', { url });
    await wait(1200);
  }

  async setViewport(width, height) {
    await this.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: width < 768,
    });
  }

  async evaluate(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    return res.result ? res.result.value : null;
  }

  async screenshot(filename) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    const filePath = path.join(outDir, filename);
    fs.writeFileSync(filePath, Buffer.from(res.data, 'base64'));
    console.log(`Saved screenshot: ${filename} (${fs.statSync(filePath).size} bytes)`);
  }

  async close() {
    try {
      this.ws.close();
    } catch {}
  }
}

async function main() {
  console.log('Launching headless Chrome on port 9222...');
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    '--user-data-dir=' + path.resolve(__dirname, '../tmp/chrome-profile'),
  ]);

  await wait(2500);

  try {
    const targets = await getJson('http://localhost:9222/json');
    const target = targets.find((t) => t.type === 'page') || targets[0];
    if (!target) throw new Error('No Chrome target found');

    const client = new CdpClient(target.webSocketDebuggerUrl);
    await client.connect();
    await client.send('Page.enable');
    await client.send('DOM.enable');

    console.log('--- 1. NIRAL Homepage Baseline Verification ---');
    await client.setViewport(1440, 900);
    await client.navigate('http://localhost:3000/');
    await client.screenshot('01_homepage_baseline.png');

    console.log('--- 2. Login Page (Desktop & Mobile) ---');
    await client.navigate('http://localhost:3000/login');
    await client.screenshot('02_login_desktop_1440.png');

    await client.setViewport(390, 844);
    await wait(300);
    await client.screenshot('03_login_mobile_390.png');

    console.log('--- 3. Login Validation Errors ---');
    await client.setViewport(1440, 900);
    await client.evaluate(`
      document.querySelector('form button[type="submit"]').click();
    `);
    await wait(400);
    await client.screenshot('04_login_validation_errors.png');

    console.log('--- 4. Multi-Step Registration: Step 1 (Account) ---');
    await client.navigate('http://localhost:3000/register');
    await client.screenshot('05_register_step1_account_desktop.png');

    await client.setViewport(390, 844);
    await wait(300);
    await client.screenshot('06_register_step1_account_mobile.png');

    console.log('--- 5. Registration: Transition to Step 2 (Academics) ---');
    await client.setViewport(1440, 900);
    await client.evaluate(`
      const inputs = document.querySelectorAll('input');
      // Full Name
      inputs[0].value = 'Ananya Ramesh';
      inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
      // Email
      inputs[1].value = 'ananya.ramesh@student.edu';
      inputs[1].dispatchEvent(new Event('input', { bubbles: true }));
      // Password
      inputs[2].value = 'NiralHackathon2026!';
      inputs[2].dispatchEvent(new Event('input', { bubbles: true }));
      // Confirm Password
      inputs[3].value = 'NiralHackathon2026!';
      inputs[3].dispatchEvent(new Event('input', { bubbles: true }));
      // Terms checkbox
      inputs[4].checked = true;
      inputs[4].dispatchEvent(new Event('change', { bubbles: true }));
    `);
    await wait(300);
    await client.evaluate(`
      document.querySelector('form button[type="submit"]').click();
    `);
    await wait(600);
    await client.screenshot('07_register_step2_academics_desktop.png');

    console.log('--- 6. Registration: Transition to Step 3 (Skills & Tracks) ---');
    await client.evaluate(`
      const textInputs = document.querySelectorAll('input[type="text"], input[type="tel"]');
      textInputs[0].value = 'PSG College of Technology';
      textInputs[0].dispatchEvent(new Event('input', { bubbles: true }));
      textInputs[1].value = 'Robotics & Automation';
      textInputs[1].dispatchEvent(new Event('input', { bubbles: true }));
      
      const selects = document.querySelectorAll('select');
      selects[0].value = 'B.E. / B.Tech';
      selects[0].dispatchEvent(new Event('change', { bubbles: true }));
      selects[1].value = 'Third year';
      selects[1].dispatchEvent(new Event('change', { bubbles: true }));

      textInputs[2].value = '+91 98765 43210';
      textInputs[2].dispatchEvent(new Event('input', { bubbles: true }));

      const check = document.querySelector('input[type="checkbox"]');
      if (check) {
        check.checked = true;
        check.dispatchEvent(new Event('change', { bubbles: true }));
      }
    `);
    await wait(300);
    await client.evaluate(`
      document.querySelector('form button[type="submit"]').click();
    `);
    await wait(600);
    await client.screenshot('08_register_step3_skills_desktop.png');

    console.log('--- 7. Registration: Transition to Step 4 (Review & Submit) ---');
    await client.evaluate(`
      // Click a couple chips
      const chips = document.querySelectorAll('button[aria-pressed]');
      if (chips.length > 5) {
        chips[4].click();
        chips[6].click();
      }
    `);
    await wait(300);
    await client.evaluate(`
      document.querySelector('form button[type="submit"]').click();
    `);
    await wait(600);
    await client.screenshot('09_register_step4_review_desktop.png');

    console.log('--- 8. Related Auth Pages ---');
    await client.navigate('http://localhost:3000/forgot-password');
    await client.screenshot('10_forgot_password_desktop.png');

    await client.navigate('http://localhost:3000/reset-password');
    await client.screenshot('11_reset_password_desktop.png');

    await client.navigate('http://localhost:3000/verify-email');
    await client.screenshot('12_verify_email_desktop.png');

    await client.navigate('http://localhost:3000/account-recovery');
    await client.screenshot('13_account_recovery_desktop.png');

    await client.navigate('http://localhost:3000/session-expired');
    await client.screenshot('14_session_expired_desktop.png');

    await client.navigate('http://localhost:3000/unauthorized');
    await client.screenshot('15_unauthorized_desktop.png');

    await client.close();
    console.log('All screenshots captured successfully in tmp/screenshots!');
  } finally {
    chrome.kill();
  }
}

main().catch((err) => {
  console.error('Screenshot capture error:', err);
  process.exit(1);
});

