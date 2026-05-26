const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const logger = require('./logger');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Uploads a local file to Cloudinary and deletes the local copy.
 * @param {string} localFilePath - Path to the local file
 * @param {string} folder - Destination folder on Cloudinary
 * @returns {Promise<object>} Upload response from Cloudinary
 */
const uploadLocalFile = async (localFilePath, folder = 'shyam_bhog') => {
  try {
    if (!localFilePath) return null;
    
    // Upload the file to Cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: 'auto',
      folder: folder,
      quality: 'auto',
      fetch_format: 'auto',
    });
    
    // Remove local file
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
    
    return response;
  } catch (error) {
    logger.error(`Cloudinary Local Upload Error: ${error.message}`);
    // Clean up local file even on failure
    if (localFilePath && fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
    throw error;
  }
};

/**
 * Uploads a file buffer directly to Cloudinary.
 * @param {Buffer} fileBuffer - The file buffer
 * @param {string} folder - Destination folder on Cloudinary
 * @returns {Promise<object>} Upload response from Cloudinary
 */
const uploadBuffer = (fileBuffer, folder = 'shyam_bhog') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        quality: 'auto',
        fetch_format: 'auto',
      },
      (error, result) => {
        if (error) {
          logger.error(`Cloudinary Buffer Upload Error: ${error.message}`);
          reject(error);
        } else {
          resolve(result);
        }
      }
    );
    uploadStream.end(fileBuffer);
  });
};

/**
 * Deletes a file from Cloudinary using its public ID.
 * @param {string} publicId - Cloudinary public ID of the resource
 * @returns {Promise<object>} Deletion response
 */
const deleteFile = async (publicId) => {
  try {
    if (!publicId) return null;
    const response = await cloudinary.uploader.destroy(publicId);
    return response;
  } catch (error) {
    logger.error(`Cloudinary Delete Error: ${error.message}`);
    throw error;
  }
};

module.exports = {
  uploadLocalFile,
  uploadBuffer,
  deleteFile,
};
