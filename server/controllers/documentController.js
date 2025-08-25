import Document from '../models/Document.js';
import imageKit from '../config/imagekit.js';

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
export const getDocuments = async (req, res) => {
  try {
    const documents = await Document.find({ uploadedBy: req.user._id }).sort({ createdAt: -1 });
    res.json(documents);
  } catch (error) {
    res.status(500).json({ message: error.message });
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

// Add signature to a document
export const addSignature = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) return res.status(404).json({ message: 'Document not found.' });

    if (!req.file) return res.status(400).json({ message: 'No signature uploaded.' });

    const result = await imageKit.upload({
      file: req.file.buffer,
      fileName: req.file.originalname,
      folder: '/nexus/documents',
    });

    document.signatureUrl = result.url;
    document.status = 'signed';
    await document.save();

    res.json(document);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
