import Inquiry from '../models/Inquiry.js';
import Accommodation from '../models/Accommodation.js';
import Notification from '../models/Notification.js';

const createInquiry = async (req, res) => {
    try {
        const {
            accommodationId,
            communicationMethod = 'inquiry_form',
            message,
            subject,
            preferredContactMethod,
        } = req.body;

        const accommodation = await Accommodation.findOne({
            _id: accommodationId,
            isDeleted: false,
        }).populate('owner', 'firstName lastName');

        if (!accommodation) {
            return res.status(404).json({ success: false, message: 'Accommodation not found' });
        }

        const inquiry = await Inquiry.create({
            student: req.user._id,
            owner: accommodation.owner?._id,
            accommodation: accommodation._id,
            communicationMethod,
            messages: [
                {
                    sender: req.user._id,
                    content: message,
                },
            ],
            inquiryForm: {
                subject,
                message,
                preferredContactMethod,
            },
            status: 'open',
        });

        await Accommodation.findByIdAndUpdate(accommodation._id, { $inc: { inquiryCount: 1 } });

        await Notification.create({
            recipient: accommodation.owner?._id,
            title: 'New inquiry received',
            message: `You received an inquiry for ${accommodation.title}.`,
            type: 'general',
            category: 'system',
            channel: 'in_app',
            relatedEntity: { entityType: 'accommodation', entityId: accommodation._id },
        });

        res.status(201).json({
            success: true,
            message: 'Inquiry created successfully',
            data: inquiry,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to create inquiry', error: error.message });
    }
};

const getInquiries = async (req, res) => {
    try {
        const filter = req.user.role === 'student' ? { student: req.user._id } : { owner: req.user._id };

        const inquiries = await Inquiry.find(filter)
            .populate('student', 'firstName lastName')
            .populate('owner', 'firstName lastName')
            .populate('accommodation', 'title location media.photos')
            .sort({ updatedAt: -1 });

        const data = inquiries.map((inquiry) => {
            const messageCount = inquiry.messages?.length || 0;
            const lastMessage = messageCount > 0 ? inquiry.messages[messageCount - 1] : null;
            return {
                ...inquiry.toObject(),
                lastMessagePreview: lastMessage
                    ? {
                          content: lastMessage.content,
                          sentAt: lastMessage.sentAt,
                          isRead: lastMessage.isRead,
                      }
                    : null,
            };
        });

        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch inquiries', error: error.message });
    }
};

const addInquiryMessage = async (req, res) => {
    try {
        const inquiry = await Inquiry.findById(req.params.inquiryId);
        if (!inquiry) return res.status(404).json({ success: false, message: 'Inquiry not found' });

        const userId = req.user._id.toString();
        const isParticipant =
            inquiry.student.toString() === userId || inquiry.owner.toString() === userId;

        if (!isParticipant) {
            return res.status(403).json({ success: false, message: 'Not authorized to message this inquiry' });
        }

        if (inquiry.status === 'closed') {
            return res.status(400).json({ success: false, message: 'Cannot send messages to a closed inquiry' });
        }

        inquiry.messages.push({
            sender: req.user._id,
            content: req.body.message,
        });

        inquiry.status = 'responded';
        await inquiry.save();

        const recipient = inquiry.student.toString() === userId ? inquiry.owner : inquiry.student;
        await Notification.create({
            recipient,
            title: 'New inquiry message',
            message: 'You have a new message in your inquiry conversation.',
            type: 'general',
            category: 'system',
            channel: 'in_app',
            relatedEntity: { entityType: 'accommodation', entityId: inquiry.accommodation },
        });

        res.status(201).json({ success: true, message: 'Message sent', data: inquiry });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to send message', error: error.message });
    }
};

const closeInquiry = async (req, res) => {
    try {
        const inquiry = await Inquiry.findById(req.params.inquiryId);
        if (!inquiry) return res.status(404).json({ success: false, message: 'Inquiry not found' });

        const userId = req.user._id.toString();
        const isParticipant =
            inquiry.student.toString() === userId || inquiry.owner.toString() === userId;

        if (!isParticipant) {
            return res.status(403).json({ success: false, message: 'Not authorized to close this inquiry' });
        }

        inquiry.status = 'closed';
        await inquiry.save();

        res.status(200).json({ success: true, message: 'Inquiry closed', data: inquiry });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to close inquiry', error: error.message });
    }
};

export { createInquiry, getInquiries, addInquiryMessage, closeInquiry };
