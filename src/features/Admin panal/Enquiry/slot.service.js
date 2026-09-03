import { Slot } from './slot.model.js';

/**
 * Admin: create or update available slots for a date.
 * If a slot document for that date already exists, we replace its times.
 */
export const upsertSlot = async ({ date, times, label, createdBy }) => {
  const slot = await Slot.findOneAndUpdate(
    { date },
    { date, times, label, createdBy },
    { upsert: true, new: true, runValidators: true }
  );
  return slot;
};

/**
 * Public / User: get all available slots (future dates only, sorted asc).
 */
export const getAvailableSlots = async () => {
  const today = new Date().toISOString().split('T')[0];
  return Slot.find({ date: { $gte: today } }).sort({ date: 1 });
};

/**
 * Admin: get all slots (including past) for management view.
 */
export const getAllSlots = async () => {
  return Slot.find().sort({ date: 1 }).populate('createdBy', 'name email');
};

/**
 * Admin: delete a slot by id.
 */
export const deleteSlot = async (id) => {
  return Slot.findByIdAndDelete(id);
};
