import { reconcile } from './reconcile.mjs';

const order = { id: 'TEST-ORDER-001', amountPaise: 100, payee: 'demo-payee@fam' };
const claim = { orderId: order.id, utr: '123456789012' };
const messages = [{
  id: 'synthetic-msg-001', from: 'alerts@example.test',
  body: `Amount: ₹1.00\nUTR: 123456789012\nPayee: demo-payee@fam\nStatus: Credited`,
}];
const expectedSender = 'alerts@example.test';
console.log('1. Only Gmail-like alert:');
console.log(reconcile({ order, claim, messages, expectedSender }));
console.log('\n2. Add manually simulated independent receiving-account record:');
const officialCredits = [{ utr: claim.utr, amountPaise: 100, payee: order.payee, recordType: 'RECEIVING_ACCOUNT_CREDIT' }];
console.log(reconcile({ order, claim, messages, expectedSender, officialCredits }));
console.log('\n3. Attempt reuse of same UTR:');
console.log(reconcile({ order, claim, messages, expectedSender, officialCredits, usedUtrs: [claim.utr] }));
