// JSON-based persistent store — no native modules required
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'db.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const EMPTY = {
  users: [], risks: [], actions: [], sessions: [],
  denuncias: [], denunciaUpdates: [], trainings: [],
  progress: [], pgrHistory: [], advisorMessages: [],
  _seq: {},
};

let DB = EMPTY;

function load() {
  if (fs.existsSync(DATA_FILE)) {
    try { DB = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
    catch { DB = { ...EMPTY }; }
  }
}
load();

function save() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(DB, null, 2));
}

function seq(table) {
  if (!DB._seq) DB._seq = {};
  DB._seq[table] = (DB._seq[table] || 0) + 1;
  return DB._seq[table];
}

function now() { return new Date().toISOString(); }

// Generic CRUD
function insert(table, data) {
  const row = { id: seq(table), ...data, created_at: now() };
  DB[table].push(row);
  save();
  return row;
}

function findAll(table, filter = {}) {
  const rows = DB[table] || [];
  if (!Object.keys(filter).length) return rows;
  return rows.filter(r => Object.entries(filter).every(([k, v]) => r[k] === v));
}

function findOne(table, filter = {}) {
  return findAll(table, filter)[0] || null;
}

function update(table, filter, data) {
  DB[table] = DB[table].map(r => {
    const match = Object.entries(filter).every(([k, v]) => r[k] === v);
    return match ? { ...r, ...data, updated_at: now() } : r;
  });
  save();
}

function remove(table, filter) {
  DB[table] = DB[table].filter(r => !Object.entries(filter).every(([k, v]) => r[k] === v));
  save();
}

function count(table, filter = {}) { return findAll(table, filter).length; }

// Export
const db = { insert, findAll, findOne, update, remove, count, save, get data() { return DB; } };
module.exports = db;

// ── MIGRATE — adiciona usuários novos sem re-seed ────────────────────────────
function migrate() {
  const h = pw => bcrypt.hashSync(pw, 10);
  const roleUsers = [
    { name: 'Ana Lima', email: 'rh@saolucas.com.br', role: 'rh', sector: 'RH' },
    { name: 'Dr. Marcus Andrade', email: 'juridico@saolucas.com.br', role: 'juridico', sector: 'Jurídico' },
    { name: 'Enf. Patricia Costa', email: 'gestor@saolucas.com.br', role: 'gestor', sector: 'UTI' },
    { name: 'João da Silva', email: 'colaborador@saolucas.com.br', role: 'colaborador', sector: 'Internação' },
    { name: 'Roberto Alves', email: 'cfo@saolucas.com.br', role: 'cfo', sector: 'Administrativo' },
    { name: 'Lucas Mendes', email: 'ti@saolucas.com.br', role: 'ti', sector: 'TI' },
  ];
  roleUsers.forEach(u => {
    if (!findOne('users', { email: u.email })) {
      insert('users', { ...u, password_hash: h('pulso123') });
      console.log(`➕ Usuário criado: ${u.email} (${u.role})`);
    }
  });
  // Garante que admin tem role 'rh'
  update('users', { email: 'admin@saolucas.com.br' }, { role: 'rh' });
}

