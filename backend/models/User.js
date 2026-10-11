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
      minlength: 6,
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
      enum: ["standard", "pro"],
      default: "standard",
    },
    refreshTokens: [
      {
        type: String,
      },
    ],
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
