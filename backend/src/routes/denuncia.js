const router = require('express').Router();
const db = require('../database');
const auth = require('../middleware/auth');
const { requireRole } = auth;

// Qualquer pessoa pode enviar (anônimo)
router.post('/submit', (req, res) => {
  const { tipo, setor, descricao, frequencia } = req.body;
  if (!tipo || !setor || !descricao) return res.status(400).json({ error: 'Campos obrigatórios: tipo, setor e descrição' });

  const protocolo = `PULSO-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
  db.insert('denuncias', { protocolo, tipo, setor, descricao, frequencia: frequencia || null, status: 'Recebido' });

  db.insert('risks', {
    perigo: `Risco identificado por denúncia: ${tipo}`, grupo_exposto: 'A identificar (denúncia anônima)',
    area: setor, nivel: 'Médio', probabilidade: 2, severidade: 3, nivel_risco_calculado: 'Médio',
    medidas_implementadas: 'Aguardando apuração da denúncia', nr_referencia: 'NR-1 §1.4.1.1', fonte: 'Denúncia', status: 'Ativo',
  });

  res.status(201).json({
    protocolo,
    message: 'Denúncia registrada anonimamente. Guarde seu número de protocolo para acompanhamento.',
    next: 'A denúncia será apurada conforme Lei 14.457/2022 e NR-1 §1.4.1.1',
  });
});

// Consulta pública por protocolo (colaborador acompanha)
router.get('/consultar/:protocolo', (req, res) => {
  const d = db.findOne('denuncias', { protocolo: req.params.protocolo });
  if (!d) return res.status(404).json({ error: 'Protocolo não encontrado' });
  const updates = db.findAll('denunciaUpdates', { denuncia_id: d.id })
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  res.json({ protocolo: d.protocolo, tipo: d.tipo, setor: d.setor, status: d.status, created_at: d.created_at, updates });
});

// Lista: RH (gestão completa) e Jurídico (somente leitura)
router.get('/list', auth, requireRole('rh', { readOnly: ['juridico'] }), (req, res) => {
  const denuncias = db.findAll('denuncias').sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const withUpdates = denuncias.map(d => ({
    ...d,
    updates: db.findAll('denunciaUpdates', { denuncia_id: d.id }).sort((a, b) => new Date(a.created_at) - new Date(b.created_at)),
  }));
  res.json(withUpdates);
});

// Atualizar status: apenas RH
router.put('/:id/status', auth, requireRole('rh'), (req, res) => {
  const { status, observacao } = req.body;
  const valid = ['Recebido', 'Em apuração', 'Medida adotada', 'Encerrado'];
  if (!valid.includes(status)) return res.status(400).json({ error: 'Status inválido' });
  db.update('denuncias', { id: +req.params.id }, { status });
  db.insert('denunciaUpdates', { denuncia_id: +req.params.id, status, observacao: observacao || null });
  res.json({ success: true });
});

module.exports = router;
