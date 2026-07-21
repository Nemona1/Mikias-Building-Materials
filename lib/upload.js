// lib/upload.js - Image upload utility
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const UPLOAD_DIR = path.join(process.cwd(), 'public/uploads/products');
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// Ensure upload directory exists
export function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

// Generate standard filename
export function generateFilename(originalName) {
  const ext = path.extname(originalName);
  const timestamp = Date.now();
  const uuid = uuidv4().slice(0, 8);
  const sanitizedName = path.basename(originalName, ext)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  
  return `${sanitizedName}-${timestamp}-${uuid}${ext}`;
}

// Validate image file
export function validateImage(file) {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: `File type ${file.type} not allowed. Allowed: ${ALLOWED_TYPES.join(', ')}` };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit` };
  }

  return { valid: true };
}

// Save image to file system
export async function saveImage(file, customName = null) {
  ensureUploadDir();
  
  const validation = validateImage(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Read file as buffer
  const buffer = Buffer.from(await file.arrayBuffer());
  
  // Generate filename
  const filename = customName || generateFilename(file.name);
  const filePath = path.join(UPLOAD_DIR, filename);
  
  // Save file
  fs.writeFileSync(filePath, buffer);
  
  // Return relative URL for database storage
  const url = `/uploads/products/${filename}`;
  return { filename, filePath, url };
}

// Delete image from file system
export function deleteImage(imageUrl) {
  try {
    if (!imageUrl) return false;
    
    // Extract filename from URL
    const filename = path.basename(imageUrl);
    const filePath = path.join(UPLOAD_DIR, filename);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting image:', error);
    return false;
  }
}

// Delete multiple images
export function deleteImages(imageUrls) {
  if (!imageUrls || !Array.isArray(imageUrls)) return false;
  
  let successCount = 0;
  for (const url of imageUrls) {
    if (deleteImage(url)) {
      successCount++;
    }
  }
  return successCount;
}

// Get image info
export function getImageInfo(imageUrl) {
  try {
    const filename = path.basename(imageUrl);
    const filePath = path.join(UPLOAD_DIR, filename);
    
    if (!fs.existsSync(filePath)) {
      return null;
    }
    
    const stats = fs.statSync(filePath);
    return {
      filename,
      filePath,
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime
    };
  } catch (error) {
    console.error('Error getting image info:', error);
    return null;
  }
}