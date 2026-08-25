import { DemoRequest } from './book-demo.model.js';

export const createDemoRequest = async (data) => {
  const parsedSlot = { raw: data.slot };

  if (data.slot.startsWith('Callback')) {
    parsedSlot.type = 'callback';
    const parts = data.slot.split('·');
    parsedSlot.timePreference = parts.length > 1 ? parts[1].trim() : data.slot;
  } else {
    parsedSlot.type = 'scheduled';
    const parts = data.slot.split('·');
    if (parts.length > 1) {
      parsedSlot.dateString = parts[0].trim();
      parsedSlot.timePreference = parts[1].trim();
    } else {
      parsedSlot.dateString = data.slot;
    }
  }

  const requestData = {
    ...data,
    slot: parsedSlot,
  };

  const newRequest = await DemoRequest.create(requestData);
  return newRequest;
};
