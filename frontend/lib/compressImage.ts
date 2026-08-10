import imageCompression from "browser-image-compression";

const MAX_IMAGE_SIZE_MB = 30;

const IMAGE_OPTIONS = {
  maxSizeMB: 0.75,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
};

/**
 * Compresses an image file.
 * Returns a compressed File ready for upload.
 * Skips compression if image is already under 0.75 MB.
 */
export async function compressFile(file: File): Promise<File> {
  const sizeMB = file.size / (1024 * 1024);
  
  if (!file.type.startsWith("image/")) {
    throw new Error(`Unsupported file type: ${file.type}. Only images are supported.`);
  }

  if (sizeMB > MAX_IMAGE_SIZE_MB) {
    throw new Error(`Photo is ${sizeMB.toFixed(1)} MB. Maximum is ${MAX_IMAGE_SIZE_MB} MB.`);
  }
  
  // ✅ Skip compression if already under 0.75 MB
  if (file.size < 0.75 * 1024 * 1024) {
    return file;
  }
  
  const compressed = await imageCompression(file, IMAGE_OPTIONS);
  // imageCompression returns a Blob – re-wrap it as a File to preserve the name
  return new File([compressed], file.name, { type: compressed.type });
}