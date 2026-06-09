require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const BASE_URL = process.env.QA_BASE_URL || 'http://localhost:5005';
const PASSWORD = 'QaTest@123';

const endpoints = [
  { key: 'createRfq', method: 'POST', path: '/api/rfqs', body: { title: 'QA RFQ', workpieces: [{ quantity: 10 }], requirements: {} } },
  { key: 'rfqPool', method: 'GET', path: '/api/rfqs/pool' },
  { key: 'rfqSearch', method: 'GET', path: '/api/search/rfqs' },
  { key: 'manufacturerSearch', method: 'GET', path: '/api/search/manufacturers' },
  { key: 'invitations', method: 'GET', path: '/api/invitations' }
];

const expected = {
  BUYER: {
    createRfq: [200, 201, 400],
    rfqPool: [403],
    rfqSearch: [403],
    manufacturerSearch: [200],
    invitations: [403]
  },
  MANUFACTURER: {
    createRfq: [403],
    rfqPool: [200],
    rfqSearch: [200],
    manufacturerSearch: [403],
    invitations: [200]
  },
  HYBRID: {
    createRfq: [200, 201, 400],
    rfqPool: [200],
    rfqSearch: [200],
    manufacturerSearch: [200],
    invitations: [200]
  }
};

const users = [
  { role: 'BUYER', email: `qa_buyer_${Date.now()}@example.com`, fullName: 'QA Buyer', companyName: 'QA Buyer Co', planType: 'BUYER_FREE' },
  { role: 'MANUFACTURER', email: `qa_mfr_${Date.now()}@example.com`, fullName: 'QA Manufacturer', companyName: 'QA Mfr Co', planType: 'STANDARD' },
  { role: 'HYBRID', email: `qa_hybrid_${Date.now()}@example.com`, fullName: 'QA Hybrid', companyName: 'QA Hybrid Co', planType: 'STANDARD' }
];

async function ensureUser({ role, email, fullName, companyName, planType }) {
  const hash = await bcrypt.hash(PASSWORD, 10);
  const doc = {
    fullName,
    email,
    password: hash,
    userType: role,
    phoneNumber: '9876543210',
    companyName,
    address: 'QA Address',
    city: 'Mumbai',
    state: 'Maharashtra',
    zipCode: '400001',
    country: 'India',
    manufacturingTypes: role === 'BUYER' ? [] : ['CNC'],
    isEmailVerified: true,
    status: 'ACTIVE',
    manufacturerStatus: role === 'BUYER' ? undefined : 'ACTIVE',
    subscription: {
      planType,
      status: 'ACTIVE',
      amountPaid: 0,
      billingCycle: 'YEARLY',
      startsAt: new Date()
    }
  };

  await User.findOneAndUpdate({ email }, doc, { upsert: true, new: true, setDefaultsOnInsert: true });
}

async function login(email) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: PASSWORD })
  });
  const data = await res.json();
  if (!res.ok || !data.token) {
    throw new Error(`Login failed for ${email}: ${data.message || 'unknown error'}`);
  }
  return data.token;
}

async function callEndpoint(token, endpoint) {
  const res = await fetch(`${BASE_URL}${endpoint.path}`, {
    method: endpoint.method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: endpoint.method !== 'GET' ? JSON.stringify(endpoint.body || {}) : undefined
  });
  let data = {};
  try {
    data = await res.json();
  } catch (e) {
    data = {};
  }
  return { status: res.status, message: data.message || '' };
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  for (const user of users) {
    await ensureUser(user);
  }

  const report = [];
  for (const user of users) {
    const token = await login(user.email);
    for (const endpoint of endpoints) {
      const actual = await callEndpoint(token, endpoint);
      const allowed = expected[user.role][endpoint.key];
      const pass = allowed.includes(actual.status);
      report.push({
        role: user.role,
        endpoint: endpoint.path,
        method: endpoint.method,
        expected: allowed.join('/'),
        actual: String(actual.status),
        pass: pass ? 'PASS' : 'FAIL',
        message: actual.message
      });
    }
  }

  console.table(report);
  const failed = report.filter(r => r.pass === 'FAIL');
  console.log(`\nTotal: ${report.length}, Passed: ${report.length - failed.length}, Failed: ${failed.length}`);
  if (failed.length > 0) process.exitCode = 1;
}

main()
  .catch((err) => {
    console.error('QA role matrix failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
