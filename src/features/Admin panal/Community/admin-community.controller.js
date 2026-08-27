import { Channel } from '../../Student Panel/Community/channel.model.js';
import { Message } from '../../Student Panel/Community/message.model.js';
import { User } from '../../auth/auth.model.js';
import { catchAsync } from '../../../utils/catchAsync.js';
import { AppError } from '../../../utils/AppError.js';

export const getAllChannels = catchAsync(async (req, res, _next) => {
  const channels = await Channel.find().populate('creatorId', 'name email');
  res.status(200).json({ status: 'success', data: { channels } });
});

export const editChannel = catchAsync(async (req, res, next) => {
  let { name } = req.body;
  const { description } = req.body;

  if (name) {
    name = name.trim().toLowerCase().replace(/\s+/g, '-');
    if (!name.startsWith('#')) {
      name = '#' + name;
    }

    if (!/^#[a-z0-9-]+$/.test(name)) {
      return next(
        new AppError(
          'Channel name can only contain letters, numbers, and hyphens.',
          400
        )
      );
    }
  }

  const channel = await Channel.findByIdAndUpdate(
    req.params.channelId,
    { name, description },
    { new: true, runValidators: true }
  );

  if (!channel) return next(new AppError('Channel not found', 404));

  res.status(200).json({ status: 'success', data: { channel } });
});

export const adminDeleteChannel = catchAsync(async (req, res, next) => {
  const { channelId } = req.body;

  if (!channelId) {
    return next(
      new AppError('Please provide a channelId in the request body.', 400)
    );
  }

  const channel = await Channel.findById(channelId);
  if (!channel) return next(new AppError('Channel not found', 404));

  // Decrement original creator's count if status was active
  if (channel.status === 'active') {
    const user = await User.findById(channel.creatorId);
    if (user) {
      user.createdChannelsCount = Math.max(0, user.createdChannelsCount - 1);
      await user.save({ validateBeforeSave: false });
    }
  }

  // Force-delete the channel
  await Channel.findByIdAndDelete(channelId);

  // Optional: Also delete associated messages (cascading delete)
  await Message.deleteMany({ channelId });

  res
    .status(200)
    .json({ status: 'success', message: 'Channel forcefully deleted' });
});

export const adminDeleteMessage = catchAsync(async (req, res, next) => {
  const message = await Message.findByIdAndDelete(req.params.messageId);
  if (!message) return next(new AppError('Message not found', 404));

  res.status(200).json({ status: 'success', message: 'Message removed' });
});

export const blockStudent = catchAsync(async (req, res, _next) => {
  const { userId } = req.params;

  const user = await User.findById(userId);
  if (user) {
    user.isBlocked = true;
    await user.save({ validateBeforeSave: false });
  }

  res
    .status(200)
    .json({ status: 'success', message: 'Student community access revoked' });
});
