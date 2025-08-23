import User from "../models/User.js";

export const getEntrepreneurs = async (req, res) => {
  try {
    // We find all users with the role 'entrepreneur' and select only the fields needed for the cards
    // This is more efficient than sending the entire user object
    const entrepreneurs = await User.find({ role: 'entrepreneur' }).select(
      'name email role avatarUrl bio isOnline entrepreneurProfile'
    );
    res.status(200).json(entrepreneurs);
  } catch (error) {
    console.error('Error fetching entrepreneurs:', error);
    res.status(500).json({ message: 'Server error while fetching entrepreneurs' });
  }
};