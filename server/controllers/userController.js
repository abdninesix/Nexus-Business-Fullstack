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

export const getInvestors = async (req, res) => {
  try {
    // Find all users with the role 'investor'
    const investors = await User.find({ role: 'investor' }).select(
      'name email role avatarUrl isOnline bio investorProfile'
    );
    res.status(200).json(investors);
  } catch (error) {
    console.error('Error fetching investors:', error);
    res.status(500).json({ message: 'Server error while fetching investors' });
  }
};

export const getUserById = async (req, res) => {
  try {
    // Find user by the ID in the URL, and exclude their password from the response
    const user = await User.findById(req.params.id).select('-password');
    
    if (user) {
      res.status(200).json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    res.status(500).json({ message: 'Server error' });
  }
};