import Transaction from '../models/Transaction.js';

// Create a new transaction (deposit, withdraw, transfer)
export const createTransaction = async (req, res) => {
  try {
    const { type, amount, description } = req.body;
    if (!['deposit', 'withdraw', 'transfer'].includes(type)) {
      return res.status(400).json({ message: 'Invalid transaction type.' });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than 0.' });
    }

    const transaction = await Transaction.create({
      user: req.user._id,
      type,
      amount,
      status: 'pending', // default
      description,
    });

    // For mock, you can auto-complete transactions here if needed
    transaction.status = 'completed';
    await transaction.save();

    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all transactions for current user
export const getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
