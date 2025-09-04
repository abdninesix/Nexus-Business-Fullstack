import Collaboration from '../models/Collaboration.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { getUserSocketId, io } from '../server.js';

// Create a new request (Investor action)
export const createRequest = async (req, res) => {
  try {
    const { entrepreneurId, message } = req.body;
    const investorId = req.user._id;

    // Check if a request already exists
    const existingRequest = await Collaboration.findOne({ investorId, entrepreneurId });

    let collaboration;
    let isNewRequest = false;

    if (existingRequest) {
      // If it was accepted or is still pending, they cannot send another one.
      if (existingRequest.status === 'accepted' || existingRequest.status === 'pending') {
        return res.status(409).json({ message: `A request has already been sent and is currently ${existingRequest.status}.` });
      }
      // If it was 'rejected', we can revive it.
      else if (existingRequest.status === 'rejected') {
        existingRequest.status = 'pending';
        existingRequest.message = message; // Update with the new message
        collaboration = await existingRequest.save();
      }
    } else {
      // 3. If no request ever existed, create a brand new one.
      collaboration = await Collaboration.create({ investorId, entrepreneurId, message, status: 'pending' });
      isNewRequest = true;
    }

    // --- NOTIFY THE ENTREPRENEUR of the new request ---
    const notificationMessage = `${req.user.name} wants to connect with you.`;
    await Notification.create({
      recipient: entrepreneurId,
      sender: investorId,
      type: 'newConnectionRequest',
      message: notificationMessage,
      link: `/profile/investor/${investorId}`
    });
    const entrepreneurSocketId = getUserSocketId(entrepreneurId);
    if (entrepreneurSocketId) {
      io.to(entrepreneurSocketId).emit("getNotification", {
        senderName: req.user.name,
        type: 'newConnectionRequest',
        message: notificationMessage,
        createdAt: new Date(),
        relatedData: { investorId: investorId }
      });
    }

    res.status(isNewRequest ? 201 : 200).json(collaboration);
  } catch (error) { res.status(500).json({ message: 'Failed to create request' }); }
};

// Get requests FOR the logged-in user (Entrepreneur view)
export const getReceivedRequests = async (req, res) => {
  try {
    const requests = await Collaboration.find({ entrepreneurId: req.user._id })
      .populate('investorId', 'name avatarUrl isOnline investorProfile');
    res.status(200).json(requests);
  } catch (error) { res.status(500).json({ message: 'Failed to fetch requests' }); }
};

// Get requests SENT BY the logged-in user (Investor view)
export const getSentRequests = async (req, res) => {
  try {
    // Find all requests where the investorId matches the current user
    const requests = await Collaboration.find({ investorId: req.user._id }).populate('entrepreneurId', 'name avatarUrl entrepreneurProfile');;
    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch sent requests' });
  }
};

// Update a request status (Entrepreneur action)
export const updateRequestStatus = async (req, res) => {
  try {
    const { status } = req.body; // 'accepted' or 'rejected'
    const request = await Collaboration.findById(req.params.id);
    const entrepreneurId = req.user._id;

    if (!request || request.entrepreneurId.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Request not found or not authorized.' });
    }

    request.status = status;
    await request.save();

    const entrepreneur = await User.findById(entrepreneurId);
    if (!entrepreneur) {
      return res.status(200).json(request);
    }

    // --- NOTIFY THE INVESTOR of the response ---
    const notificationType = status === 'accepted' ? 'connectionRequestAccepted' : 'connectionRequestRejected';
    const notificationMessage = `${req.user.name} has ${status} your connection request.`;

    await Notification.create({
      recipient: request.investorId,
      sender: req.user._id,
      type: notificationType,
      message: notificationMessage,
      link: `/profile/entrepreneur/${req.user._id}`
    });

    const investorSocketId = getUserSocketId(request.investorId.toString());
    if (investorSocketId) {
      io.to(investorSocketId).emit("getNotification", {
        senderName: req.user.name,
        type: notificationType,
        message: notificationMessage,
        createdAt: new Date(),
        relatedData: { entrepreneurId: entrepreneurId.toString() }
      });
    }

    res.status(200).json(request);
  } catch (error) { res.status(500).json({ message: 'Failed to update request' }); }
};

export const getRequestStatus = async (req, res) => {
  try {
    const { entrepreneurId } = req.params;
    const investorId = req.user._id;
    const request = await Collaboration.findOne({ investorId, entrepreneurId });

    if (request) {
      // If a request exists, return its status and id
      res.status(200).json({ status: request.status, requestId: request._id });
    } else {
      // If no request exists, return a clear 'none' status
      res.status(200).json({ status: 'none' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch request status' });
  }
};

// function to delete a collaboration request
export const deleteRequest = async (req, res) => {
  try {
    const { id } = req.params; // The ID of the collaboration document
    const userId = req.user._id;

    const request = await Collaboration.findById(id);

    if (!request) {
      return res.status(404).json({ message: 'Request not found.' });
    }

    // Security Check: Ensure the person deleting is part of the collaboration
    const isInvestor = request.investorId.toString() === userId.toString();
    const isEntrepreneur = request.entrepreneurId.toString() === userId.toString();

    if (!isInvestor && !isEntrepreneur) {
      return res.status(403).json({ message: 'You are not authorized to delete this request.' });
    }

    await request.deleteOne(); // Use deleteOne() on the instance

    res.status(200).json({ message: 'Collaboration removed successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete request' });
  }
};