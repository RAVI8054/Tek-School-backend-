import { JobPost } from '../../Placements/JobPost.model.js';
import { JobApplication } from '../../Placements/JobApplication.model.js';
import { PlacementProfile } from '../../Placements/PlacementProfile.model.js';
import { AppError } from '../../../utils/AppError.js';
import { catchAsync } from '../../../utils/catchAsync.js';

// ---- Profile ----
export const getProfile = catchAsync(async (req, res) => {
  // If req.user is populated by middleware, use it. Otherwise, use a mock ID for now.
  const studentId = req.user?._id || '60d21b4667d0d8992e610c85'; // Static ID fallback

  let profile = await PlacementProfile.findOne({ student: studentId });
  if (!profile) {
    // Return an empty profile or create a default one
    profile = await PlacementProfile.create(
      { student: studentId },
      { upsert: true, new: true }
    );
  }

  return res.status(200).json({
    status: 'success',
    data: { profile },
  });
});

export const updateProfile = catchAsync(async (req, res) => {
  const studentId = req.user?._id || '60d21b4667d0d8992e610c85'; // Static ID fallback
  const updateData = req.body;

  const profile = await PlacementProfile.findOneAndUpdate(
    { student: studentId },
    updateData,
    { new: true, runValidators: true }
  );

  return res.status(200).json({
    status: 'success',
    data: profile,
  });
});

// ---- Jobs ----
export const getJobs = catchAsync(async (req, res) => {
  // Optionally filter by student's track if req.user provides it
  const jobs = await JobPost.find({ status: 'Open' })
    .lean()
    .sort({ createdAt: -1 });

  const jobsWithDetails = jobs.map((job) => {
    const postedDays = Math.floor(
      (new Date() - new Date(job.createdAt)) / (1000 * 60 * 60 * 24)
    );
    return { ...job, postedDays: postedDays || 0 };
  });

  return res.status(200).json({
    status: 'success',
    data: jobsWithDetails,
  });
});

// ---- Applications Pipeline ----
export const getApplications = catchAsync(async (req, res) => {
  const studentId = req.user?._id || '60d21b4667d0d8992e610c85'; // Static ID fallback

  const applications = await JobApplication.find({ student: studentId })
    .populate('job', 'role company')
    .sort({ updatedAt: -1 });

  return res.status(200).json({
    status: 'success',
    data: applications,
  });
});

export const applyForJob = catchAsync(async (req, res, next) => {
  const { jobId } = req.body;
  const studentId = req.user?._id || '60d21b4667d0d8992e610c85'; // Static fallback ID

  if (!jobId) {
    return next(new AppError('Job ID is required', 400));
  }

  const existing = await JobApplication.findOne({
    student: studentId,
    job: jobId,
  });
  if (existing) {
    return next(new AppError('Already applied for this job', 400));
  }

  const application = await JobApplication.create({
    student: studentId,
    job: jobId,
    stage: 'Applied',
  });

  await PlacementProfile.findOneAndUpdate(
    { student: studentId },
    { $inc: { applicationsSent: 1 } },
    { upsert: true }
  );

  return res.status(201).json({
    status: 'success',
    data: application,
  });
});
