import express from 'express';
import multer from 'multer';
import {
  uploadDocument,
  getDocuments,
  deleteDocument,
  addSignature,
  getUserDocuments,
} from '../controllers/documentController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// Document APIs
router.post('/', protect, upload.single('file'), uploadDocument);
router.get('/', protect, getDocuments);
router.delete('/:id', protect, deleteDocument);
router.patch('/:id/sign', protect, addSignature);
router.get('/user/:userId', protect, getUserDocuments);

export default router;
