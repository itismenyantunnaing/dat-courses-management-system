import imageCompression from "browser-image-compression";

const MAX_IMAGE_SIZE_MB = 30;

const IMAGE_OPTIONS = {
  maxWidthOrHeight: 1920,
  useWebWorker: true,
};

/**
 * Compresses an image file.
 * Returns a compressed File ready for upload.
 * Skips compression if image is already under the configured maxSizeMB.
 * 
 * @param file - The image file to compress
 * @param maxSizeMB - Maximum file size in MB (from system config)
 */
export async function compressFile(file: File, maxSizeMB: number = 0.75): Promise<File> {
  const sizeMB = file.size / (1024 * 1024);
  
  if (!file.type.startsWith("image/")) {
    throw new Error(`Unsupported file type: ${file.type}. Only images are supported.`);
  }

  if (sizeMB > MAX_IMAGE_SIZE_MB) {
    throw new Error(`Photo is ${sizeMB.toFixed(1)} MB. Maximum is ${MAX_IMAGE_SIZE_MB} MB.`);
  }
  
  // Skip compression if already under the configured maxSizeMB
  if (file.size < maxSizeMB * 1024 * 1024) {
    return file;
  }
  
  // Use the passed maxSizeMB directly for compression
  const compressed = await imageCompression(file, {
    ...IMAGE_OPTIONS,
    maxSizeMB: maxSizeMB,
  });
  
  // imageCompression returns a Blob – re-wrap it as a File to preserve the name
  return new File([compressed], file.name, { type: compressed.type });
}