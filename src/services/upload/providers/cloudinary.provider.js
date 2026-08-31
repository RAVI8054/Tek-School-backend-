import { v2 as cloudinary } from 'cloudinary';

// Initialize cloudinary outside, but we rely on environment variables
// Make sure to call cloudinary.config() before using it
let isConfigured = false;

const configureCloudinary = () => {
  if (isConfigured) return;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  isConfigured = true;
};

export const CloudinaryProvider = {
  /**
   * Upload a file buffer to Cloudinary
   * @param {Buffer} fileBuffer - The file buffer
   * @param {String} folder - Folder name in Cloudinary
   * @param {String} publicId - Optional public ID (filename)
   * @returns {Promise<String>} - The URL of the uploaded image
   */
  async uploadFile(fileBuffer, folder = 'general', publicId = null) {
    configureCloudinary();

    return new Promise((resolve, reject) => {
      const options = {
        folder,
        resource_type: 'auto',
      };

      if (publicId) {
        options.public_id = publicId;
      }

      const stream = cloudinary.uploader.upload_stream(
        options,
        (error, result) => {
          if (error) {
            // eslint-disable-next-line no-console
            console.error('Cloudinary upload error:', error);
            return reject(new Error('Failed to upload image to Cloudinary'));
          }
          resolve(result.secure_url);
        }
      );

      stream.end(fileBuffer);
    });
  },
};
