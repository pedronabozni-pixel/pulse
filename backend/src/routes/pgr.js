const router = require('express').Router();
const db = require('../database');
const auth = require('../middleware/auth');

const calcNivel = (p, s) => { const v = p * s; return v <= 4 ? 'Baixo' : v <= 8 ? 'Médio' : v <= 12 ? 'Alto' : 'Crítico'; };

router.get('/risks', auth, (req, res) => {
  const risks = db.findAll('risks', { status: 'Ativo' })
    .sort((a, b) => (b.probabilidade * b.severidade) - (a.probabilidade * a.severidade));
  res.json(risks);
});

router.post('/risks', auth, (req, res) => {
  const { perigo, grupo_exposto, area, probabilidade, severidade, medidas_implementadas, nr_referencia, fonte } = req.body;
  if (!perigo || !grupo_exposto || !area || !probabilidade || !severidade)
    return res.status(400).json({ error: 'Campos obrigatórios: perigo, grupo_exposto, area, probabilidade, severidade' });
  const nivel = calcNivel(+probabilidade, +severidade);
  const risk = db.insert('risks', { perigo, grupo_exposto, area, nivel, probabilidade: +probabilidade, severidade: +severidade, nivel_risco_calculado: nivel, medidas_implementadas: medidas_implementadas || null, nr_referencia: nr_referencia || null, fonte: fonte || 'PGR', status: 'Ativo' });
  db.insert('pgrHistory', { version: `v_${new Date().toISOString().split('T')[0]}`, action_summary: `Novo perigo adicionado: "${perigo}" — ${area}`, created_by: req.user.id });
  res.status(201).json({ id: risk.id, nivel });
});

router.put('/risks/:id', auth, (req, res) => {
  const { perigo, grupo_exposto, area, probabilidade, severidade, medidas_implementadas, nr_referencia, status } = req.body;
  const nivel = calcNivel(+probabilidade, +severidade);
  db.update('risks', { id: +req.params.id }, { perigo, grupo_exposto, area, nivel, probabilidade: +probabilidade, severidade: +severidade, nivel_risco_calculado: nivel, medidas_implementadas, nr_referencia, status: status || 'Ativo' });
  res.json({ success: true, nivel });
});

router.delete('/risks/:id', auth, (req, res) => {
  db.update('risks', { id: +req.params.id }, { status: 'Inativo' });
  res.json({ success: true });
});

router.get('/actions', auth, (req, res) => {
  const allActions = db.findAll('actions');
  const allRisks = db.findAll('risks');
  const actions = allActions
    .map(a => {
      const risk = allRisks.find(r => r.id === a.risk_id);
      return { ...a, perigo: risk?.perigo || null, area: risk?.area || null };
    })
    .sort((a, b) => (b.status === 'Atrasado') - (a.status === 'Atrasado'));
  res.json(actions);
});

router.post('/actions', auth, (req, res) => {
  const { risk_id, what, why, who, when_date, where_loc, how, how_much, responsible } = req.body;
  if (!what || !why || !who || !when_date || !where_loc || !how)
    return res.status(400).json({ error: 'Preencha todos os campos 5W2H obrigatórios' });
  const action = db.insert('actions', { risk_id: risk_id ? +risk_id : null, what, why, who, when_date, where_loc, how, how_much: how_much || null, status: 'Não iniciado', responsible: responsible || who });
  res.status(201).json({ id: action.id });
});

router.put('/actions/:id', auth, (req, res) => {
  const { what, why, who, when_date, where_loc, how, how_much, status, responsible } = req.body;
  db.update('actions', { id: +req.params.id }, { what, why, who, when_date, where_loc, how, how_much, status, responsible });
  res.json({ success: true });
});

router.get('/history', auth, (req, res) => {
  const history = db.findAll('pgrHistory')
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const users = db.findAll('users');
  const enriched = history.map(h => {
    const user = users.find(u => u.id === h.created_by);
    return { ...h, author: user?.name || 'Sistema' };
  });
  res.json(enriched);
});

router.post('/history', auth, (req, res) => {
  const { action_summary } = req.body;
  const h = db.insert('pgrHistory', { version: `v_${new Date().toISOString().split('T')[0]}`, action_summary, created_by: req.user.id });
  res.status(201).json({ id: h.id });
});

router.get('/export', auth, (req, res) => {
  const risks = db.findAll('risks', { status: 'Ativo' }).sort((a, b) => (b.probabilidade * b.severidade) - (a.probabilidade * a.severidade));
  const allActions = db.findAll('actions');
  const allRisks = db.findAll('risks');
  const actions = allActions.map(a => {
    const risk = allRisks.find(r => r.id === a.risk_id);
    return { ...a, perigo: risk?.perigo || null, area: risk?.area || null };
  });
  const history = db.findAll('pgrHistory').sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 10);
  res.json({
    hospital: { nome: 'Hospital Regional São Lucas', cnpj: '12.345.678/0001-90', endereco: 'Av. das Hortênsias, 1200 — Bela Vista', funcionarios: 320 },
    risks, actions, history, generated_at: new Date().toISOString(), responsible: req.user.name,
  });
});

module.exports = router;
