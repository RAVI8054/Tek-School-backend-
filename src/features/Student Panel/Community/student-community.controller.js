import { Channel } from './channel.model.js';
import { Message } from './message.model.js';
import { catchAsync } from '../../../utils/catchAsync.js';
import { AppError } from '../../../utils/AppError.js';

// ─────────────────────────────────────────────────────────────
// CHANNEL MANAGEMENT
// ─────────────────────────────────────────────────────────────

export const createChannel = catchAsync(async (req, res, next) => {
  const user = req.user;

  if (user.createdChannelsCount >= 3) {
    return next(
      new AppError('Limit reached. You can only create up to 3 channels.', 403)
    );
  }

  // Safety check to ensure a name was provided
  if (!req.body.name) {
    return next(new AppError('Please provide a channel name.', 400));
  }

  // Format the name: lowercase, trim, replace spaces with hyphens
  let formattedName = req.body.name.trim().toLowerCase();
  formattedName = formattedName.replace(/\s+/g, '-');

  // Automatically prepend # if it doesn't have it
  if (!formattedName.startsWith('#')) {
    formattedName = '#' + formattedName;
  }

  req.body.name = formattedName;

  // Validate channel name format (must start with #, followed by letters, numbers, hyphens)
  if (!/^#[a-z0-9-]+$/.test(req.body.name)) {
    return next(
      new AppError(
        'Channel name can only contain letters, numbers, and hyphens.',
        400
      )
    );
  }

  // Check if a channel with this name already exists
  const existingChannel = await Channel.findOne({ name: req.body.name });
  if (existingChannel) {
    return next(
      new AppError(
        'A channel with this exact name already exists. Please choose a different name.',
        400
      )
    );
  }

  const channel = await Channel.create({
    name: req.body.name,
    description: req.body.description,
    creatorId: req.user.id,
    members: [req.user.id],
  });

  user.createdChannelsCount += 1;
  await user.save({ validateBeforeSave: false });

  res.status(201).json({ status: 'success', data: { channel } });
});

export const getChannels = catchAsync(async (req, res, next) => {
  const { search, filter } = req.query;

  const query = { status: 'active' };

  if (search) {
    query.name = { $regex: search, $options: 'i' };
  }

  if (filter === 'my_channels') {
    query.creatorId = req.user.id;
  } else if (filter === 'enrolled') {
    query.members = req.user.id;
    query.creatorId = { $ne: req.user.id };
  } else if (filter === 'discover') {
    query.members = { $ne: req.user.id };
  } else if (filter === 'all') {
    // No additional constraints needed for 'all', just search active channels
  } else {
    return next(
      new AppError(
        "Filter is required and must be 'my_channels', 'enrolled', 'discover', or 'all'.",
        400
      )
    );
  }

  const channels = await Channel.find(query);
  res.status(200).json({ status: 'success', data: { channels } });
});

export const joinChannel = catchAsync(async (req, res, next) => {
  const { channelId } = req.body;

  if (!channelId) {
    return next(
      new AppError('Please provide a channelId in the request body.', 400)
    );
  }

  const channel = await Channel.findOne({
    _id: channelId,
    status: 'active',
  });
  if (!channel) return next(new AppError('Channel not found', 404));

  if (!channel.members.includes(req.user.id)) {
    channel.members.push(req.user.id);
    await channel.save();
  }

  res.status(200).json({ status: 'success', message: 'Joined successfully' });
});

export const deleteChannel = catchAsync(async (req, res, next) => {
  const { channelId } = req.body;

  if (!channelId) {
    return next(
      new AppError('Please provide a channelId in the request body.', 400)
    );
  }

  const channel = await Channel.findOne({
    _id: channelId,
    status: 'active',
  });
  if (!channel) return next(new AppError('Channel not found', 404));

  if (channel.creatorId.toString() !== req.user.id) {
    return next(new AppError('You are not the creator of this channel.', 403));
  }

  // Permanently delete the channel
  await Channel.findByIdAndDelete(channel._id);

  // Cascade delete all messages in this channel
  await Message.deleteMany({ channelId: channel._id });

  req.user.createdChannelsCount = Math.max(
    0,
    req.user.createdChannelsCount - 1
  );
  await req.user.save({ validateBeforeSave: false });

  res.status(200).json({ status: 'success', message: 'Channel deleted' });
});

// ─────────────────────────────────────────────────────────────
// MESSAGING & INTERACTION
// ─────────────────────────────────────────────────────────────

export const getMessages = catchAsync(async (req, res, next) => {
  const limit = parseInt(req.query.limit) || 20;
  const offset = parseInt(req.query.offset) || 0;
  // Allow channelId from body or query for GET requests
  const channelId = (req.body && req.body.channelId) || req.query.channelId;

  if (!channelId) {
    return next(new AppError('Please provide a channelId.', 400));
  }

  const channel = await Channel.findOne({ _id: channelId, status: 'active' });
  if (!channel) return next(new AppError('Channel not found', 404));

  if (!channel.members.includes(req.user.id)) {
    return next(
      new AppError('Must be a channel member to view messages.', 403)
    );
  }

  const messages = await Message.find({ channelId })
    .sort({ createdAt: 1 }) // Ascending order
    .skip(offset)
    .limit(limit)
    .populate('senderId', 'name email role')
    .populate('parentMessageId');

  res.status(200).json({ status: 'success', data: { messages } });
});

export const sendMessage = catchAsync(async (req, res, next) => {
  const { content, parentMessageId, channelId } = req.body;

  if (!channelId) {
    return next(
      new AppError('Please provide a channelId in the request body.', 400)
    );
  }
  if (!content) return next(new AppError('Message content is required', 400));

  const channel = await Channel.findOne({ _id: channelId, status: 'active' });
  if (!channel) return next(new AppError('Channel not found', 404));

  if (!channel.members.includes(req.user.id)) {
    return next(
      new AppError('Must be a channel member to send messages.', 403)
    );
  }

  const message = await Message.create({
    channelId,
    senderId: req.user.id,
    content,
    parentMessageId: parentMessageId || null,
  });

  res.status(201).json({ status: 'success', data: { message } });
});

export const reactToMessage = catchAsync(async (req, res, next) => {
  const { action, messageId } = req.body;

  if (!messageId) {
    return next(
      new AppError('Please provide a messageId in the request body.', 400)
    );
  }

  if (!['like', 'dislike'].includes(action)) {
    return next(new AppError("Action must be 'like' or 'dislike'.", 400));
  }

  const message = await Message.findById(messageId);
  if (!message) return next(new AppError('Message not found', 404));

  const userId = req.user.id;
  const hasLiked = message.likes.some((id) => id.toString() === userId);
  const hasDisliked = message.dislikes.some((id) => id.toString() === userId);

  // Remove user from both arrays first to reset their state
  message.likes = message.likes.filter((id) => id.toString() !== userId);
  message.dislikes = message.dislikes.filter((id) => id.toString() !== userId);

  // Add to the appropriate array only if they didn't already have that reaction
  if (action === 'like' && !hasLiked) {
    message.likes.push(userId);
  } else if (action === 'dislike' && !hasDisliked) {
    message.dislikes.push(userId);
  }

  await message.save();

  res.status(200).json({
    status: 'success',
    data: {
      likesCount: message.likes.length,
      dislikesCount: message.dislikes.length,
    },
  });
});
