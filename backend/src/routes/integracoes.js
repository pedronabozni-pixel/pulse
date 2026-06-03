const router = require('express').Router();
const auth = require('../middleware/auth');
const { requireRole } = auth;
const db = require('../database');

// Apenas TI tem acesso
const tiOnly = requireRole('ti');

router.get('/status', auth, tiOnly, (req, res) => {
  const users = db.findAll('users').length;
  const risks = db.findAll('risks').length;
  const sessions = db.findAll('sessions').length;
  const denuncias = db.findAll('denuncias').length;

  res.json({
    status: 'operational',
    version: '1.0.0',
    uptime: Math.floor(process.uptime()),
    db: { users, risks, diagnosticoSessions: sessions, denuncias },
    services: [
      { name: 'API REST', status: 'up', latency: '12ms', url: '/api/health' },
      { name: 'Autenticação JWT', status: 'up', latency: '3ms' },
      { name: 'Banco de Dados JSON', status: 'up', latency: '1ms' },
      { name: 'Anthropic AI', status: process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_API_KEY.includes('sk-ant-...') ? 'up' : 'degraded', latency: '~800ms' },
    ],
    env: process.env.NODE_ENV || 'development',
  });
});

router.get('/endpoints', auth, tiOnly, (req, res) => {
  res.json([
    { method: 'POST', path: '/api/auth/login', desc: 'Autenticação — retorna JWT', auth: false, roles: [] },
    { method: 'GET',  path: '/api/auth/me', desc: 'Dados do usuário logado', auth: true, roles: ['todos'] },
    { method: 'GET',  path: '/api/dashboard/metrics', desc: 'KPIs e conformidade NR-1', auth: true, roles: ['rh','cfo'] },
    { method: 'GET',  path: '/api/diagnostico/questions', desc: 'Questões COPSOQ-II', auth: false, roles: [] },
    { method: 'POST', path: '/api/diagnostico/submit', desc: 'Envio anônimo de respostas', auth: false, roles: [] },
    { method: 'GET',  path: '/api/diagnostico/results', desc: 'Resultados agregados por setor', auth: true, roles: ['rh','juridico'] },
    { method: 'GET',  path: '/api/pgr/risks', desc: 'Inventário de riscos PGR', auth: true, roles: ['rh','juridico'] },
    { method: 'POST', path: '/api/pgr/risks', desc: 'Cadastrar novo risco', auth: true, roles: ['rh'] },
    { method: 'GET',  path: '/api/pgr/actions', desc: 'Planos de ação 5W2H', auth: true, roles: ['rh','juridico'] },
    { method: 'GET',  path: '/api/roi/metrics', desc: 'Métricas financeiras ROI', auth: true, roles: ['cfo'] },
    { method: 'POST', path: '/api/denuncia/submit', desc: 'Envio anônimo de denúncia', auth: false, roles: [] },
    { method: 'GET',  path: '/api/denuncia/list', desc: 'Lista de denúncias', auth: true, roles: ['rh','juridico'] },
    { method: 'GET',  path: '/api/treinamentos', desc: 'Catálogo de cursos', auth: true, roles: ['todos'] },
    { method: 'POST', path: '/api/advisor/chat', desc: 'Chat com IA Pulso Advisor', auth: true, roles: ['rh','juridico','gestor','cfo'] },
    { method: 'GET',  path: '/api/integracoes/status', desc: 'Status dos serviços (TI)', auth: true, roles: ['ti'] },
    { method: 'GET',  path: '/api/integracoes/endpoints', desc: 'Documentação dos endpoints', auth: true, roles: ['ti'] },
    { method: 'GET',  path: '/api/integracoes/webhooks', desc: 'Configuração de webhooks', auth: true, roles: ['ti'] },
    { method: 'GET',  path: '/api/health', desc: 'Health check público', auth: false, roles: [] },
  ]);
});

router.get('/webhooks', auth, tiOnly, (req, res) => {
  res.json({
    webhooks: [
      { id: 1, event: 'denuncia.created', url: 'https://sistema-rh.saolucas.com.br/webhook/denuncia', status: 'ativo', lastFired: null },
      { id: 2, event: 'pgr.risk.created', url: 'https://sistema-rh.saolucas.com.br/webhook/pgr', status: 'inativo', lastFired: null },
      { id: 3, event: 'training.completed', url: null, status: 'não configurado', lastFired: null },
    ],
    integrations: [
      { name: 'Sistema de Folha de Pagamento', provider: 'Datasul', status: 'pendente', type: 'REST API' },
      { name: 'Ponto Eletrônico', provider: 'REP Cloud', status: 'pendente', type: 'WebService SOAP' },
      { name: 'Escala de Trabalho', provider: 'Scala Saúde', status: 'pendente', type: 'REST API' },
      { name: 'Active Directory (SSO)', provider: 'Microsoft AD', status: 'pendente', type: 'LDAP / OAuth2' },
    ],
  });
});

module.exports = router;
