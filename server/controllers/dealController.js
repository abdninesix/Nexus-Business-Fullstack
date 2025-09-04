import Deal from '../models/Deal.js';
import Transaction from '../models/Transaction.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { io, getUserSocketId } from '../server.js';

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
    const { entrepreneurId } = req.body;
    const investorId = req.user._id;

    const investor = await User.findById(investorId);
    if (!investor) {
      return res.status(404).json({ message: "Investor profile not found." });
    }

    // Set the status to 'Proposed' when creating the deal
    const newDealData = { ...req.body, investorId: investorId, status: 'Proposed' };
    const newDeal = await Deal.create(newDealData);

    // --- NOTIFY THE ENTREPRENEUR about the new proposal ---
    const notificationMessage = `${investor.name} has sent you a new deal proposal for "${newDeal.startupName}".`;
    await Notification.create({
      recipient: entrepreneurId,
      sender: investorId,
      type: 'newDeal',
      message: notificationMessage,
      link: `/deals`
    });
    const entrepreneurSocketId = getUserSocketId(entrepreneurId);
    if (entrepreneurSocketId) {
      io.to(entrepreneurSocketId).emit("getNotification", {
        senderName: investor.name,
        type: 'newDeal',
        message: notificationMessage,
        createdAt: new Date(),
        relatedData: { investorId: investorId }
      });
    }

    res.status(201).json(newDeal);
  } catch (error) { res.status(500).json({ message: 'Failed to create deal' }); }
};

// Add a payment transaction to a deal
export const addPayment = async (req, res) => {
  try {
    const { dealId, amount, notes } = req.body;
    const investorId = req.user._id;

    const deal = await Deal.findById(dealId);
    if (!deal || deal.investorId.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: "Deal not found or not authorized." });
    }

    const transaction = await Transaction.create({ dealId, investorId: req.user._id, amount, notes });

    // --- NOTIFY THE ENTREPRENEUR about the new payment ---
    // We need the investor's name for the message
    const investor = await User.findById(investorId);

    // Format the amount for a clean notification message
    const formattedAmount = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

    const notificationMessage = `${investor.name} has sent a payment of ${formattedAmount} for your deal: "${deal.startupName}".`;

    await Notification.create({
      recipient: deal.entrepreneurId,
      sender: investorId,
      type: 'newTransaction', // <-- A NEW TYPE
      message: notificationMessage,
      link: `/deals` // Link to their deals page
    });

    const entrepreneurSocketId = getUserSocketId(deal.entrepreneurId.toString());
    if (entrepreneurSocketId) {
      io.to(entrepreneurSocketId).emit("getNotification", {
        senderName: investor.name,
        type: 'newTransaction',
        message: notificationMessage,
        createdAt: new Date(),
      });
    }
    // --- END NOTIFICATION ---

    res.status(201).json(transaction);
  } catch (error) { res.status(500).json({ message: "Failed to add payment." }); }
};

// Update a deal's status (ENTREPRENEUR action)
export const getDealsForEntrepreneur = async (req, res) => {
  try {
    const deals = await Deal.find({ entrepreneurId: req.user._id })
      .populate('investorId', 'name avatarUrl') // Populate with investor info
      .sort({ updatedAt: -1 });
    res.status(200).json(deals);
  } catch (error) { res.status(500).json({ message: 'Failed to fetch deals' }); }
};

// Update a deal's status (ENTREPRENEUR action)
export const updateDealStatus = async (req, res) => {
  try {
    const { status } = req.body; // 'accepted' or 'rejected'
    const dealId = req.params.id;
    const entrepreneurId = req.user._id;

    const deal = await Deal.findById(dealId);

    if (!deal) {
      return res.status(404).json({ message: 'Deal not found.' });
    }

    if (deal.entrepreneurId.toString() !== entrepreneurId.toString()) {
      return res.status(403).json({ message: 'Not authorized.' });
    }

    if (deal.status !== 'Proposed') {
      return res.status(400).json({ message: 'This deal proposal has already been actioned.' });
    }

    const entrepreneur = await User.findById(entrepreneurId);
    if (!entrepreneur) {
      return res.status(404).json({ message: "Your user profile was not found." });
    }

    deal.status = status === 'accepted' ? 'Negotiation' : 'Rejected';
    await deal.save();

    const actionText = status === 'accepted' ? 'accepted' : 'rejected';
    const notificationMessage = `${entrepreneur.name} has ${actionText} your deal proposal for "${deal.startupName}".`;

    await Notification.create({
      recipient: deal.investorId,
      sender: entrepreneurId, // Use the ID
      type: 'dealStatusUpdate',
      message: notificationMessage,
      link: `/deals`
    });

    const investorSocketId = getUserSocketId(deal.investorId.toString());
    if (investorSocketId) {
      io.to(investorSocketId).emit("getNotification", {
        senderName: req.user.name,
        type: 'dealStatusUpdate',
        message: notificationMessage,
        createdAt: new Date(),
        relatedData: { entrepreneurId: entrepreneurId }
      });
    }

    res.status(200).json(deal);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update deal status' });
  }
};

