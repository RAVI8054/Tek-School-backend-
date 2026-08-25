import { catchAsync } from '../../../utils/catchAsync.js';
import * as programService from './program.service.js';

export const create = catchAsync(async (req, res) => {
  const program = await programService.createProgram(req.body, req.user._id);
  res.status(201).json({
    success: true,
    message: 'Program created successfully',
    data: program,
  });
});

export const getList = catchAsync(async (req, res) => {
  const result = await programService.getPrograms(req.query);
  res.status(200).json({
    success: true,
    message: 'Programs fetched successfully',
    data: result.programs,
    pagination: result.pagination,
  });
});

export const getById = catchAsync(async (req, res) => {
  const program = await programService.getProgramById(req.params.id);
  res.status(200).json({
    success: true,
    message: 'Program fetched successfully',
    data: program,
  });
});

export const update = catchAsync(async (req, res) => {
  const program = await programService.updateProgram(
    req.params.id,
    req.body,
    req.user._id
  );
  res.status(200).json({
    success: true,
    message: 'Program updated successfully',
    data: program,
  });
});

export const archive = catchAsync(async (req, res) => {
  const program = await programService.archiveProgram(
    req.params.id,
    req.user._id
  );
  res.status(200).json({
    success: true,
    message: 'Program archived successfully',
    data: program,
  });
});
