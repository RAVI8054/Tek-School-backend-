import { DemoRequest } from './enquiry.model.js';

export const createDemoRequest = async (data) => {
  const requestData = { ...data };

  const newRequest = await DemoRequest.create(requestData);
  return newRequest;
};

export const getAllEnquiries = async (query) => {
  const {
    page = 1,
    limit = 10,
    status,
    inquiry_type,
    category,
    search,
  } = query;

  const filter = {};
  if (status) filter.status = status;

  if (inquiry_type) {
    filter.inquiry_type = inquiry_type;
  } else if (category === 'tekschool') {
    filter.inquiry_type = { $in: ['school', 'college', 'ai lab'] };
  } else if (category === 'admission') {
    filter.inquiry_type = {
      $in: ['book demo', 'talk to counselor', 'enroll', 'workshop'],
    };
  }

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

export const getEnquiryById = async (id, userId = null) => {
  const enquiry = await DemoRequest.findById(id).populate(
    'assigned_to admin_notes.addedBy',
    'name email role'
  );

  if (enquiry && enquiry.status === 'new') {
    enquiry.status = 'in_progress';
    const systemNote = {
      note: "[System] Status automatically changed from 'new' to 'in_progress' upon opening.",
    };
    if (userId) {
      systemNote.addedBy = userId;
    }
    enquiry.admin_notes.push(systemNote);
    await enquiry.save();
  }

  return enquiry;
};

export const updateEnquiry = async (id, updateData, addedBy) => {
  const enquiry = await DemoRequest.findById(id);
  if (!enquiry) return null;

  // Fetch the acting user's name + role to use in the note
  let actorLabel = 'System';
  if (addedBy) {
    const { User } = await import('../../auth/auth.model.js');
    const actor = await User.findById(addedBy).select('name role');
    if (actor) {
      const roleLabel =
        {
          admin: 'Admin',
          admissions: 'Admissions',
          instructor: 'Instructor',
          finance: 'Finance',
          student: 'Student',
        }[actor.role] ?? actor.role;
      actorLabel = `${actor.name} (${roleLabel})`;
    }
  }

  const { note, status, ...restData } = updateData;
  const updatePayload = { $set: restData };

  let finalNote = note;

  if (status && status !== enquiry.status) {
    updatePayload.$set.status = status;
    const statusMsg = `[${actorLabel}] Status changed from '${enquiry.status}' to '${status}'.`;
    finalNote = note ? `${statusMsg} Note: ${note}` : statusMsg;
  } else if (note) {
    // Pure note without status change — still attribute to the actor
    finalNote = note;
  }

  if (finalNote) {
    updatePayload.$push = { admin_notes: { note: finalNote, addedBy } };
  }

  return await DemoRequest.findByIdAndUpdate(id, updatePayload, {
    new: true,
    runValidators: true,
  }).populate('assigned_to admin_notes.addedBy', 'name email role');
};

export const deleteEnquiry = async (id) => {
  return await DemoRequest.findByIdAndDelete(id);
};
