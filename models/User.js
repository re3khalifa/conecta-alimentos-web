const mongoose = require('mongoose');

const ALLOWED_ROLES = ['user', 'commerce', 'admin'];

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: 120,
    },

    // Contraseña cifrada (hash)
    passwordHash: {
      type: String,
      required: true,
      minlength: 20, // hash bcrypt normalmente es largo
    },

    role: {
      type: String,
      enum: ALLOWED_ROLES,
      default: 'user',
    },

    privacyAccepted: {
    type: Boolean,
    default: false
    },

    privacyAcceptedAt: {
    type: Date
    },

    // Para control (opcional pero útil)
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // createdAt y updatedAt
    versionKey: false,
  }
);

// Índice único para email (por seguridad/consistencia)
userSchema.index({ email: 1 }, { unique: true });

module.exports = mongoose.model('User', userSchema);