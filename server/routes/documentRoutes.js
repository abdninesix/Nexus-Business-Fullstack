import express from 'express';
import multer from 'multer';
import {
  uploadDocument,
  deleteDocument,
  shareDocument,
  signDocument,
  getSharedDocumentsForUser,
  getDashboardDocuments,
  requestSignature,
} from '../controllers/documentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// Document APIs
router.post('/', protect, upload.single('file'), uploadDocument);
router.get('/', protect, getDashboardDocuments);

// More specific routes first
router.patch('/:id/share', protect, shareDocument);
router.patch('/:id/request-signature', protect, requestSignature);
router.patch('/:id/sign', protect, signDocument);

// Generic route last
router.delete('/:id', protect, deleteDocument);
router.get('/user/:userId', protect, getSharedDocumentsForUser);

export default router;
