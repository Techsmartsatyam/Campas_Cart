import cloudinary, { isCloudinaryConfigured } from '../config/cloudinary.js';

/**
 * Upload a Base64 image data URL to Cloudinary cleanly.
 * If base64Str is already an HTTP/HTTPS URL, returns it unchanged.
 * If Cloudinary is not configured, returns success: false with original URL for safety fallback.
 */
export const uploadBase64Image = async (base64Str, options = {}) => {
  if (!base64Str || typeof base64Str !== 'string') {
    return { success: false, error: 'Invalid image input', url: base64Str };
  }

  // If image is already an HTTP/HTTPS URL, no upload needed
  if (base64Str.startsWith('http://') || base64Str.startsWith('https://')) {
    return { success: true, url: base64Str, skipped: true };
  }

  // Only attempt upload if Base64 Data URL
  if (!base64Str.startsWith('data:image/')) {
    return { success: false, error: 'Image string is not a Base64 Data URL', url: base64Str };
  }

  if (!isCloudinaryConfigured()) {
    return {
      success: false,
      error: 'Cloudinary environment variables (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) not set',
      url: base64Str,
    };
  }

  try {
    const uploadOptions = {
      folder: 'nearcart/products',
      resource_type: 'auto',
      overwrite: true,
      ...options,
    };

    const result = await cloudinary.uploader.upload(base64Str, uploadOptions);

    return {
      success: true,
      url: result.secure_url,
      public_id: result.public_id,
      format: result.format,
      bytes: result.bytes,
    };
  } catch (error) {
    console.error('❌ Cloudinary Upload Error:', error.message);
    return {
      success: false,
      error: error.message,
      url: base64Str, // Keep original Base64 for safety
    };
  }
};