// Update a deal's status (INVESTOR action)
export const updateDealByInvestor = async (req, res) => {
  try {
    const { status, amount, equity, stage } = req.body; // Allow editing fields too
    const deal = await Deal.findById(req.params.id);

    if (!deal || deal.investorId.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Deal not found or not authorized.' });
    }

    const investor = await User.findById(req.user._id);
    if (!investor) {
      return res.status(404).json({ message: "Your user profile was not found." });
    }

    // Apply updates
    if (status) deal.status = status;
    if (amount) deal.amount = amount;
    if (equity) deal.equity = equity;
    if (stage) deal.stage = stage;

    const updatedDeal = await deal.save();

    // --- NOTIFY THE ENTREPRENEUR about the update ---
    const notificationMessage = `${investor.name} has updated the deal for "${deal.startupName}". The new status is: ${deal.status}.`;
    await Notification.create({
      recipient: deal.entrepreneurId,
      sender: investor._id,
      type: 'dealStatusUpdate',
      message: notificationMessage,
      link: `/deals`
    });
    const entrepreneurSocketId = getUserSocketId(deal.entrepreneurId.toString());
    if (entrepreneurSocketId) {
      io.to(entrepreneurSocketId).emit("getNotification", {
        senderName: investor.name,
        type: 'dealStatusUpdate',
        message: notificationMessage,
        createdAt: new Date(),
        relatedData: { investorId: investor._id }
      });
    }
    // --- END NOTIFICATION ---

    res.status(200).json(updatedDeal);
  } catch (error) { res.status(500).json({ message: 'Failed to update deal' }); }
};

// Get all transactions for a logged-in entrepreneur
export const getTransactionsForEntrepreneur = async (req, res) => {
  try {
    const entrepreneurId = req.user._id;

    // 1. Find all deals where the user is the entrepreneur
    const deals = await Deal.find({ entrepreneurId: entrepreneurId }).select('_id');

    // 2. Extract just the IDs of those deals
    const dealIds = deals.map(deal => deal._id);

    // 3. Find all transactions where the dealId is in our list of deal IDs
    const transactions = await Transaction.find({ dealId: { $in: dealIds } });

    res.status(200).json(transactions);
  } catch (error) {
    console.error("Error fetching transactions for entrepreneur:", error);
    res.status(500).json({ message: 'Failed to fetch transactions' });
  }
};

// Get all transactions SENT BY a logged-in investor
export const getTransactionsForInvestor = async (req, res) => {
  try {
    const investorId = req.user._id;

    // Find all transactions where the investorId matches the current user
    const transactions = await Transaction.find({ investorId: investorId });

    res.status(200).json(transactions);
  } catch (error) {
    console.error("Error fetching transactions for investor:", error);
    res.status(500).json({ message: 'Failed to fetch transactions' });
  }
};

// Get all transactions for a specific deal
export const getTransactionsForDeal = async (req, res) => {
  try {
    const { dealId } = req.params;
    const requesterId = req.user._id;

    // Optional: Add a security check to ensure the requester is part of the deal
    const deal = await Deal.findById(dealId);
    if (!deal) {
      return res.status(404).json({ message: "Deal not found." });
    }

    const isInvestor = deal.investorId.toString() === requesterId.toString();
    const isEntrepreneur = deal.entrepreneurId.toString() === requesterId.toString();

    const transactions = await Transaction.find({ dealId: dealId }).sort({ date: -1 });
    res.status(200).json(transactions);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch transactions for this deal' });
  }
};