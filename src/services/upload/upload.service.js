import { CloudinaryProvider } from './providers/cloudinary.provider.js';

export const UploadService = {
  /**
   * Upload a file using the configured provider
   * @param {Buffer} fileBuffer - The file buffer
   * @param {String} folder - Target folder in the storage
   * @param {String} publicId - Optional unique identifier/filename
   * @returns {Promise<String>} - The URL of the uploaded file
   */
  async upload(fileBuffer, folder = 'uploads', publicId = null) {
    const provider = process.env.UPLOAD_PROVIDER || 'cloudinary';

    if (provider === 'cloudinary') {
      return await CloudinaryProvider.uploadFile(fileBuffer, folder, publicId);
    }

    // Fallback or other providers can be added here
    // else if (provider === 's3') {
    //   return await S3Provider.uploadFile(fileBuffer, folder, publicId);
    // }

    throw new Error(`Upload provider '${provider}' is not supported.`);
  },
};
