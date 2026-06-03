require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

require('./database'); // initialize + seed + migrate

const app = express();
const isProd = process.env.NODE_ENV === 'production';

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '2mb' }));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 500 });
app.use('/api/', limiter);

app.use('/api/auth',        require('./routes/auth'));
app.use('/api/dashboard',   require('./routes/dashboard'));
app.use('/api/diagnostico', require('./routes/diagnostico'));
app.use('/api/pgr',         require('./routes/pgr'));
app.use('/api/roi',         require('./routes/roi'));
app.use('/api/denuncia',    require('./routes/denuncia'));
app.use('/api/treinamentos',require('./routes/treinamentos'));
app.use('/api/advisor',     require('./routes/advisor'));
app.use('/api/integracoes', require('./routes/integracoes'));

app.get('/api/health', (_, res) => res.json({ status: 'ok', app: 'PULSO NR-1', version: '1.1.0' }));

// Em produção serve o frontend compilado
const distPath = path.join(__dirname, '../../frontend/dist');
if (isProd && fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
}

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🏥 PULSO API v1.1 rodando em http://localhost:${PORT}`));
