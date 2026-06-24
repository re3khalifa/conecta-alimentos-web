require('dotenv').config();
 
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
 
const app = express();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,

  message: {
    message: 'Demasiados intentos de inicio de sesión. Intenta nuevamente en 15 minutos.'
  }
});
 
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;
 
if (!MONGO_URI) {
  console.error('Falta MONGO_URI en tu .env');
  process.exit(1);
}
 
// ── Seguridad ────────────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(cookieParser());
 
// ── Body parsers + archivos estáticos ───────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
 
// ── Vistas ───────────────────────────────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
 
// ── Usuario disponible en todos los templates EJS ───────────────────────────
// Lee la cookie, verifica el JWT y pone res.locals.user en cada vista.
// Si no hay token o es inválido, res.locals.user queda en null.
app.use((req, res, next) => {
  const token = req.cookies?.token;
  if (token) {
    try {
      res.locals.user = jwt.verify(token, process.env.JWT_SECRET);
    } catch (e) {
      res.locals.user = null;
    }
  } else {
    res.locals.user = null;
  }
  next();
});
 
// ── Rutas ────────────────────────────────────────────────────────────────────
app.use('/', require('./routes/web.routes'));
app.use('/api/ofertas', require('./routes/offer.routes'));
app.use('/api/auth/login', authLimiter);
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/commerce', require('./routes/commerce.routes'));
app.use("/api/reservas", require("./routes/reservation.routes"));
 
// ── 404 ──────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).render('errors/404', { title: '404' });
});
 
// ── Error handler global (debe ir al final) ──────────────────────────────────
app.use(require('./middlewares/error.middleware'));
 
// ── Conexión a MongoDB y arranque del servidor ───────────────────────────────
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB conectado');
    app.listen(PORT, () => {
      console.log(`Servidor en http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Error conectando a MongoDB:', err.message);
    process.exit(1);
  });
 
