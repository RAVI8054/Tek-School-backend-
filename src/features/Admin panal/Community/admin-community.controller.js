import { Channel } from '../../Student Panel/Community/channel.model.js';
import { Message } from '../../Student Panel/Community/message.model.js';
import { User } from '../../auth/auth.model.js';
import { StudentProfile } from '../../Student Panel/Profile/student-profile.model.js';
import { catchAsync } from '../../../utils/catchAsync.js';
import { AppError } from '../../../utils/AppError.js';

export const getAllChannels = catchAsync(async (req, res, _next) => {
  const { search } = req.query;
  const query = {};
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  const channels = await Channel.find(query)
    .populate('creatorId', 'name email')
    .sort('-createdAt');
  res.status(200).json({ status: 'success', data: { channels } });
});

export const getBlockedStudents = catchAsync(async (req, res, _next) => {
  const blockedProfiles = await StudentProfile.find({
    isCommunityBlocked: true,
  }).populate('userId', 'name email role createdAt');

  // Map to the shape expected by frontend, taking data from profile and user object
  const blockedUsers = blockedProfiles.map((p) => ({
    _id: p.userId._id,
    name: p.userId.name,
    email: p.userId.email,
    role: p.userId.role,
    createdAt: p.userId.createdAt,
    isBlocked: p.isCommunityBlocked,
    blockReason: p.communityBlockReason,
    blockedAt: p.communityBlockedAt,
  }));

  res.status(200).json({
    status: 'success',
    data: { users: blockedUsers },
  });
});

export const getAdminChannelMessages = catchAsync(async (req, res, _next) => {
  const { channelId } = req.params;
  const messages = await Message.find({ channelId })
    .populate('senderId', 'name email avatar')
    .sort('createdAt');

  res.status(200).json({
    status: 'success',
    data: { messages },
  });
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
    req.body.channelId,
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
    const profile = await StudentProfile.findOne({ userId: channel.creatorId });
    if (profile) {
      profile.createdChannelsCount = Math.max(
        0,
        profile.createdChannelsCount - 1
      );
      await profile.save();
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

export const blockStudent = catchAsync(async (req, res, next) => {
  const { userId, note } = req.body;

  if (!userId) {
    return next(
      new AppError('Please provide a userId in the request body.', 400)
    );
  }

  const user = await User.findById(userId);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  const profile = await StudentProfile.findOneAndUpdate(
    { userId },
    { $setOnInsert: { createdChannelsCount: 0, isCommunityBlocked: false } },
    { upsert: true, new: true }
  );

  profile.isCommunityBlocked = true;
  profile.communityBlockedAt = new Date();
  if (note) {
    profile.communityBlockReason = note;
  }
  await profile.save();

  res
    .status(200)
    .json({ status: 'success', message: 'Student community access revoked' });
});

export const unblockStudent = catchAsync(async (req, res, next) => {
  const { userId } = req.body;

  if (!userId) {
    return next(
      new AppError('Please provide a userId in the request body.', 400)
    );
  }

  const profile = await StudentProfile.findOne({ userId });
  if (profile) {
    profile.isCommunityBlocked = false;
    profile.communityBlockReason = '';
    profile.communityBlockedAt = null;
    await profile.save();
  }

  res
    .status(200)
    .json({ status: 'success', message: 'Student community access restored' });
});
