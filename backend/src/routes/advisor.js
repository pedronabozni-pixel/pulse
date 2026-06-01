const router = require('express').Router();
const db = require('../database');
const auth = require('../middleware/auth');

const getHospitalContext = () => {
  const activeRisks = db.findAll('risks', { status: 'Ativo' })
    .sort((a, b) => (b.probabilidade * b.severidade) - (a.probabilidade * a.severidade))
    .slice(0, 10);
  const actions = db.findAll('actions').slice(0, 8);
  const allSessions = db.findAll('sessions');
  const sectors = ['UTI', 'Pronto-socorro', 'Internação', 'Centro Cirúrgico', 'Administrativo'];
  const diagResults = sectors.map(sector => {
    const rows = allSessions.filter(s => s.sector === sector);
    if (rows.length === 0) return null;
    const avg = (rows.reduce((s, r) => s + r.score, 0) / rows.length).toFixed(1);
    return { sector, avg_score: avg, n: rows.length };
  }).filter(Boolean);
  const openComplaints = db.findAll('denuncias').filter(d => d.status !== 'Encerrado').length;

  return `Você é o PULSO Advisor, especialista em gestão de riscos psicossociais hospitalares com profundo conhecimento da NR-1 (Portaria MTE 1.419/2024), NR-17, NR-32, Lei 14.457/2022.

DADOS ATUAIS DO HOSPITAL REGIONAL SÃO LUCAS:
- Funcionários CLT: 320 | Salário médio: R$ 3.800
- Turnover: 28% (referência saudável: ≤15%)
- Absenteísmo: 7,4% (referência saudável: ≤3,5%)
- Índice de conformidade NR-1: ~47%
- Denúncias abertas: ${openComplaints}

DIAGNÓSTICO PSICOSSOCIAL (COPSOQ-II) — Score por setor (0-100, maior=pior):
${diagResults.map(r => `  - ${r.sector}: ${r.avg_score} pontos (${r.n} respondentes)`).join('\n')}

TOP RISCOS NO PGR:
${activeRisks.map(r => `  - [${r.nivel_risco_calculado}] ${r.area}: ${r.perigo}`).join('\n')}

PLANOS DE AÇÃO:
${actions.map(a => `  - ${a.what} | Status: ${a.status} | Prazo: ${a.when_date}`).join('\n')}

Responda sempre em português brasileiro. Cite artigos específicos da NR-1. Seja objetivo e prático.`;
};

router.get('/history', auth, (req, res) => {
  const msgs = db.findAll('advisorMessages', { user_id: req.user.id })
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  res.json(msgs);
});

router.post('/chat', auth, async (req, res) => {
  const { message, history = [] } = req.body;
  if (!message) return res.status(400).json({ error: 'Mensagem obrigatória' });

  db.insert('advisorMessages', { user_id: req.user.id, role: 'user', content: message });

  if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY.includes('sua-chave')) {
    const reply = `⚠️ **API da Anthropic não configurada.**\n\nPara ativar o Pulso Advisor:\n1. Abra \`backend/.env\`\n2. Adicione sua chave: \`ANTHROPIC_API_KEY=sk-ant-...\`\n3. Reinicie com \`npm run dev\`\n\n**Enquanto isso, análise manual:**\nCom turnover de 28% e absenteísmo de 7,4%, o Hospital São Lucas tem exposição financeira estimada de **R$ 3,2M/ano**. Prioridade máxima: UTI e Pronto-socorro (riscos CRÍTICOS no PGR). Ação imediata: implantação de suporte psicológico e revisão de escalas.`;
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
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: getHospitalContext(),
      messages,
    });
    const reply = response.content[0].text;
    db.insert('advisorMessages', { user_id: req.user.id, role: 'assistant', content: reply });
    res.json({ response: reply });
  } catch (err) {
    console.error('Anthropic error:', err.message);
    res.status(500).json({ error: 'Erro ao consultar IA: ' + err.message });
  }
});

router.get('/recommendations', auth, (req, res) => {
  res.json([
    { id: 1, titulo: 'Ação Urgente: UTI com Risco Crítico', descricao: 'Score COPSOQ-II de 74 na UTI. Implante suporte psicológico imediatamente.', prioridade: 'Alta', nr: 'NR-1 §1.5.3.2.1', prazo: '30 dias', impacto: 'Redução de 15% no turnover da UTI' },
    { id: 2, titulo: 'Canal de Denúncias: Apurar casos pendentes', descricao: '4 denúncias aguardando apuração. Inércia configura passivo trabalhista.', prioridade: 'Alta', nr: 'NR-1 §1.4.1.1', prazo: '15 dias', impacto: 'Mitigação de R$ 320K em passivo' },
    { id: 3, titulo: 'Treinamentos NR-1: Completar equipe', descricao: 'Apenas 47% dos treinamentos obrigatórios concluídos. Risco de auto-infração.', prioridade: 'Média', nr: 'NR-1 §1.7 Anexo II', prazo: '60 dias', impacto: 'Conformidade NR-1 ≥ 80%' },
    { id: 4, titulo: 'Revisar Escalas do Pronto-Socorro', descricao: 'Jornadas excessivas identificadas. Auditoria de banco de horas atrasada.', prioridade: 'Média', nr: 'NR-17 §17.6', prazo: '45 dias', impacto: 'Redução de 20% no absenteísmo' },
  ]);
});

module.exports = router;
