const router = require('express').Router();
const db = require('../database');
const auth = require('../middleware/auth');

router.get('/', auth, (req, res) => {
  const trainings = db.findAll('trainings').sort((a, b) => (b.obrigatorio ? 1 : 0) - (a.obrigatorio ? 1 : 0) || a.id - b.id);
  res.json(trainings);
});

router.get('/progress', auth, (req, res) => {
  let userProgress = db.findAll('progress', { user_id: req.user.id });
  const trainings = db.findAll('trainings');

  // Create progress for missing trainings
  const existingIds = userProgress.map(p => p.training_id);
  const missing = trainings.filter(t => !existingIds.includes(t.id));
  missing.forEach(t => {
    db.insert('progress', { user_id: req.user.id, training_id: t.id, progress: 0, completed: false, certificate_date: null });
  });

  userProgress = db.findAll('progress', { user_id: req.user.id });
  const enriched = userProgress.map(p => {
    const t = trainings.find(t => t.id === p.training_id);
    return { ...p, ...t, id: p.id, training_id: p.training_id };
  }).sort((a, b) => (b.obrigatorio ? 1 : 0) - (a.obrigatorio ? 1 : 0) || a.training_id - b.training_id);

  res.json(enriched);
});

router.put('/:trainingId/progress', auth, (req, res) => {
  const { progress } = req.body;
  const trainingId = +req.params.trainingId;
  const pct = Math.min(+progress, 100);
  const completed = pct >= 100;
  const certificate_date = completed ? new Date().toISOString().split('T')[0] : null;

  const existing = db.findAll('progress').find(p => p.user_id === req.user.id && p.training_id === trainingId);
  if (existing) {
    db.update('progress', { id: existing.id }, { progress: pct, completed, certificate_date: certificate_date || existing.certificate_date });
  } else {
    db.insert('progress', { user_id: req.user.id, training_id: trainingId, progress: pct, completed, certificate_date });
  }
  res.json({ success: true, completed, certificate_date });
});

router.get('/stats', auth, (req, res) => {
  const trainings = db.findAll('trainings');
  const userProgress = db.findAll('progress', { user_id: req.user.id });
  const total = trainings.length;
  const required = trainings.filter(t => t.obrigatorio).length;
  const completed = userProgress.filter(p => p.completed).length;
  const completedRequired = userProgress.filter(p => {
    if (!p.completed) return false;
    const t = trainings.find(t => t.id === p.training_id);
    return t?.obrigatorio;
  }).length;
  res.json({ total, required, completed, completedRequired, compliance: Math.round((completedRequired / Math.max(required, 1)) * 100) });
});

module.exports = router;
