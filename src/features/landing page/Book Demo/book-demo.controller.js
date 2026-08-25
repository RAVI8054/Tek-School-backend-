import * as service from './book-demo.service.js';
import { catchAsync } from '../../../utils/catchAsync.js';

export const bookDemo = catchAsync(async (req, res) => {
  const demoRequest = await service.createDemoRequest(req.body);

  res.status(201).json({
    status: 'success',
    data: {
      demoRequest,
    },
  });
});
