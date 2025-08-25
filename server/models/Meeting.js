import mongoose from 'mongoose';

const meetingSchema = new mongoose.Schema({
  title: { type: String, required: true },
  start: { type: Date, required: true },
  end: { type: Date, required: true },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['confirmed', 'cancelled'], default: 'confirmed' },
  location: { type: String }, // Can be a physical address or a video call link
}, { timestamps: true });

export default mongoose.model('Meeting', meetingSchema);