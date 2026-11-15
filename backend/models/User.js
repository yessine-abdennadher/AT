import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Le nom est obligatoire"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "L'email est obligatoire"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: function () {
        return this.provider === "local";
      },
      minlength: 12,
      maxlength: 128,
      select: false,
    },
    googleId: {
      type: String,
      default: null,
    },
    provider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    bio: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },
    phone: {
      type: String,
      default: "",
    },
    city: {
      type: String,
      default: "صفاقس", // Sfax par défaut
      trim: true,
      maxlength: 100,
    },
    role: {
      type: String,
      enum: ["user", "partner", "admin"],
      default: "user",
    },
    establishmentName: {
      type: String,
      default: "",
      trim: true,
    },
    partnerTier: {
      type: String,
      enum: ["standard", "pro", "premium"],
      default: "standard",
    },
    requestedTier: {
      type: String,
      enum: ["standard", "pro", "premium"],
      default: "standard",
    },
    requestedBillingCycle: {
      type: String,
      enum: ["monthly", "yearly"],
      default: "monthly",
    },
    subscriptionStatus: {
      type: String,
      enum: ["none", "pending_payment", "active", "expired", "cancelled"],
      default: "none",
    },
    subscriptionStartedAt: {
      type: Date,
      default: null,
    },
    subscriptionExpiresAt: {
      type: Date,
      default: null,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    refreshTokens: {
      type: [String],
      default: [],
      select: false,
    },
    activeAccessSessionIds: {
      type: [String],
      default: [],
      select: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    lastActivityUpdate: {
      type: Date,
      default: null,
    },
    avatar: {
      type: String,
      default: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200",
    },
    favorites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Activity",
      },
    ],
    notificationsEnabled: {
      type: Boolean,
      default: true,
    },
    locationServicesEnabled: {
      type: Boolean,
      default: true,
    },
    language: {
      type: String,
      enum: ["ar", "fr", "en"],
      default: "ar",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

userSchema.index({ googleId: 1 }, { sparse: true });
userSchema.index({ role: 1 });

userSchema.virtual("userType").get(function () {
  if (this.role === "admin") return "administrator";
  if (this.role === "partner") return "partner_business";
  return "simple_user";
});

// Getter virtuel calculant les jours restants avant expiration
userSchema.virtual("daysRemaining").get(function () {
  if (!this.subscriptionExpiresAt) return 0;
  const now = new Date().getTime();
  const expires = new Date(this.subscriptionExpiresAt).getTime();
  const diff = expires - now;
  return diff > 0 ? Math.ceil(diff / (1000 * 60 * 60 * 24)) : 0;
});

// Getter virtuel alertant si expiration sous 3 jours
userSchema.virtual("isExpiringSoon").get(function () {
  const days = this.daysRemaining;
  return days > 0 && days <= 3;
});

userSchema.pre("save", async function (next) {
  if (!this.password || !this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.canManageActivities = function () {
  return this.role === "admin" || this.role === "partner";
};

export const User = mongoose.model("User", userSchema);
