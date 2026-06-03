const router = require('express').Router();
const db = require('../database');
const auth = require('../middleware/auth');
const { requireRole } = auth;

// RH, Jurídico, Gestor, CFO — Colaborador e TI não têm acesso
const canUse = requireRole('rh', 'juridico', 'gestor', 'cfo');

const getHospitalContext = (userRole) => {
  const activeRisks = db.findAll('risks', { status: 'Ativo' })
    .sort((a, b) => (b.probabilidade * b.severidade) - (a.probabilidade * a.severidade)).slice(0, 10);
  const actions = db.findAll('actions').slice(0, 8);
  const allSessions = db.findAll('sessions');
  const sectors = ['UTI', 'Pronto-socorro', 'Internação', 'Centro Cirúrgico', 'Administrativo'];
  const diagResults = sectors.map(sector => {
    const rows = allSessions.filter(s => s.sector === sector);
    if (!rows.length) return null;
    return { sector, avg_score: (rows.reduce((s, r) => s + r.score, 0) / rows.length).toFixed(1), n: rows.length };
  }).filter(Boolean);
  const openComplaints = db.findAll('denuncias').filter(d => d.status !== 'Encerrado').length;

  const roleContext = {
    rh: 'Você está auxiliando o time de RH. Foque em gestão de pessoas, conformidade NR-1 e ações preventivas.',
    juridico: 'Você está auxiliando o time Jurídico. Foque em evidências, conformidade legal, passivo trabalhista e riscos processuais.',
    gestor: 'Você está auxiliando um Gestor de Área. Foque em liderança, gestão de equipe, comunicação e bem-estar da equipe.',
    cfo: 'Você está auxiliando o CFO. Foque em impacto financeiro, ROI, payback, custos de turnover e absenteísmo.',
  };

  return `Você é o PULSO Advisor, especialista em gestão de riscos psicossociais hospitalares.
${roleContext[userRole] || ''}

HOSPITAL REGIONAL SÃO LUCAS:
- 320 funcionários CLT | Salário médio: R$ 3.800
- Turnover: 28% | Absenteísmo: 7,4% | Conformidade NR-1: ~47%
- Denúncias abertas: ${openComplaints}

DIAGNÓSTICO COPSOQ-II:
${diagResults.map(r => `  - ${r.sector}: ${r.avg_score} pts (${r.n} respondentes)`).join('\n')}

TOP RISCOS:
${activeRisks.map(r => `  - [${r.nivel_risco_calculado}] ${r.area}: ${r.perigo}`).join('\n')}

PLANOS DE AÇÃO:
${actions.map(a => `  - ${a.what} | ${a.status} | Prazo: ${a.when_date}`).join('\n')}

Responda sempre em português brasileiro. Cite artigos da NR-1 quando relevante.`;
};

router.get('/history', auth, canUse, (req, res) => {
  const msgs = db.findAll('advisorMessages', { user_id: req.user.id })
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  res.json(msgs);
});

router.post('/chat', auth, canUse, async (req, res) => {
  const { message, history = [] } = req.body;
  if (!message) return res.status(400).json({ error: 'Mensagem obrigatória' });

  const userRole = auth.resolveRole(req.user?.role);
  db.insert('advisorMessages', { user_id: req.user.id, role: 'user', content: message });

  if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY.includes('sua-chave') || process.env.ANTHROPIC_API_KEY.includes('sk-ant-...')) {
    const reply = `⚠️ **API da Anthropic não configurada.**\n\nPara ativar: adicione \`ANTHROPIC_API_KEY\` nas variáveis de ambiente do Railway.\n\n**Análise manual:** Com turnover de 28% e absenteísmo de 7,4%, a exposição financeira estimada é de **R$ 5,8M/ano**. Prioridade: UTI e Pronto-socorro (riscos CRÍTICOS).`;
    db.insert('advisorMessages', { user_id: req.user.id, role: 'assistant', content: reply });
    return res.json({ response: reply, mock: true });
  }

  try {
    const Anthropic = require('@anthropic-ai/sdk');
    const client = new Anthropic.default({ apiKey: process.env.ANTHROPIC_API_KEY });
    const messages = [
      ...history.slice(-10).map(h => ({ role: h.role, content: h.content })),
      { role: 'user', content: message },
    ];
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6', max_tokens: 1024,
      system: getHospitalContext(userRole), messages,
    });
    const reply = response.content[0].text;
    db.insert('advisorMessages', { user_id: req.user.id, role: 'assistant', content: reply });
    res.json({ response: reply });
  } catch (err) {
    console.error('Anthropic error:', err.message);
    res.status(500).json({ error: 'Erro ao consultar IA: ' + err.message });
  }
});

router.get('/recommendations', auth, canUse, (req, res) => {
  const userRole = auth.resolveRole(req.user?.role);
  const allRecs = [
    { id: 1, titulo: 'Ação Urgente: UTI com Risco Crítico', descricao: 'Score COPSOQ-II de 74 na UTI. Implante suporte psicológico imediatamente.', prioridade: 'Alta', nr: 'NR-1 §1.5.3.2.1', prazo: '30 dias', roles: ['rh','juridico'] },
    { id: 2, titulo: 'Canal de Denúncias: Apurar casos pendentes', descricao: '4 denúncias aguardando apuração. Inércia configura passivo trabalhista.', prioridade: 'Alta', nr: 'NR-1 §1.4.1.1', prazo: '15 dias', roles: ['rh','juridico'] },
    { id: 3, titulo: 'Treinamentos NR-1: Completar equipe', descricao: '47% dos obrigatórios concluídos. Risco de auto-infração fiscal.', prioridade: 'Média', nr: 'NR-1 §1.7', prazo: '60 dias', roles: ['rh','gestor','cfo'] },
    { id: 4, titulo: 'Revisar Escalas do Pronto-Socorro', descricao: 'Jornadas excessivas identificadas. Auditoria atrasada.', prioridade: 'Média', nr: 'NR-17 §17.6', prazo: '45 dias', roles: ['rh','gestor'] },
    { id: 5, titulo: 'Redução de turnover: impacto de R$ 1,7M/ano', descricao: 'Programa de retenção pode reduzir turnover de 28% para 15% em 18 meses.', prioridade: 'Alta', nr: 'Metodologia USP 2016', prazo: '90 dias', roles: ['cfo'] },
    { id: 6, titulo: 'Payback do Programa Completo: 14 meses', descricao: 'Investimento de R$ 381K tem retorno de R$ 327K/ano com ROI de 86%.', prioridade: 'Média', nr: 'ROI Psicossocial', prazo: '18 meses', roles: ['cfo'] },
    { id: 7, titulo: 'Conduzir reunião sobre bem-estar da equipe', descricao: 'Score de 74 pts na UTI indica esgotamento. Reunião mensal é recomendada.', prioridade: 'Alta', nr: 'NR-1 §1.5.3.2.1', prazo: '7 dias', roles: ['gestor'] },
  ];
  res.json(allRecs.filter(r => r.roles.includes(userRole)));
});

module.exports = router;
