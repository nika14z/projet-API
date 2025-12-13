// backend/security-tests/scan.js
// Non-destructive security checks for the local API (localhost:5000)
// Usage: node scan.js

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE = process.env.BASE_URL || 'http://localhost:5000';
const TIMEOUT = 5000;

function ok(msg) { console.log('[OK]   ', msg); }
function warn(msg) { console.log('[WARN] ', msg); }
function err(msg) { console.log('[ERR]  ', msg); }

async function checkReachable() {
  process.stdout.write('1) Vérification atteignabilité du serveur... ');
  try {
    const res = await axios.get(BASE, { timeout: TIMEOUT });
    ok(`serveur répond (${res.status})`);
    return true;
  } catch (e) {
    err('impossible de joindre le serveur à ' + BASE + ' — démarrez le backend avant d exécuter ce script.');
    return false;
  }
}

async function checkSecurityHeaders() {
  process.stdout.write('2) Vérification des en-têtes de sécurité (Helmet/CSP)... ');
  try {
    
    const res = await axios.get(BASE, { timeout: TIMEOUT });
    const h = res.headers;
    const checks = [
      { k: 'x-content-type-options', want: true },
      { k: 'x-frame-options', want: true },
      { k: 'content-security-policy', want: false }, // CSP is optional but recommended
      { k: 'strict-transport-security', want: false }, // only when HTTPS
      { k: 'x-xss-protection', want: false }
    ];
    checks.forEach(c => {
      if (h[c.k]) {
        ok(`${c.k} : ${h[c.k]}`);
      } else {
        warn(`${c.k} absent`);
      }
    });
  } catch (e) {
    err('Erreur lecture en-têtes: ' + e.message);
  }
}

async function checkCORS() {
  process.stdout.write('3) Vérification CORS (Origin permissif)... ');
  try {
    const url = BASE + '/api/books';
    const res = await axios.options(url, { headers: { Origin: 'http://evil.example' }, timeout: TIMEOUT });
    const allow = res.headers['access-control-allow-origin'];
    if (!allow) {
      warn('Pas d en-tête Access-Control-Allow-Origin (probablement OK)');
    } else if (allow === '*') {
      warn('Access-Control-Allow-Origin: * (permissif)');
    } else {
      ok('Access-Control-Allow-Origin: ' + allow);
    }
  } catch (e) {
    // Some servers don't reply to OPTIONS; try GET with Origin header
    try {
      const res2 = await axios.get(BASE + '/api/books', { headers: { Origin: 'http://evil.example' }, timeout: TIMEOUT });
      const allow = res2.headers['access-control-allow-origin'];
      if (allow === '*') warn('Access-Control-Allow-Origin: * (permissif)'); else ok('CORS header: ' + (allow || 'absent'));
    } catch (e2) {
      warn('Impossible d évaluer CORS: ' + e2.message);
    }
  }
}

async function checkNoSQLInjection() {
  process.stdout.write('4) Test NoSQL injection (tentative login avec payload objet)... ');
  try {
    // Payload attempting to match any document: { "$gt": "" }
    const payload = { email: { "$gt": "" }, password: 'x' };
    const res = await axios.post(BASE + '/api/auth/login', payload, { timeout: TIMEOUT, validateStatus: s => true });
    if (res.status === 200) {
      warn('Login réussi avec payload NoSQL-like -> possible injection NoSQL (vérifier sanitation)');
    } else {
      ok('Login refusé pour payload NoSQL-like (OK) — status ' + res.status);
    }
  } catch (e) {
    err('Erreur test NoSQL injection: ' + e.message);
  }
}

async function checkXSS() {
  process.stdout.write('5) Test XSS (POST/GET d un livre avec payload script)... ');
  try {
    const unique = 'xss-test-' + Date.now();
    const book = {
      title: `<script>alert("${unique}")</script>`,
      author: 'scanner',
      price: 1,
      category: 'Test',
      description: 'desc',
      image: 'img.jpg'
    };
    const create = await axios.post(BASE + '/api/books', book, { timeout: TIMEOUT, validateStatus: s => s < 500 });
    if (create.status >= 400) { warn('Impossible de créer livre de test (statut ' + create.status + ') — peut-être protégé'); return; }
    const id = create.data._id || create.data.id;
    if (!id) { warn('Livre créé mais id non trouvé, réponse: ' + JSON.stringify(create.data)); return; }
    const get = await axios.get(BASE + '/api/books/' + id, { timeout: TIMEOUT });
    const returned = get.data.title || get.data.name || '';
    if (returned.includes('<script') || returned.includes('alert(')) {
      warn('Payload script renvoyé tel quel -> risque XSS stocké');
    } else if (returned.includes('&lt;') || returned.includes('script')) {
      ok('Payload script a été neutralisé/échappé (probablement OK)');
    } else {
      ok('Payload non présent tel quel — vérifiez le rendu côté frontend');
    }
  } catch (e) {
    err('Erreur test XSS: ' + e.message);
  }
}

function checkEnvJWT() {
  process.stdout.write('6) Vérification JWT_SECRET dans backend/.env... ');
  try {
    const envPath = path.join(__dirname, '..', '.env');
    if (!fs.existsSync(envPath)) { warn('.env introuvable dans backend/'); return; }
    const raw = fs.readFileSync(envPath, 'utf8');
    const m = raw.match(/^JWT_SECRET=(.*)$/m);
    if (!m) { warn('JWT_SECRET non défini dans .env'); return; }
    const secret = m[1].trim();
    if (!secret || secret === 'secret' || secret.length < 12) {
      warn('JWT_SECRET semble faible ou par défaut (' + secret + ')');
    } else {
      ok('JWT_SECRET défini (longueur ' + secret.length + ')');
    }
  } catch (e) {
    err('Erreur lecture .env: ' + e.message);
  }
}

async function checkSwagger() {
  process.stdout.write('7) Vérification documentation Swagger /api-docs... ');
  try {
    const res = await axios.get(BASE + '/api-docs', { timeout: TIMEOUT, validateStatus: s => s < 500 });
    if (res.status === 200) ok('/api-docs accessible (attention: documentation exposée)'); else warn('/api-docs renvoyé status ' + res.status);
  } catch (e) {
    warn('Impossible d atteindre /api-docs: ' + e.message);
  }
}

async function runAll() {
  console.log('--- Lancement du scan de sécurité non-destructif ---');
  const up = await checkReachable();
  if (!up) return;
  await checkSecurityHeaders();
  await checkCORS();
  await checkNoSQLInjection();
  await checkXSS();
  checkEnvJWT();
  await checkSwagger();
  console.log('--- Scan terminé ---');
}

runAll();
