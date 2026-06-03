const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'pulso_secret';

// Autentica o token JWT
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token não fornecido' });
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido ou expirado' });
  }
}

// role: 'rh' | 'juridico' | 'gestor' | 'colaborador' | 'cfo' | 'ti' | 'admin'
// Roles legados mapeados: 'admin'→rh, 'manager'→gestor, 'viewer'→colaborador
const LEGACY_MAP = { admin: 'rh', manager: 'gestor', viewer: 'colaborador' };

function resolveRole(role) {
  return LEGACY_MAP[role] || role;
}

// requireRole('rh', 'cfo') — pelo menos um dos roles
// requireRole('rh', { readOnly: ['juridico'] }) — juridico só GET
function requireRole(...args) {
  // Extrai opções se o último arg for objeto
  let roles = args;
  let readOnlyRoles = [];
  if (args.length > 0 && typeof args[args.length - 1] === 'object' && !Array.isArray(args[args.length - 1])) {
    const opts = args[args.length - 1];
    roles = args.slice(0, -1);
    readOnlyRoles = opts.readOnly || [];
  }

  return (req, res, next) => {
    const raw = req.user?.role;
    const role = resolveRole(raw);

    // admin (legado) e rh com email admin@ tem acesso total
    if (raw === 'admin') return next();

    const allAllowed = [...roles, ...readOnlyRoles];
    if (!allAllowed.includes(role)) {
      return res.status(403).json({
        error: 'Acesso não permitido para este perfil',
        role,
        required: allAllowed,
      });
    }

    // read-only: bloqueia métodos de escrita
    if (readOnlyRoles.includes(role) && !['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return res.status(403).json({ error: 'Seu perfil tem acesso somente leitura neste módulo' });
    }

    next();
  };
}

authMiddleware.requireRole = requireRole;
authMiddleware.resolveRole = resolveRole;

module.exports = authMiddleware;
