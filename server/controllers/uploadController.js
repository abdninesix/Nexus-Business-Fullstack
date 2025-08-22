import imagekit from '../config/imagekit.js';
import File from '../models/File.js';
import User from '../models/User.js';

export const uploadFile = async (req, res) => {
  try {
    const file = req.file;

    // Validate MIME type
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({ error: 'Invalid file type' });
    }

    // Upload to ImageKit
    const response = await imagekit.upload({
      file: file.buffer,
      fileName: file.originalname,
      folder: '/nexus',
      useUniqueFileName: true,
    });

    // Save metadata to MongoDB
    const savedFile = await File.create({
      name: file.originalname,
      type: file.mimetype,
      size: file.size,
      url: response.url,
      fileId: response.fileId,
    });

    res.status(200).json({ message: 'File uploaded', file: savedFile });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Something went wrong' });
  }
};

// Get all uploaded files
export const getFiles = async (req, res) => {
  try {
    const files = await File.find().sort({ createdAt: -1 });
    res.status(200).json({ files });
  } catch (err) {
    console.error('Fetch error:', err);
    res.status(500).json({ error: 'Could not fetch files' });
  }
};

// Delete a file by ID
export const deleteFile = async (req, res) => {
  try {
    const fileDoc = await File.findById(req.params.id);

    if (!fileDoc) {
      return res.status(404).json({ error: 'File not found' });
    }

    const fileId = fileDoc.fileId;
    const fileUrl = fileDoc.url;

    // Delete from ImageKit using fileId
    await imagekit.deleteFile(fileId);

    // Purge the file from CDN cache using its URL
    await imagekit.purgeCache(fileUrl);

    // Delete from MongoDB
    await File.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete file', details: error.message });
  }
};

export const uploadProfilePicture = async (req, res) => {
  try {
    // req.user is attached by your authentication middleware
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'No file was uploaded.' });
    }

    // Validate MIME type for profile pictures
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({ error: 'Invalid file type. Only images are allowed.' });
    }

    // 1. Upload to ImageKit
    const response = await imagekit.upload({
      file: file.buffer,
      fileName: `dp_${req.user._id}_${Date.now()}`,
      folder: '/nexus/dp',
      useUniqueFileName: false, // Set to false to overwrite existing profile picture
      overwrite: true,
    });

    // 2. Directly update the User model
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { avatarUrl: response.url, avatarFileId: response.fileId, }, // Set the avatarUrl to the new URL
      { new: true } // This option returns the modified document
    );

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // 3. Send the updated user object back to the frontend
    res.status(200).json(updatedUser);

  } catch (error) {
    console.error('Profile picture upload error:', error);
    res.status(500).json({ error: 'Something went wrong during the upload' });
  }
};

export const removeProfilePicture = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // 1. If a fileId exists, delete it from ImageKit
    if (user.avatarFileId) {
      await imagekit.deleteFile(user.avatarFileId);
      await imagekit.purgeCache(user.avatarUrl);
    }

    // 2. Update the user document in MongoDB
    user.avatarUrl = '';
    user.avatarFileId = '';
    const updatedUser = await user.save();

    // 3. Send back the updated user
    res.status(200).json(updatedUser);
  } catch (error) {
    console.error('Profile picture removal error:', error);
    res.status(500).json({ error: 'Something went wrong during removal' });
  }
};