import * as slotService from './slot.service.js';
import { catchAsync } from '../../../utils/catchAsync.js';
import { AppError } from '../../../utils/AppError.js';

/**
 * POST /enquiry/slots
 * Admin: create / update a slot for a given date.
 * Body: { date: 'YYYY-MM-DD', times: ['09:00', '11:00', ...], label?: string }
 */
export const createSlot = catchAsync(async (req, res) => {
  const { date, times, label } = req.body;

  if (!date || !times || !Array.isArray(times) || times.length === 0) {
    throw new AppError('date and at least one time slot are required', 400);
  }

  const slot = await slotService.upsertSlot({
    date,
    times,
    label,
    createdBy: req.user?._id,
  });

  res.status(201).json({ status: 'success', data: { slot } });
});

/**
 * GET /enquiry/slots
 * Public/Users: get all available (future) slots.
 */
export const getSlots = catchAsync(async (req, res) => {
  const slots = await slotService.getAvailableSlots();
  res.status(200).json({ status: 'success', data: { slots } });
});

/**
 * GET /enquiry/slots/all
 * Admin: get all slots including past dates.
 */
export const getAllSlots = catchAsync(async (req, res) => {
  const slots = await slotService.getAllSlots();
  res.status(200).json({ status: 'success', data: { slots } });
});

/**
 * DELETE /enquiry/slots/:id
 * Admin: delete a slot.
 */
export const deleteSlot = catchAsync(async (req, res, next) => {
  const slot = await slotService.deleteSlot(req.params.id);
  if (!slot) return next(new AppError('No slot found with that ID', 404));
  res.status(204).json({ status: 'success', data: null });
});
