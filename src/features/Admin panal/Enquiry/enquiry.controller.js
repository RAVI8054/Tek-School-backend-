import * as service from './enquiry.service.js';
import { catchAsync } from '../../../utils/catchAsync.js';
import { AppError } from '../../../utils/AppError.js';
import { sendEnquiryAcknowledgementEmail } from '../../../utils/email.js';

export const bookDemo = catchAsync(async (req, res) => {
  const demoRequest = await service.createDemoRequest(req.body);

  try {
    await sendEnquiryAcknowledgementEmail(demoRequest.email, demoRequest.name);
  } catch (error) {
    console.error('Failed to send acknowledgement email:', error);
  }

  res.status(201).json({
    status: 'success',
    data: {
      demoRequest,
    },
  });
});

export const getAllEnquiries = catchAsync(async (req, res) => {
  const result = await service.getAllEnquiries(req.query);

  res.status(200).json({
    status: 'success',
    data: result,
  });
});

export const getEnquiry = catchAsync(async (req, res, next) => {
  const enquiry = await service.getEnquiryById(req.params.id, req.user?._id);

  if (!enquiry) {
    return next(new AppError('No enquiry found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      enquiry,
    },
  });
});

export const updateEnquiry = catchAsync(async (req, res, next) => {
  const enquiry = await service.updateEnquiry(
    req.params.id,
    req.body,
    req.user?._id
  );

  if (!enquiry) {
    return next(new AppError('No enquiry found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      enquiry,
    },
  });
});

export const deleteEnquiry = catchAsync(async (req, res, next) => {
  const enquiry = await service.deleteEnquiry(req.params.id);

  if (!enquiry) {
    return next(new AppError('No enquiry found with that ID', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null,
  });
});
