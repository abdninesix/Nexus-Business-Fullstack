import mongoose from 'mongoose';

const fileSchema = new mongoose.Schema({
  name: String,
  type: String,
  size: Number,
  url: String,
  fileId: String, // ImageKit file ID
},{timestamps: true});

export default mongoose.model('File', fileSchema);