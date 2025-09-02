import Collaboration from '../models/Collaboration.js';

// Create a new request (Investor action)
export const createRequest = async (req, res) => {
  try {
    const { entrepreneurId, message } = req.body;
    const investorId = req.user._id;

    // Check if a request already exists
    const existingRequest = await Collaboration.findOne({ investorId, entrepreneurId });
    if (existingRequest) {
      return res.status(409).json({ message: 'Request already sent.' });
    }

    const newRequest = await Collaboration.create({ investorId, entrepreneurId, message });
    // TODO: Emit a 'newRequest' notification to the entrepreneur
    res.status(201).json(newRequest);
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
    const requests = await Collaboration.find({ investorId: req.user._id });
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

    if (!request || request.entrepreneurId.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Request not found or not authorized.' });
    }

    request.status = status;
    await request.save();
    // TODO: Emit a 'requestUpdated' notification to the investor
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