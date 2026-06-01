require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

require('./database'); // initialize + seed

const app = express();

app.use(cors({ origin: ['http://localhost:3000', 'http://localhost:5173'], credentials: true }));
app.use(express.json({ limit: '2mb' }));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300 });
app.use('/api/', limiter);

app.use('/api/auth', require('./routes/auth'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/diagnostico', require('./routes/diagnostico'));
app.use('/api/pgr', require('./routes/pgr'));
app.use('/api/roi', require('./routes/roi'));
app.use('/api/denuncia', require('./routes/denuncia'));
app.use('/api/treinamentos', require('./routes/treinamentos'));
app.use('/api/advisor', require('./routes/advisor'));

app.get('/api/health', (_, res) => res.json({ status: 'ok', app: 'PULSO NR-1', version: '1.0.0' }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🏥 PULSO API rodando em http://localhost:${PORT}`));
