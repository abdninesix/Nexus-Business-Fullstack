import mongoose from 'mongoose';

const dealSchema = new mongoose.Schema({
  investorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  entrepreneurId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  startupName: { type: String, required: true },
  amount: { type: String, required: true },
  equity: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['Due Diligence', 'Term Sheet', 'Negotiation', 'Closed', 'Passed'], 
    default: 'Negotiation' 
  },
  stage: { type: String }, // Pre-seed, Seed, Series A, etc.
}, { timestamps: true }); // `updatedAt` will serve as lastActivity

export default mongoose.model('Deal', dealSchema);