const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');
const auth = require('../middleware/auth');

const SECRET = process.env.JWT_SECRET || 'pulso_secret';

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'E-mail e senha obrigatórios' });
  const user = db.findOne('users', { email });
  if (!user || !bcrypt.compareSync(password, user.password_hash))
    return res.status(401).json({ error: 'Credenciais inválidas' });
  const token = jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role, sector: user.sector },
    SECRET, { expiresIn: '12h' }
  );
  const { password_hash, ...safe } = user;
  res.json({ token, user: safe });
});

router.get('/me', auth, (req, res) => {
  const user = db.findOne('users', { id: req.user.id });
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
  const { password_hash, ...safe } = user;
  res.json(safe);
});

module.exports = router;
