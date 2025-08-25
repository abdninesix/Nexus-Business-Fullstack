import express from 'express';
import multer from 'multer';
import { removeProfilePicture, uploadProfilePicture } from '../controllers/uploadController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Use memory storage (ImageKit needs buffer)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// Routes
router.post('/', protect, upload.single('file'), uploadProfilePicture);
router.delete('/', protect, removeProfilePicture);

export default router;