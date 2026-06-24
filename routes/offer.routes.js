const router = require('express').Router();
const offerController = require('../controllers/offer.controller');
const requireAuth = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/role.middleware');

// Públicas
router.get('/',     offerController.getAll);

// ⚠️ /mine debe ir antes de /:id
router.get('/mine', requireAuth, requireRole('commerce', 'admin'), offerController.getMine);
router.get('/:id',  offerController.getById);

// Protegidas
router.post('/',      requireAuth, requireRole('commerce', 'admin'), offerController.create);
router.put('/:id',    requireAuth, requireRole('commerce', 'admin'), offerController.update);
router.delete('/:id', requireAuth, requireRole('commerce', 'admin'), offerController.remove);

module.exports = router;
