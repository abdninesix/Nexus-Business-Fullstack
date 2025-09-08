import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Schema for Entrepreneur-specific fields
const entrepreneurSchema = new mongoose.Schema({
  startupName: { type: String, default: '' },
  pitchSummary: { type: String, default: '' },
  fundingNeeded: { type: String, default: '' },
  industry: { type: String, default: '' },
  foundedYear: { type: Number, default: null },
  teamSize: { type: Number, default: 0 },
}, { _id: false });

// Schema for Investor-specific fields
const investorSchema = new mongoose.Schema({
  investmentInterests: [{ type: String }],
  investmentStage: [{ type: String }],
  portfolioCompanies: [{ type: String }],
  totalInvestments: { type: Number, default: 0 },
  minimumInvestment: { type: String, default: '' },
  maximumInvestment: { type: String, default: '' },
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['investor', 'entrepreneur'], required: true },
  avatarUrl: { type: String, default: '' },
  avatarFileId: { type: String, default: '' },
  bio: { type: String, default: '' },
  isOnline: { type: Boolean, default: true },
  location: { type: String, default: '' },
  isTwoFactorEnabled: { type: Boolean, default: false },
  twoFactorCode: { type: String },
  twoFactorCodeExpires: { type: Date },

  // Embed the role-specific schemas
  entrepreneurProfile: {
    type: entrepreneurSchema,
    default: () => ({}),
  },
  investorProfile: {
    type: investorSchema,
    default: () => ({}),
  },

  resetPasswordToken: String,
  resetPasswordExpires: Date,
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password method
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;