import ListingReport from '../models/ListingReport.js';
import Accommodation from '../models/Accommodation.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';

const allowedReasons = [
  'fake_listing',
  'unsafe_conditions',
  'misleading_info',
  'inappropriate_content',
  'discrimination',
  'scam',
  'other',
];

export const submitListingReport = async (req, res) => {
  try {
    const { accommodationId, reason, description, evidence = [] } = req.body;

    if (!accommodationId || !reason) {
      return res.status(400).json({ success: false, message: 'accommodationId and reason are required' });
    }

    if (!allowedReasons.includes(reason)) {
      return res.status(400).json({ success: false, message: 'Invalid report reason' });
    }

    const accommodation = await Accommodation.findOne({ _id: accommodationId, isDeleted: false }).select('_id title');
    if (!accommodation) {
      return res.status(404).json({ success: false, message: 'Accommodation not found' });
    }

    const report = await ListingReport.create({
      reportedBy: req.user._id,
      accommodation: accommodation._id,
      reason,
      description,
      evidence: Array.isArray(evidence) ? evidence : [],
      status: 'pending',
    });

    const admins = await User.find({ role: 'admin', accountStatus: 'active' }).select('_id');
    if (admins.length) {
      await Notification.insertMany(
        admins.map((admin) => ({
          recipient: admin._id,
          title: 'New listing report submitted',
          message: `${accommodation.title} was reported for ${reason.replace('_', ' ')}`,
          type: 'listing_reported',
          category: 'accommodation',
          channel: 'in_app',
          relatedEntity: { entityType: 'accommodation', entityId: accommodation._id },
          isDelivered: true,
          deliveredAt: new Date(),
        }))
      );
    }

    await AuditLog.create({
      performedBy: req.user._id,
      action: 'report_submit',
      entityType: 'report',
      entityId: report._id,
      description: 'Student submitted listing report',
      metadata: { reason, accommodationId },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json({
      success: true,
      message: 'Listing report submitted successfully',
      data: report,
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ success: false, message: 'You already reported this listing' });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to submit listing report',
      error: error.message,
    });
  }
};