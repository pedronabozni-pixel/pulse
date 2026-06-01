const router = require('express').Router();
const db = require('../database');
const auth = require('../middleware/auth');

const QUESTIONS = [
  { id: 'q1', step: 2, text: 'Com que frequência você tem trabalho em quantidade excessiva?', domain: 'Demandas Quantitativas', reverse: false },
  { id: 'q2', step: 2, text: 'Você precisa trabalhar em ritmo muito acelerado?', domain: 'Demandas Quantitativas', reverse: false },
  { id: 'q3', step: 2, text: 'Você tem prazo suficiente para completar suas tarefas?', domain: 'Demandas Quantitativas', reverse: true },
  { id: 'q4', step: 2, text: 'Com que frequência você enfrenta situações emocionalmente exigentes?', domain: 'Demandas Emocionais', reverse: false },
  { id: 'q5', step: 2, text: 'Seu trabalho exige que você esconda seus sentimentos ou emoções?', domain: 'Demandas Emocionais', reverse: false },
  { id: 'q6', step: 2, text: 'Você tem influência sobre a forma como realiza suas tarefas?', domain: 'Autonomia', reverse: true },
  { id: 'q7', step: 2, text: 'Você pode influenciar a quantidade de trabalho que recebe?', domain: 'Autonomia', reverse: true },
  { id: 'q8', step: 2, text: 'Seu trabalho oferece oportunidades de aprendizado e desenvolvimento?', domain: 'Desenvolvimento', reverse: true },
  { id: 'q9', step: 2, text: 'Você sabe exatamente o que se espera de você no trabalho?', domain: 'Clareza do Papel', reverse: true },
  { id: 'q10', step: 2, text: 'Você recebe informações suficientes sobre o que acontece na organização?', domain: 'Clareza do Papel', reverse: true },
  { id: 'q11', step: 3, text: 'Você é tratado(a) com respeito por seus superiores imediatos?', domain: 'Suporte Social Liderança', reverse: true },
  { id: 'q12', step: 3, text: 'Você recebe suporte e ajuda de seus superiores quando necessário?', domain: 'Suporte Social Liderança', reverse: true },
  { id: 'q13', step: 3, text: 'Seus superiores reconhecem e valorizam seu trabalho?', domain: 'Reconhecimento', reverse: true },
  { id: 'q14', step: 3, text: 'Você recebe suporte e ajuda de seus colegas de trabalho?', domain: 'Suporte Social Colegas', reverse: true },
  { id: 'q15', step: 3, text: 'Existe boa cooperação e espírito de equipe entre os colegas?', domain: 'Suporte Social Colegas', reverse: true },
  { id: 'q16', step: 3, text: 'Você confia nas informações que recebe da gestão?', domain: 'Confiança Organizacional', reverse: true },
  { id: 'q17', step: 3, text: 'Os conflitos são resolvidos de maneira justa e transparente?', domain: 'Justiça', reverse: true },
  { id: 'q18', step: 3, text: 'Você presencia ou sofre situações de assédio ou humilhação no trabalho?', domain: 'Violência/Assédio', reverse: false },
  { id: 'q19', step: 4, text: 'Com que frequência você se sente fisicamente esgotado(a) ao final do turno?', domain: 'Burnout Físico', reverse: false },
  { id: 'q20', step: 4, text: 'Com que frequência você se sente emocionalmente exausto(a)?', domain: 'Burnout Emocional', reverse: false },
  { id: 'q21', step: 4, text: 'Com que frequência você se sente estressado(a) no trabalho?', domain: 'Estresse', reverse: false },
  { id: 'q22', step: 4, text: 'Com que frequência você tem dificuldades para dormir por causa do trabalho?', domain: 'Estresse', reverse: false },
  { id: 'q23', step: 4, text: 'Como você avalia sua saúde geral atualmente?', domain: 'Saúde Geral', reverse: true },
  { id: 'q24', step: 4, text: 'Você sente que o trabalho prejudica sua saúde física ou mental?', domain: 'Saúde Geral', reverse: false },
  { id: 'q25', step: 4, text: 'Com que frequência você pensa em deixar este emprego?', domain: 'Intenção de Saída', reverse: false },
  { id: 'q26', step: 4, text: 'No geral, você está satisfeito(a) com seu trabalho?', domain: 'Satisfação', reverse: true },
  { id: 'q27', step: 5, text: 'Você dispõe dos equipamentos e materiais necessários para realizar seu trabalho?', domain: 'Condições Físicas', reverse: true },
  { id: 'q28', step: 5, text: 'As condições físicas do ambiente (ruído, temperatura, iluminação) são adequadas?', domain: 'Condições Físicas', reverse: true },
  { id: 'q29', step: 5, text: 'Você tem pausas suficientes durante o turno de trabalho?', domain: 'Organização do Tempo', reverse: true },
  { id: 'q30', step: 5, text: 'Sua escala de trabalho afeta negativamente sua vida pessoal e familiar?', domain: 'Organização do Tempo', reverse: false },
  { id: 'q31', step: 5, text: 'Você sente que tem suporte institucional para lidar com situações de crise?', domain: 'Suporte Institucional', reverse: true },
  { id: 'q32', step: 5, text: 'A carga de trabalho é distribuída de forma justa entre os membros da equipe?', domain: 'Organização do Tempo', reverse: true },
];

