import crypto from 'crypto';
import User from '../models/User.js';
import sendEmail from '../utils/sendEmail.js';
import generateToken from '../utils/generateToken.js';

// Register User
export const register = async (req, res) => {
  // The registration form only has name, email, password, and role
  const { name, email, password, role } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create a new user with the basic information
    const newUser = new User({
      name,
      email,
      password,
      role,
    });

    await newUser.save();

    const userData = {
      _id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      isOnline: newUser.isOnline,
      avatarUrl: newUser.avatarUrl,
      bio: newUser.bio,
      profile: newUser.role === 'entrepreneur'
        ? newUser.entrepreneurProfile
        : newUser.investorProfile,
    };

    const token = generateToken(newUser);

    res.status(201).json({ user: userData, token: token, });

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Login User
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid password' });
    }

    if (user.isTwoFactorEnabled) {
      // --- 2FA ENABLED PATH ---
      const twoFactorCode = crypto.randomInt(100000, 999999).toString();
      user.twoFactorCode = twoFactorCode;
      user.twoFactorCodeExpires = Date.now() + 5 * 60 * 1000; // 10 minutes

      user.isOnline = true;
      await user.save();

      try {
        await sendEmail({
          to: user.email,
          subject: 'Your Nexus Login Verification Code',
          text: `Your two-factor authentication code is: ${twoFactorCode}\nThis code will expire in 10 minutes.`,
        });

        // Send the signal to the frontend to show the 2FA input
        return res.status(200).json({
          twoFactorRequired: true,
          userId: user._id
        });
      } catch (emailError) {
        console.error("Failed to send 2FA email:", emailError);
        return res.status(500).json({ message: "Failed to send verification code. Please try again." });
      }

    } else {

      // Set user to online
      user.isOnline = true;
      await user.save();

      // Prepare the response payload
      const userData = {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isOnline: user.isOnline,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        profile: user.role === 'entrepreneur'
          ? user.entrepreneurProfile
          : user.investorProfile,
      };

      // --- Build token separately ---
      const token = generateToken(user);

      res.json({ user: userData, token: token, });
    }
  } catch (error) {
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
};

// Verify the 2FA code during login
export const verifyLoginToken = async (req, res) => {
  try {
    const { token, userId } = req.body;
    const user = await User.findById(userId);

    if (!user || !user.twoFactorCode || !user.twoFactorCodeExpires) {
      return res.status(400).json({ message: "Invalid request. No 2FA code pending." });
    }

    if (user.twoFactorCodeExpires < Date.now()) {
      return res.status(400).json({ message: "Your verification code has expired. Please log in again." });
    }

    if (user.twoFactorCode !== token) {
      return res.status(400).json({ message: "Invalid verification code." });
    }

    // If the code is correct, clear the 2FA fields
    user.twoFactorCode = undefined;
    user.twoFactorCodeExpires = undefined;
    await user.save();

    // And now, log them in by generating the final token
    const finalToken = generateToken(user);
    res.status(200).json({ token: finalToken, user });

  } catch (error) { res.status(500).json({ message: "Login verification failed." }); }
};

// Get Logged In User Profile
export const getProfile = (req, res) => {
  // req.user is populated by your authentication middleware
  res.status(200).json(req.user);
};

// Update user profile (bio, name, and role-specific fields)
export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) { return res.status(404).json({ message: 'User not found' }); }

    // Destructure common fields and role-specific fields from the request body
    const { name, bio, email, location, avatarUrl, ...profileFields } = req.body;

    // Update common fields
    if (name) user.name = name;
    if (bio) user.bio = bio;
    if (email) user.email = email;
    if (location) user.location = location;
    if (avatarUrl) user.avatarUrl = avatarUrl;

    // Update role-specific fields within the nested profile object
    if (user.role === 'entrepreneur') {
      Object.assign(user.entrepreneurProfile, profileFields);
    } else if (user.role === 'investor') {
      Object.assign(user.investorProfile, profileFields);
    }

    const updatedUser = await user.save();

    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
};

// Forgot Password
export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const token = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    const clientUrl =
      process.env.NODE_ENV === "production"
        ? process.env.CLIENT_URL_PROD
        : process.env.CLIENT_URL_DEV;

    const resetURL = `${clientUrl}/reset-password/${token}`;
    await sendEmail({
      to: user.email,
      subject: 'Password Reset',
      text: `Click the link to reset your password: ${resetURL}`,
    });

    res.status(200).json({ message: 'Password reset email sent' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Reset Password
export const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;
  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();
    res.status(200).json({ message: 'Password reset successful.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Change password (logged-in user)
export const changePassword = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const { currentPassword, newPassword } = req.body;

    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect' });

    user.password = newPassword;
    await user.save();

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to change password', error: error.message });
  }
};

// TwoFactor Toggle
export const toggleTwoFactor = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.isTwoFactorEnabled = !user.isTwoFactorEnabled; // Just flip the boolean
    await user.save();
    res.status(200).json({
      message: `2FA has been ${user.isTwoFactorEnabled ? 'enabled' : 'disabled'}.`,
      isEnabled: user.isTwoFactorEnabled
    });
  } catch (error) { res.status(500).json({ message: "Failed to update 2FA status." }); }
};

// Logout User controller
export const logout = async (req, res) => {
  try {
    // req.user is added by your 'protect' middleware
    if (req.user) {
      await User.findByIdAndUpdate(req.user._id, { isOnline: false });
    }
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Logout failed', error: error.message });
  }
};