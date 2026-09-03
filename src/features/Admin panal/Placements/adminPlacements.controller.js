import { JobPost } from '../../Placements/JobPost.model.js';
import { JobApplication } from '../../Placements/JobApplication.model.js';
import { HiringPartner } from '../../Placements/HiringPartner.model.js';
import { AppError } from '../../../utils/AppError.js';
import { catchAsync } from '../../../utils/catchAsync.js';

// ---- Job Applications ----
export const getApplications = catchAsync(async (req, res) => {
  // Populate student details to show on the Pipeline Board
  const applications = await JobApplication.find()
    .populate('student', 'name email')
    .populate('job', 'role company')
    .sort({ updatedAt: -1 });

  return res.status(200).json({
    status: 'success',
    data: applications,
  });
});

export const updateApplicationStage = catchAsync(async (req, res, next) => {
  const { id, _id, stage, rejectedAtStage } = req.body || {};
  const appId = id || _id;

  if (!appId) {
    return next(new AppError('Application ID is required in the body', 400));
  }

  const application = await JobApplication.findById(appId);
  if (!application) {
    return next(new AppError('Application not found', 404));
  }

  application.stage = stage || application.stage;

  if (stage === 'Rejected' && rejectedAtStage) {
    application.rejectedAtStage = rejectedAtStage;
  }

  await application.save();

  return res.status(200).json({
    status: 'success',
    data: application,
  });
});

// ---- Job Posts ----
export const getJobs = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 100;
  const skip = (page - 1) * limit;

  const total = await JobPost.countDocuments();
  const jobs = await JobPost.find()
    .lean()
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const jobsWithCounts = await Promise.all(
    jobs.map(async (job) => {
      const applicants = await JobApplication.countDocuments({ job: job._id });
      // Calculate postedDays
      const postedDays = Math.floor(
        (new Date() - new Date(job.createdAt)) / (1000 * 60 * 60 * 24)
      );
      return { ...job, applicants, postedDays: postedDays || 0 };
    })
  );

  return res.status(200).json({
    status: 'success',
    data: jobsWithCounts,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  });
});

export const createJob = catchAsync(async (req, res) => {
  const {
    role,
    company,
    track,
    location,
    salary,
    skills,
    about,
    responsibilities,
    requirements,
    benefits,
    logoDomain,
  } = req.body || {};

  const job = await JobPost.create({
    role,
    company,
    track,
    location,
    salary,
    skills,
    about,
    responsibilities,
    requirements,
    benefits,
    logoDomain,
  });

  return res.status(201).json({
    status: 'success',
    data: job,
  });
});

export const updateJob = catchAsync(async (req, res, next) => {
  console.log('updateJob req.body:', req.body);
  const { id, _id, ...updateData } = req.body || {};
  const jobId = id || _id;

  if (!jobId) {
    return next(new AppError('Job ID is required in the body', 400));
  }

  const job = await JobPost.findByIdAndUpdate(jobId, updateData, { new: true });

  if (!job) {
    return next(new AppError('Job not found', 404));
  }

  return res.status(200).json({
    status: 'success',
    data: job,
  });
});

// ---- Hiring Partners ----
export const getPartners = catchAsync(async (req, res) => {
  const partners = await HiringPartner.find().sort({ createdAt: -1 });
  return res.status(200).json({
    status: 'success',
    data: partners,
  });
});

export const createPartner = catchAsync(async (req, res) => {
  const { company, track, contactName, email, phone } = req.body || {};
  const partner = await HiringPartner.create({
    company,
    track,
    contactName,
    email,
    phone,
  });
  return res.status(201).json({
    status: 'success',
    data: partner,
  });
});
