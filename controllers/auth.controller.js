const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const COOKIE_NAME = 'token';

function signToken(user) {
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES_IN || '1d';

  if (!secret) {
    throw new Error('Falta JWT_SECRET en .env');
  }

  return jwt.sign(
    { sub: user._id.toString(), role: user.role, email: user.email },
    secret,
    { expiresIn }
  );
}

exports.register = async (req, res, next) => {
  try {
    const { email, password, role, privacyAccepted } = req.body;

    if (!privacyAccepted) {
      return res.status(400).json({
        message: 'Debes aceptar el aviso de privacidad'
      });
    }


    // Verificar si ya existe
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: 'El correo ya está registrado' });
    }

    // Hash seguro
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      passwordHash,
      role: ['user', 'commerce'].includes(role) ? role : 'user',
      privacyAccepted: true,
      privacyAcceptedAt: new Date()
    });

    // No devolver passwordHash
    return res.status(201).json({
      message: 'Usuario registrado',
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    return next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    // No revelar si el email existe o no (buena práctica)
    if (!user) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const token = signToken(user);

    // Cookie HttpOnly (seguridad básica)
    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      // secure: true, // actívalo cuando uses HTTPS real
      maxAge: 24 * 60 * 60 * 1000, // 1 día
    });

    return res.status(200).json({
      message: 'Login correcto',
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
      },
      
  
    });
  } catch (err) {
    return next(err);
  }
};

exports.logout = async (req, res) => {
  res.clearCookie(COOKIE_NAME);
  return res.status(200).json({ message: 'Sesión cerrada' });
};