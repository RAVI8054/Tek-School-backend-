import { DemoRequest } from './enquiry.model.js';

export const createDemoRequest = async (data) => {
  const requestData = { ...data };

  if (data.slot) {
    const parsedSlot = { raw: data.slot };

    if (data.slot.startsWith('Callback')) {
      parsedSlot.type = 'callback';
      const parts = data.slot.split('·');
      parsedSlot.timePreference =
        parts.length > 1 ? parts[1].trim() : data.slot;
    } else {
      parsedSlot.type = 'scheduled';
      const parts = data.slot.split('·');
      if (parts.length > 1) {
        parsedSlot.dateString = parts[0].trim();
        parsedSlot.timePreference = parts[1].trim();
      } else {
        parsedSlot.dateString = data.slot;
      }
    }

    requestData.slot = parsedSlot;
  } else {
    delete requestData.slot;
  }

  const newRequest = await DemoRequest.create(requestData);
  return newRequest;
};

export const getAllEnquiries = async (query) => {
  const { page = 1, limit = 10, status, inquiry_type, search } = query;

  const filter = {};
  if (status) filter.status = status;
  if (inquiry_type) filter.inquiry_type = inquiry_type;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [enquiries, total] = await Promise.all([
    DemoRequest.find(filter)
      .populate('assigned_to', 'name email')
      .sort('-createdAt')
      .skip(skip)
      .limit(Number(limit)),
    DemoRequest.countDocuments(filter),
  ]);

  return {
    enquiries,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
  };
};

export const getEnquiryById = async (id) => {
  return await DemoRequest.findById(id).populate(
    'assigned_to admin_notes.addedBy',
    'name email'
  );
};

export const updateEnquiry = async (id, updateData) => {
  return await DemoRequest.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  }).populate('assigned_to admin_notes.addedBy', 'name email');
};

export const addAdminNote = async (id, note, addedBy) => {
  return await DemoRequest.findByIdAndUpdate(
    id,
    {
      $push: { admin_notes: { note, addedBy } },
    },
    { new: true, runValidators: true }
  ).populate('assigned_to admin_notes.addedBy', 'name email');
};

export const deleteEnquiry = async (id) => {
  return await DemoRequest.findByIdAndDelete(id);
};