// ── SEED ────────────────────────────────────────────────────────────────────
function seed() {
  if (DB.users.length > 0) { migrate(); return; }
  console.log('🌱 Populando banco de dados...');

  const h = pw => bcrypt.hashSync(pw, 10);
  insert('users', { name: 'Administrador SESMT', email: 'admin@saolucas.com.br', password_hash: h('pulso123'), role: 'admin', sector: 'SESMT' });
  insert('users', { name: 'Dr. Carlos Silva', email: 'dr.silva@saolucas.com.br', password_hash: h('senha123'), role: 'manager', sector: 'UTI' });
  insert('users', { name: 'Enf. Ana Santos', email: 'enf.santos@saolucas.com.br', password_hash: h('senha123'), role: 'viewer', sector: 'Internação' });
  insert('users', { name: 'Dra. Maria Costa', email: 'dra.costa@saolucas.com.br', password_hash: h('senha123'), role: 'viewer', sector: 'Pronto-socorro' });
  insert('users', { name: 'Roberto Alves (CFO)', email: 'cfo@saolucas.com.br', password_hash: h('senha123'), role: 'cfo', sector: 'Administrativo' });

  const calcNivel = (p, s) => { const v = p * s; return v <= 4 ? 'Baixo' : v <= 8 ? 'Médio' : v <= 12 ? 'Alto' : 'Crítico'; };

  const risksData = [
    { perigo: 'Sobrecarga de trabalho crônica e escalas 12h+', grupo_exposto: 'Equipe de enfermagem completa', area: 'UTI', probabilidade: 4, severidade: 4, medidas_implementadas: 'Nenhuma implementada', nr_referencia: 'NR-1 §1.5.3.2.1 / NR-17', fonte: 'PGR', status: 'Ativo' },
    { perigo: 'Violência de pacientes e acompanhantes (verbal/física)', grupo_exposto: 'Médicos, Enfermeiros, Técnicos', area: 'Pronto-socorro', probabilidade: 4, severidade: 4, medidas_implementadas: 'Botão de pânico instalado em 2 pontos', nr_referencia: 'NR-1 §1.5.3.2.1 / NR-32', fonte: 'PGR', status: 'Ativo' },
    { perigo: 'Desgaste emocional com morte e sofrimento contínuo', grupo_exposto: 'Toda equipe assistencial UTI', area: 'UTI', probabilidade: 4, severidade: 3, medidas_implementadas: 'Nenhuma implementada', nr_referencia: 'NR-1 §1.5.3.2.1', fonte: 'PGR', status: 'Ativo' },
    { perigo: 'Jornadas excessivas e acúmulo de horas extras', grupo_exposto: 'Médicos plantonistas', area: 'Pronto-socorro', probabilidade: 3, severidade: 4, medidas_implementadas: 'Registro de ponto eletrônico instalado', nr_referencia: 'NR-1 §1.5.3.2.1 / NR-17', fonte: 'PGR', status: 'Ativo' },
    { perigo: 'Trabalho em turnos noturnos contínuos sem rodízio', grupo_exposto: 'Técnicos de enfermagem', area: 'Internação', probabilidade: 4, severidade: 3, medidas_implementadas: 'Escala com rodízio trimestral', nr_referencia: 'NR-17 §17.6', fonte: 'PGR', status: 'Ativo' },
    { perigo: 'Assédio moral por chefia durante procedimentos', grupo_exposto: 'Técnicos e auxiliares CC', area: 'Centro Cirúrgico', probabilidade: 3, severidade: 3, medidas_implementadas: 'Código de ética publicado na intranet', nr_referencia: 'NR-1 §1.4.1.1 / Lei 14.457/2022', fonte: 'Denúncia', status: 'Ativo' },
    { perigo: 'Pressão por produtividade e metas cirúrgicas', grupo_exposto: 'Equipe cirúrgica completa', area: 'Centro Cirúrgico', probabilidade: 3, severidade: 3, medidas_implementadas: 'Reuniões mensais de equipe', nr_referencia: 'NR-1 §1.5.3.2.1', fonte: 'PGR', status: 'Ativo' },
    { perigo: 'Falta de EPIs adequados para biossegurança', grupo_exposto: 'Enfermagem e técnicos', area: 'Internação', probabilidade: 2, severidade: 4, medidas_implementadas: 'Solicitação de compra em andamento', nr_referencia: 'NR-32 / NR-6', fonte: 'PGR', status: 'Ativo' },
    { perigo: 'Conflitos interpessoais entre equipes multidisciplinares', grupo_exposto: 'Equipe multiprofissional', area: 'Administrativo', probabilidade: 3, severidade: 2, medidas_implementadas: 'Nenhuma implementada', nr_referencia: 'NR-1 §1.5.3.2.1', fonte: 'PGR', status: 'Ativo' },
    { perigo: 'Exposição a agentes biológicos (COVID, HIV, Hepatite)', grupo_exposto: 'Toda equipe assistencial', area: 'UTI', probabilidade: 3, severidade: 4, medidas_implementadas: 'Protocolos de biossegurança ativos', nr_referencia: 'NR-32 §32.3', fonte: 'PGR', status: 'Ativo' },
    { perigo: 'Falta de autonomia nas decisões de trabalho', grupo_exposto: 'Técnicos de enfermagem', area: 'Administrativo', probabilidade: 2, severidade: 2, medidas_implementadas: 'Nenhuma implementada', nr_referencia: 'NR-17', fonte: 'PGR', status: 'Ativo' },
    { perigo: 'Ambiente físico precário: ruído e temperatura elevada', grupo_exposto: 'Toda equipe PS', area: 'Pronto-socorro', probabilidade: 3, severidade: 2, medidas_implementadas: 'Laudo de engenharia pendente', nr_referencia: 'NR-9 / NR-17', fonte: 'PGR', status: 'Ativo' },
  ];
  risksData.forEach(r => insert('risks', { ...r, nivel: calcNivel(r.probabilidade, r.severidade), nivel_risco_calculado: calcNivel(r.probabilidade, r.severidade) }));

  const actionsData = [
    { risk_id: 1, what: 'Implantação de escala humanizada com limite de 10h/turno', why: 'Reduzir sobrecarga e risco de burnout conforme NR-17', who: 'SESMT + RH + Chefia UTI', when_date: '2024-06-30', where_loc: 'UTI e Internação', how: 'Revisão de escalas com software de gestão; contratar 15 técnicos adicionais', how_much: 'R$ 180.000/ano', status: 'Em andamento', responsible: 'Gerência de RH' },
    { risk_id: 2, what: 'Implantação de protocolo ZERO VIOLÊNCIA com treinamento', why: 'Proteger integridade física e psíquica conforme NR-32', who: 'Equipe de Segurança + CIPA', when_date: '2024-05-15', where_loc: 'Pronto-socorro', how: 'Treinamento CNV; câmeras adicionais; protocolo de escalonamento', how_much: 'R$ 45.000', status: 'Não iniciado', responsible: 'Coordenador de Segurança' },
    { risk_id: 3, what: 'Implantação de suporte psicológico plantonista', why: 'Prevenir burnout e afastamentos conforme NR-1 2024', who: 'Psicólogo clínico contratado', when_date: '2024-04-30', where_loc: 'SESMT - sala dedicada', how: 'Atendimento semanal individual e grupos de apoio mensais', how_much: 'R$ 8.500/mês', status: 'Em andamento', responsible: 'SESMT' },
    { risk_id: 4, what: 'Auditoria e regularização de banco de horas', why: 'Conformidade CLT e redução de passivo trabalhista', who: 'DP + Jurídico', when_date: '2024-04-15', where_loc: 'Departamento Pessoal', how: 'Levantamento de cartões-ponto; quitação de banco de horas; regramento formal', how_much: 'R$ 25.000', status: 'Atrasado', responsible: 'Departamento Pessoal' },
    { risk_id: 1, what: 'Programa de reconhecimento e plano de carreira', why: 'Reduzir turnover de 28% para 15% em 18 meses', who: 'RH + Direção', when_date: '2024-08-31', where_loc: 'Toda a organização', how: 'Bônus por desempenho + plano de carreira publicado + pesquisa de clima semestral', how_much: 'R$ 60.000/ano', status: 'Não iniciado', responsible: 'Diretor de RH' },
  ];
  actionsData.forEach(a => insert('actions', a));

  const denunciasData = [
    { protocolo: 'PULSO-2024-001', tipo: 'Assédio Moral', setor: 'Centro Cirúrgico', descricao: 'Relatos de humilhações públicas durante procedimentos cirúrgicos por parte da chefia médica', frequencia: 'Semanal', status: 'Em apuração' },
    { protocolo: 'PULSO-2024-002', tipo: 'Sobrecarga', setor: 'UTI', descricao: 'Escala de 48h seguidas sem descanso adequado em período de férias da equipe', frequencia: 'Eventual', status: 'Medida adotada' },
    { protocolo: 'PULSO-2024-003', tipo: 'Violência', setor: 'Pronto-socorro', descricao: 'Agressão verbal de familiar de paciente, sem suporte institucional posterior ao incidente', frequencia: 'Frequente', status: 'Recebido' },
    { protocolo: 'PULSO-2024-004', tipo: 'Discriminação', setor: 'Administrativo', descricao: 'Tratamento diferenciado por gênero na distribuição de tarefas e promoções de cargo', frequencia: 'Contínua', status: 'Recebido' },
    { protocolo: 'PULSO-2024-005', tipo: 'Assédio Sexual', setor: 'Internação', descricao: 'Comentários e comportamentos inadequados e persistentes de superior hierárquico', frequencia: 'Recorrente', status: 'Encerrado' },
  ];
  denunciasData.forEach(d => insert('denuncias', d));

  const updatesData = [
    { denuncia_id: 2, status: 'Em apuração', observacao: 'Caso registrado e encaminhado para CIPA e RH' },
    { denuncia_id: 2, status: 'Medida adotada', observacao: 'Revisão de escala aprovada pela direção. 3 colaboradores contratados temporariamente.' },
    { denuncia_id: 5, status: 'Em apuração', observacao: 'Comissão de apuração formada conforme Lei 14.457/2022' },
    { denuncia_id: 5, status: 'Medida adotada', observacao: 'Afastamento preventivo do denunciado. Sessões de apoio psicológico oferecidas.' },
    { denuncia_id: 5, status: 'Encerrado', observacao: 'Processo administrativo concluído. Medida disciplinar aplicada.' },
  ];
  updatesData.forEach(u => insert('denunciaUpdates', u));

  const trainingsData = [
    { titulo: 'Riscos Psicossociais e NR-1 (Portaria MTE 1.419/2024)', descricao: 'Fundamentos dos riscos psicossociais, exigências da NR-1 2024, instrumentos de avaliação COPSOQ-II e responsabilidades do SESMT', categoria: 'Obrigatório NR-1', obrigatorio: true, duracao_horas: 4, nr_base: 'NR-1 §1.7 Anexo II', lei_base: null, thumbnail_color: '#004D40' },
    { titulo: 'Prevenção ao Assédio no Ambiente Hospitalar', descricao: 'Conceitos, reconhecimento e denúncia de assédio moral e sexual. Canais de apoio, CIPA e responsabilidades da organização', categoria: 'Obrigatório Legal', obrigatorio: true, duracao_horas: 3, nr_base: null, lei_base: 'Lei 14.457/2022', thumbnail_color: '#BF360C' },
    { titulo: 'NR-32: Segurança e Saúde em Serviços de Saúde', descricao: 'Riscos biológicos, químicos e físicos. EPIs, biossegurança, gestão de resíduos e acidentes com material biológico', categoria: 'Obrigatório NR-32', obrigatorio: true, duracao_horas: 6, nr_base: 'NR-32', lei_base: null, thumbnail_color: '#E65100' },
    { titulo: 'Comunicação Não-Violenta para Líderes Hospitalares', descricao: 'Técnicas de comunicação empática e resolução de conflitos. Redução de agressividade e melhoria do clima organizacional', categoria: 'Desenvolvimento de Liderança', obrigatorio: false, duracao_horas: 8, nr_base: null, lei_base: null, thumbnail_color: '#1976D2' },
    { titulo: 'Gestão do Estresse e Prevenção ao Burnout', descricao: 'Identificação e manejo do estresse ocupacional. Estratégias de autocuidado e resiliência para profissionais de saúde', categoria: 'Saúde Mental', obrigatorio: false, duracao_horas: 5, nr_base: 'NR-1', lei_base: null, thumbnail_color: '#6A1B9A' },
    { titulo: 'NR-17: Ergonomia no Ambiente Hospitalar', descricao: 'Condições ergonômicas, postura, movimentação de pacientes, organização do trabalho e cargas cognitivas', categoria: 'Obrigatório NR-17', obrigatorio: true, duracao_horas: 4, nr_base: 'NR-17', lei_base: null, thumbnail_color: '#2E7D32' },
  ];
  trainingsData.forEach(t => insert('trainings', t));

  const progressData = [
    { user_id: 1, training_id: 1, progress: 100, completed: true, certificate_date: '2024-02-15' },
    { user_id: 1, training_id: 2, progress: 100, completed: true, certificate_date: '2024-02-20' },
    { user_id: 1, training_id: 3, progress: 75, completed: false, certificate_date: null },
    { user_id: 1, training_id: 4, progress: 30, completed: false, certificate_date: null },
    { user_id: 1, training_id: 5, progress: 0, completed: false, certificate_date: null },
    { user_id: 1, training_id: 6, progress: 100, completed: true, certificate_date: '2024-03-01' },
    { user_id: 2, training_id: 1, progress: 100, completed: true, certificate_date: '2024-02-18' },
    { user_id: 2, training_id: 3, progress: 60, completed: false, certificate_date: null },
    { user_id: 3, training_id: 1, progress: 100, completed: true, certificate_date: '2024-02-22' },
    { user_id: 3, training_id: 2, progress: 45, completed: false, certificate_date: null },
    { user_id: 3, training_id: 6, progress: 80, completed: false, certificate_date: null },
  ];
  progressData.forEach(p => insert('progress', p));

  const pgrData = [
    { version: 'v1.0 — 2024-01-15', action_summary: 'Inventário inicial: 8 perigos identificados, 3 planos de ação criados. Elaboração PGR inaugural.', created_by: 1 },
    { version: 'v1.1 — 2024-02-10', action_summary: 'Atualização pós-diagnóstico COPSOQ-II: 2 novos perigos identificados. Planos de ação atualizados.', created_by: 1 },
    { version: 'v1.2 — 2024-03-05', action_summary: 'Inclusão de riscos originados de denúncias (Canal Anônimo). Total: 12 perigos, 5 planos de ação.', created_by: 1 },
  ];
  pgrData.forEach(p => insert('pgrHistory', p));

  // Diagnostic sessions mock data
  const fixedScores = {
    'UTI': [75, 72, 78, 74, 76, 71],
    'Pronto-socorro': [68, 65, 70, 72, 66, 69],
    'Internação': [58, 55, 60, 62, 57, 63],
    'Centro Cirúrgico': [52, 50, 55, 48, 53, 51],
    'Administrativo': [33, 32, 35, 30, 38, 36],
  };
  const turnos = ['Diurno', 'Noturno', 'Plantonista'];
  const tempos = ['Menos de 1 ano', '1 a 3 anos', '3 a 5 anos', 'Mais de 5 anos'];

  Object.entries(fixedScores).forEach(([sector, scores]) => {
    scores.forEach((score, i) => {
      const nivel_risco = score <= 40 ? 'Baixo' : score <= 60 ? 'Médio' : score <= 80 ? 'Alto' : 'Crítico';
      const respostas = {};
      for (let q = 1; q <= 32; q++) respostas[`q${q}`] = Math.ceil(((score / 100) * 4) + 1);
      insert('sessions', { session_token: `tok_${sector}_${i}`, sector, turno: turnos[i % 3], tempo_funcao: tempos[i % 4], respostas: JSON.stringify(respostas), score, nivel_risco });
    });
  });

  console.log('✅ Banco de dados populado com sucesso!');
  migrate();
}

seed();
