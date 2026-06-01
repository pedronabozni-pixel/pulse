const router = require('express').Router();
const db = require('../database');
const auth = require('../middleware/auth');

router.get('/metrics', auth, (req, res) => {
  const activeRisks = db.findAll('risks', { status: 'Ativo' });
  const totalRisks = activeRisks.length;
  const criticalRisks = activeRisks.filter(r => r.nivel_risco_calculado === 'Crítico').length;
  const highRisks = activeRisks.filter(r => r.nivel_risco_calculado === 'Alto').length;
  const allActions = db.findAll('actions');
  const actionsDone = allActions.filter(a => a.status === 'Concluído').length;
  const actionsTotal = allActions.length;
  const actionsLate = allActions.filter(a => a.status === 'Atrasado').length;
  const openComplaints = db.findAll('denuncias').filter(d => d.status !== 'Encerrado').length;
  const diagSessions = db.findAll('sessions').length;
  const trainingsCompleted = db.findAll('progress').filter(p => p.completed).length;
  const trainingsTotal = db.findAll('progress').length;

  let compliance = 0;
  if (diagSessions >= 5) compliance += 20;
  if (actionsTotal > 0) compliance += 15;
  if (actionsDone / Math.max(actionsTotal, 1) > 0.3) compliance += 15;
  if (trainingsCompleted > 0) compliance += 20;
  compliance += 10; // canal de denúncias ativo
  compliance += Math.min(20, Math.round((actionsDone / Math.max(actionsTotal, 1)) * 20));

  res.json({
    compliance: Math.min(compliance, 100),
    totalRisks, criticalRisks, highRisks, openComplaints,
    actionsDone, actionsTotal, actionsLate, diagSessions,
    trainingsCompleted, trainingsTotal,
    hospital: { nome: 'Hospital Regional São Lucas', funcionarios: 320, salarioMedio: 3800, turnover: 28, absenteismo: 7.4 },
  });
});

router.get('/risks-by-sector', auth, (req, res) => {
  const active = db.findAll('risks', { status: 'Ativo' });
  const areas = [...new Set(active.map(r => r.area))].sort();
  const rows = areas.map(area => {
    const r = active.filter(x => x.area === area);
    return {
      area,
      critico: r.filter(x => x.nivel_risco_calculado === 'Crítico').length,
      alto: r.filter(x => x.nivel_risco_calculado === 'Alto').length,
      medio: r.filter(x => x.nivel_risco_calculado === 'Médio').length,
      baixo: r.filter(x => x.nivel_risco_calculado === 'Baixo').length,
    };
  });
  res.json(rows);
});

router.get('/diagnostico-by-sector', auth, (req, res) => {
  const sectors = ['UTI', 'Pronto-socorro', 'Internação', 'Centro Cirúrgico', 'Administrativo'];
  const allSessions = db.findAll('sessions');
  const result = sectors.map(sector => {
    const rows = allSessions.filter(s => s.sector === sector);
    if (rows.length < 5) return { sector, avg: null, nivel: 'Insuficiente', count: rows.length };
    const avg = Math.round(rows.reduce((s, r) => s + r.score, 0) / rows.length);
    const nivel = avg <= 40 ? 'Baixo' : avg <= 60 ? 'Médio' : avg <= 80 ? 'Alto' : 'Crítico';
    return { sector, avg, nivel, count: rows.length };
  });
  res.json(result);
});

router.get('/pgr-timeline', auth, (req, res) => {
  const history = db.findAll('pgrHistory').sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  res.json(history);
});

router.get('/alerts', auth, (req, res) => {
  const allActions = db.findAll('actions');
  const allRisks = db.findAll('risks');
  const lateActions = allActions
    .filter(a => a.status === 'Atrasado')
    .slice(0, 5)
    .map(a => {
      const risk = allRisks.find(r => r.id === a.risk_id);
      return { ...a, area: risk?.area || '—' };
    });
  const newComplaints = db.findAll('denuncias', { status: 'Recebido' }).slice(0, 3);
  res.json({ lateActions, newComplaints });
});

module.exports = router;
