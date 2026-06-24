const mongoose = require('mongoose');
const Offer = require('../models/Offer');
const Reservation = require("../models/Reservation");

// ── GET /api/ofertas ─────────────────────────────────────────────────────────
exports.getAll = async (req, res, next) => {
  try {
    const query = {};

    if (req.query.search) {
      const re = new RegExp(req.query.search, 'i');
      query.$or = [{ title: re }];
    }
    if (req.query.category) {
      query.category = req.query.category;
    }
    if (req.query.minPrice || req.query.maxPrice) {
      query.price = {};
      if (req.query.minPrice !== '') query.price.$gte = Number(req.query.minPrice);
      if (req.query.maxPrice !== '') query.price.$lte = Number(req.query.maxPrice);
    }
    if (req.query.minQty) {
      const minQty = Number(req.query.minQty);
      if (!isNaN(minQty)) query.quantity = { $gte: minQty };
    }
    if (req.query.expiresBefore) {
      const d = new Date(req.query.expiresBefore);
      if (!isNaN(d.getTime())) query.expirationDate = { $lte: d };
    }

    const sortMap = {
      price_asc:  { price: 1 },
      price_desc: { price: -1 },
      exp_asc:    { expirationDate: 1 },
      exp_desc:   { expirationDate: -1 },
    };
    const sortObj = sortMap[req.query.sort] || { createdAt: -1 };

    const offers = await Offer.find(query).sort(sortObj);
    res.json(offers);
  } catch (err) {
    next(err);
  }
};

// ── GET /api/ofertas/mine ────────────────────────────────────────────────────
exports.getMine = async (req, res, next) => {
  try {
    const offers = await Offer.find({ commerce: req.user.sub })
      .sort({ createdAt: -1 })
      .lean(); // 🔥 importante para poder modificar objetos

    for (let o of offers) {
      const count = await Reservation.countDocuments({
        offer: o._id,
        status: "activa" // opcional pero recomendado
      });

      o.reservedCount = count;
      o.available = (o.quantity || 0) - count;
    }

    res.json(offers);

  } catch (err) {
    next(err);
  }
};

// ── GET /api/ofertas/:id ─────────────────────────────────────────────────────
exports.getById = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'ID inválido' });
    }
    const offer = await Offer.findById(req.params.id);
    if (!offer) return res.status(404).json({ message: 'Oferta no encontrada' });
    res.json(offer);
  } catch (err) {
    next(err);
  }
};

// ── POST /api/ofertas ────────────────────────────────────────────────────────
exports.create = async (req, res, next) => {
  try {
    const offer = new Offer({
      ...req.body,
      commerce: req.user.sub, // siempre del token, nunca del body
    });
    const saved = await offer.save();
    res.status(201).json(saved);
  } catch (err) {
    next(err);
  }
};

// ── PUT /api/ofertas/:id ─────────────────────────────────────────────────────
exports.update = async (req, res, next) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) return res.status(404).json({ message: 'Oferta no encontrada' });

    if (req.user.role !== 'admin' && offer.commerce.toString() !== req.user.sub) {
      return res.status(403).json({ message: 'No tienes permiso para editar esta oferta' });
    }

    const { title, description, category, price, quantity, expirationDate, address, location } = req.body;
    const updated = await Offer.findByIdAndUpdate(
    req.params.id,
    { title, description, category, price, quantity, expirationDate, address, location },
    { new: true, runValidators: true }
    );
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/ofertas/:id ──────────────────────────────────────────────────
exports.remove = async (req, res, next) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) return res.status(404).json({ message: 'Oferta no encontrada' });

    if (req.user.role !== 'admin' && offer.commerce.toString() !== req.user.sub) {
      return res.status(403).json({ message: 'No tienes permiso para eliminar esta oferta' });
    }

    await Offer.findByIdAndDelete(req.params.id);
    res.json({ message: 'Oferta eliminada' });
  } catch (err) {
    next(err);
  }
};
