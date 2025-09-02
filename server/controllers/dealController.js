import Deal from '../models/Deal.js';
import Transaction from '../models/Transaction.js';
import Notification from '../models/Notification.js';
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
    const newDeal = await Deal.create({ ...req.body, investorId: req.user._id });
    status: 'Proposed',
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

export const getDealsForEntrepreneur = async (req, res) => {
  try {
    const deals = await Deal.find({ entrepreneurId: req.user._id })
        .populate('investorId', 'name avatarUrl') // Populate with investor info
        .sort({ updatedAt: -1 });
    res.status(200).json(deals);
  } catch (error) { res.status(500).json({ message: 'Failed to fetch deals' }); }
};

export const updateDealStatus = async (req, res) => {
    try {
        const { status } = req.body; // 'accepted' or 'rejected'
        const deal = await Deal.findById(req.params.id);

        if (!deal || deal.entrepreneurId.toString() !== req.user._id.toString()) {
            return res.status(404).json({ message: 'Deal not found or not authorized.' });
        }
        
        // Prevent changing status if it's not in the initial proposal state
        if (deal.status !== 'Proposed') {
            return res.status(400).json({ message: 'Deal status can no longer be changed.' });
        }

        deal.status = status === 'accepted' ? 'Negotiation' : 'Rejected';
        await deal.save();

        // --- NOTIFY THE INVESTOR ---
        const notificationMessage = `Your deal proposal for "${deal.startupName}" has been ${status}.`;
        await Notification.create({
            recipient: deal.investorId,
            sender: req.user._id,
            type: 'dealStatusUpdate', // A new type
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
            });
        }
        // --- END NOTIFICATION ---

        res.status(200).json(deal);
    } catch (error) { res.status(500).json({ message: 'Failed to update deal status' }); }
};