// index.js
import express from 'express';
import cors from 'cors';

const app = express();

// ---- CONFIG ----
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'https://yellow-hill-016ea1a1e.3.azurestaticapps.net';
// Optional: simple “wake up” log
app.get('/ping', (req, res) => res.json({ ok: true, message: 'API awake' }));

// CORS: only allow the known front-end
app.use(cors({
  origin: (origin, cb) => {
    // Allow server-to-server or curl with no origin
    if (!origin) return cb(null, true);
    if (origin === ALLOWED_ORIGIN) return cb(null, true);
    return cb(new Error(`CORS blocked: ${origin}`));
  },
  optionsSuccessStatus: 200,
}));

app.use(express.json());

// roll util
function roll(count, sides) {
  const rolls = Array.from({ length: count }, () => 1 + Math.floor(Math.random() * sides));
  const total = rolls.reduce((a, b) => a + b, 0);
  return { rolls, total };
}

// REST API: GET /roll?count=2&sides=6
app.get('/roll', (req, res) => {
  const count = Number(req.query.count ?? 1);
  const sides = Number(req.query.sides ?? 6);

  if (!Number.isInteger(count) || !Number.isInteger(sides) || count < 1 || count > 20 || sides < 2 || sides > 100) {
    return res.status(400).json({ error: 'Invalid params: 1<=count<=20, 2<=sides<=100' });
  }

  return res.json({ count, sides, ...roll(count, sides) });
});

// Root has NO standard UI (per spec)
// But we provide a minimal API test page at /test
app.get('/', (_req, res) => {
  res.type('text').send('Dice API is running. Use /test for API testing page.');
});

// Minimal test page that CALLS the API (not the full app)
app.get('/test', (_req, res) => {
  res.type('html').send(`
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><title>Dice API Test</title></head>
<body>
  <h1>Dice API Test</h1>
  <button id="btn">Roll 2d6</button>
  <pre id="out"></pre>
  <script>
    document.getElementById('btn').addEventListener('click', async () => {
      const url = '/roll?count=2&sides=6';
      try {
        const r = await fetch(url);
        const data = await r.json();
        document.getElementById('out').textContent = JSON.stringify(data, null, 2);
      } catch (e) {
        document.getElementById('out').textContent = 'Error: ' + e.message;
      }
    });
  </script>
</body>
</html>`);
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Dice API listening on ${port}`);
  console.log(`Allowed Origin: ${ALLOWED_ORIGIN}`);
});