const SCALE = [
  { value: 1, label: 'Nunca / Quase nunca' },
  { value: 2, label: 'Raramente' },
  { value: 3, label: 'Às vezes' },
  { value: 4, label: 'Frequentemente' },
  { value: 5, label: 'Sempre / Quase sempre' },
];

router.get('/questions', (req, res) => res.json({ questions: QUESTIONS, scale: SCALE }));

router.post('/submit', (req, res) => {
  const { sector, turno, tempo_funcao, respostas } = req.body;
  if (!sector || !respostas) return res.status(400).json({ error: 'Dados incompletos' });

  let total = 0, count = 0;
  QUESTIONS.forEach(q => {
    const val = respostas[q.id];
    if (!val) return;
    total += q.reverse ? (6 - val) : val;
    count++;
  });

  const score = count > 0 ? Math.round((total / (count * 5)) * 100) : 0;
  const nivel_risco = score <= 40 ? 'Baixo' : score <= 60 ? 'Médio' : score <= 80 ? 'Alto' : 'Crítico';
  const token = `tok_${Date.now().toString(36)}`;

  db.insert('sessions', { session_token: token, sector, turno: turno || null, tempo_funcao: tempo_funcao || null, respostas: JSON.stringify(respostas), score, nivel_risco });

  res.json({ protocolo: token, score, nivel_risco, message: 'Resposta registrada anonimamente. Obrigado pela participação.' });
});

router.get('/results', auth, (req, res) => {
  const sectors = ['UTI', 'Pronto-socorro', 'Internação', 'Centro Cirúrgico', 'Administrativo'];
  const allSessions = db.findAll('sessions');
  const results = sectors.map(sector => {
    const rows = allSessions.filter(s => s.sector === sector);
    if (rows.length < 5) return { sector, count: rows.length, suficiente: false };
    const avg = Math.round(rows.reduce((s, r) => s + r.score, 0) / rows.length);
    const nivel = avg <= 40 ? 'Baixo' : avg <= 60 ? 'Médio' : avg <= 80 ? 'Alto' : 'Crítico';
    const dist = { Baixo: 0, Médio: 0, Alto: 0, Crítico: 0 };
    rows.forEach(r => { if (dist[r.nivel_risco] !== undefined) dist[r.nivel_risco]++; });
    return { sector, count: rows.length, avg, nivel, dist, suficiente: true };
  });
  res.json({ results, total: allSessions.length });
});

module.exports = router;
