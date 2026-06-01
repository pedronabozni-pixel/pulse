const router = require('express').Router();
const db = require('../database');
const auth = require('../middleware/auth');

router.post('/submit', (req, res) => {
  const { tipo, setor, descricao, frequencia } = req.body;
  if (!tipo || !setor || !descricao) return res.status(400).json({ error: 'Campos obrigatórios: tipo, setor e descrição' });

  const protocolo = `PULSO-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
  const d = db.insert('denuncias', { protocolo, tipo, setor, descricao, frequencia: frequencia || null, status: 'Recebido' });

  // Auto-create risk in PGR inventory (NR-1 §1.4.1.1)
  db.insert('risks', {
    perigo: `Risco identificado por denúncia: ${tipo}`,
    grupo_exposto: 'A identificar (denúncia anônima)',
    area: setor, nivel: 'Médio', probabilidade: 2, severidade: 3, nivel_risco_calculado: 'Médio',
    medidas_implementadas: 'Aguardando apuração da denúncia',
    nr_referencia: 'NR-1 §1.4.1.1', fonte: 'Denúncia', status: 'Ativo',
  });

  res.status(201).json({
    protocolo,
    message: 'Denúncia registrada anonimamente. Guarde seu número de protocolo para acompanhamento.',
    next: 'A denúncia será apurada conforme Lei 14.457/2022 e NR-1 §1.4.1.1',
  });
});

router.get('/consultar/:protocolo', (req, res) => {
  const d = db.findOne('denuncias', { protocolo: req.params.protocolo });
  if (!d) return res.status(404).json({ error: 'Protocolo não encontrado' });
  const updates = db.findAll('denunciaUpdates', { denuncia_id: d.id })
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  const { descricao: _, ...safeD } = d; // don't expose full description anonymously
  res.json({ ...safeD, descricao: '(conteúdo protegido)', updates });
});

router.get('/list', auth, (req, res) => {
  const denuncias = db.findAll('denuncias').sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const withUpdates = denuncias.map(d => {
    const updates = db.findAll('denunciaUpdates', { denuncia_id: d.id })
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    return { ...d, updates };
  });
  res.json(withUpdates);
});

router.put('/:id/status', auth, (req, res) => {
  const { status, observacao } = req.body;
  const validStatus = ['Recebido', 'Em apuração', 'Medida adotada', 'Encerrado'];
  if (!validStatus.includes(status)) return res.status(400).json({ error: 'Status inválido' });
  db.update('denuncias', { id: +req.params.id }, { status });
  db.insert('denunciaUpdates', { denuncia_id: +req.params.id, status, observacao: observacao || null });
  res.json({ success: true });
});

module.exports = router;
