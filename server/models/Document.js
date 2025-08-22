import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: String,
  size: Number,
  url: String,
  fileId: String, // ImageKit file ID
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  version: { type: Number, default: 1 },
  status: { type: String, enum: ['draft', 'signed', 'archived'], default: 'draft' },
  signatureUrl: String, // optional
}, { timestamps: true });

export default mongoose.model('Document', documentSchema);
