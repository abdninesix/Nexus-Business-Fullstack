// controllers/dealController.js
import Deal from '../models/Deal.js';
import Transaction from '../models/Transaction.js';

// Get all deals for the logged-in investor
export const getDeals = async (req, res) => {
  try {
    const deals = await Deal.find({ investorId: req.user._id })
        .populate('entrepreneurId', 'name avatarUrl') // Populate with entrepreneur info
        .sort({ updatedAt: -1 });
    res.status(200).json(deals);
  } catch (error) { res.status(500).json({ message: 'Failed to fetch deals' }); }
};

// Create a new deal
export const createDeal = async (req, res) => {
  try {
    const newDeal = await Deal.create({ ...req.body, investorId: req.user._id });
    res.status(201).json(newDeal);
  } catch (error) { res.status(500).json({ message: 'Failed to create deal' }); }
};

// Add a payment transaction to a deal
export const addPayment = async (req, res) => {
    try {
        const { dealId, amount, notes } = req.body;
        const deal = await Deal.findById(dealId);
        if (!deal || deal.investorId.toString() !== req.user._id.toString()) {
            return res.status(404).json({ message: "Deal not found or not authorized."});
        }
        const transaction = await Transaction.create({ dealId, investorId: req.user._id, amount, notes });
        res.status(201).json(transaction);
    } catch (error) { res.status(500).json({ message: "Failed to add payment." }); }
};