import imagekit from '../config/imagekit.js';
import User from '../models/User.js';

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
    // const fileExtension = path.extname(file.originalname);
    const safeFileName = `dp_${req.user._id}_${Date.now()}`;

    const response = await imagekit.upload({
      file: file.buffer,
      fileName: safeFileName,
      folder: '/nexus/dp',
      useUniqueFileName: false,
      overwrite: false,
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