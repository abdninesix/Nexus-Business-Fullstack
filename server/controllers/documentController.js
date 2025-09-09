import Document from '../models/Document.js';
import imageKit from '../config/imagekit.js';
import Notification from '../models/Notification.js';
import { io, getUserSocketId } from '../server.js';

// Upload a new document
export const uploadDocument = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });

    const result = await imageKit.upload({
      file: req.file.buffer,
      fileName: req.file.originalname,
      folder: '/nexus/documents',
      useUniqueFileName: true,
    });

    const document = await Document.create({
      name: req.file.originalname,
      type: req.file.mimetype,
      size: req.file.size,
      url: result.url,
      fileId: result.fileId,
      uploadedBy: req.user._id,
    });

    res.status(201).json(document);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all documents for current user
export const getDashboardDocuments = async (req, res) => {
  try {
    const userId = req.user._id;

    // Use an $or query to find documents that match ANY of these conditions:
    // 1. I am the uploader.
    // 2. I am the designated signer.
    // 3. The document has been shared with me.
    const documents = await Document.find({
      $or: [
        { uploadedBy: userId },
        { signer: userId },
        { sharedWith: userId }
      ]
    })
      .populate('signer', 'name _id') // Populate signer info
      .populate('uploadedBy', 'name') // Populate uploader info
      .sort({ createdAt: -1 });

    res.status(200).json(documents);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch dashboard documents' });
  }
};

// Delete a document
export const deleteDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) return res.status(404).json({ message: 'Document not found.' });

    // Only uploader can delete
    if (document.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized.' });
    }

    await imageKit.deleteFile(document.fileId);
    await imageKit.purgeCache(document.url);

    await Document.deleteOne({ _id: req.params.id });

    res.json({ message: 'Document deleted.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Share a document with another user
export const shareDocument = async (req, res) => {
  try {
    const { shareWithUserId } = req.body;
    const document = await Document.findById(req.params.id);
    if (!document || document.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: "Document not found or not authorized." });
    }

    // Add user to the sharedWith array if not already present
    if (!document.sharedWith.includes(shareWithUserId)) {
      document.sharedWith.push(shareWithUserId);
      if (document.status === 'Private') document.status = 'Shared';
      await document.save();
    }
    res.status(200).json(document);
  } catch (error) { res.status(500).json({ message: 'Failed to share document.' }); }
};

// Request a signature (Investor action)
export const requestSignature = async (req, res) => {
  try {
    const { signerId } = req.body; // The entrepreneur's ID
    const document = await Document.findById(req.params.id);
    if (!document || document.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: "Document not found or not authorized." });
    }

    document.signer = signerId;
    document.status = 'Awaiting Signature';
    await document.save();

    // --- NOTIFY THE SIGNER ---
    const notificationMessage = `${req.user.name} has requested your signature on: "${document.name}".`;

    await Notification.create({
      recipient: signerId,
      sender: req.user._id,
      type: 'newSignatureRequest',
      message: notificationMessage,
      link: `/documents` // Links to their documents page
    });

    const signerSocketId = getUserSocketId(signerId);
    if (signerSocketId) {
      io.to(signerSocketId).emit("getNotification", {
        senderName: req.user.name,
        type: 'newSignatureRequest',
        message: notificationMessage,
        createdAt: new Date(),
        relatedData: { documentId: document._id }
      });
    }
    // --- END NOTIFICATION ---

    res.status(200).json(document);
  } catch (error) { res.status(500).json({ message: "Failed to request signature." }); }
};

// Sign a document (Entrepreneur action)
export const signDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document || document.signer.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: "You are not the designated signer for this document." });
    }
    if (document.status !== 'Awaiting Signature') {
      return res.status(400).json({ message: "Document is not awaiting a signature." });
    }

    document.status = 'Signed';
    document.signedUrl = document.url; // Mock: re-use the same URL
    document.signedAt = new Date();
    await document.save();

    // --- NOTIFY THE DOCUMENT OWNER ---
    const ownerId = document.uploadedBy;
    const notificationMessage = `${req.user.name} has signed the document: "${document.name}".`;

    await Notification.create({
      recipient: ownerId,
      sender: req.user._id,
      type: 'documentSigned',
      message: notificationMessage,
      link: `/documents`
    });

    const ownerSocketId = getUserSocketId(ownerId.toString());
    if (ownerSocketId) {
      io.to(ownerSocketId).emit("getNotification", {
        senderName: req.user.name,
        type: 'documentSigned',
        message: notificationMessage,
        createdAt: new Date(),
        relatedData: { documentId: document._id }
      });
    }
    // --- END NOTIFICATION ---

    res.status(200).json(document);
  } catch (error) { res.status(500).json({ message: "Failed to sign document." }); }
};

// Get documents FOR another user's profile (e.g., Investor viewing Entrepreneur profile)
export const getSharedDocumentsForUser = async (req, res) => {
  try {
    const ownerId = req.params.userId;
    const requesterId = req.user._id;

    // Find documents that are owned by the user AND shared with the requester
    const documents = await Document.find({
      uploadedBy: ownerId,
      sharedWith: requesterId
    });
    res.status(200).json(documents);
  } catch (error) { res.status(500).json({ message: 'Failed to fetch shared documents' }); }
};