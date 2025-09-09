import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: String,
  size: Number,
  url: String, // URL of the original, unsigned document
  fileId: String, // ImageKit file ID
  
  // Who owns this document
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Who is allowed to see this document
  sharedWith: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  
  // The person who needs to sign the document
  signer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  status: { 
    type: String, 
    enum: ['Private', 'Shared', 'Awaiting Signature', 'Signed', 'Archived'], 
    default: 'Private' 
  },
  
  // The URL of the final, "signed" document (for our mock, it will be the same as the original)
  signedUrl: String,
  signedAt: Date,

}, { timestamps: true });

export default mongoose.model('Document', documentSchema);