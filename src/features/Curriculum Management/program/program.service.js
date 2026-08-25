import { Program } from './program.model.js';
import { AppError } from '../../../utils/AppError.js';

export const createProgram = async (data, userId) => {
  const program = await Program.create({
    ...data,
    createdBy: userId,
    updatedBy: userId,
  });
  return program;
};

export const getPrograms = async (query) => {
  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  // By default, only show active programs
  const filter = { isActive: true };

  if (query.search) {
    filter.$or = [
      { title: { $regex: query.search, $options: 'i' } },
      { category: { $regex: query.search, $options: 'i' } },
      { skills: { $regex: query.search, $options: 'i' } },
    ];
  }

  if (query.level) {
    filter.level = query.level;
  }

  const [programs, total] = await Promise.all([
    Program.find(filter).sort('-createdAt').skip(skip).limit(limit),
    Program.countDocuments(filter),
  ]);

  return {
    programs,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

export const getProgramById = async (id) => {
  const program = await Program.findById(id);
  if (!program) {
    throw new AppError('Program not found', 404);
  }
  return program;
};

export const updateProgram = async (id, updateData, userId) => {
  const program = await Program.findByIdAndUpdate(
    id,
    { ...updateData, updatedBy: userId },
    { new: true, runValidators: true }
  );

  if (!program) {
    throw new AppError('Program not found', 404);
  }

  return program;
};

export const archiveProgram = async (id, userId) => {
  // Soft delete / archive
  const program = await Program.findByIdAndUpdate(
    id,
    { isActive: false, updatedBy: userId },
    { new: true }
  );

  if (!program) {
    throw new AppError('Program not found', 404);
  }

  return program;
};
