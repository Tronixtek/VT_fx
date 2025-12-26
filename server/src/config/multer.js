import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

const uploadDir = process.env.UPLOAD_DIR || './uploads';

// Ensure upload directories exist
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

ensureDir(`${uploadDir}/videos`);
ensureDir(`${uploadDir}/thumbnails`);
ensureDir(`${uploadDir}/avatars`);
ensureDir(`${uploadDir}/documents`);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = 'videos';
    if (file.fieldname === 'thumbnail') folder = 'thumbnails';
    if (file.fieldname === 'avatar') folder = 'avatars';
    if (file.fieldname === 'document' || file.fieldname === 'resource') folder = 'documents';
    cb(null, `${uploadDir}/${folder}`);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedVideoTypes = /mp4|mov|avi|mkv|webm/;
  const allowedImageTypes = /jpg|jpeg|png|webp/;
  const allowedDocumentTypes = /pdf/; // Only PDF for viewing on platform
  
  const extname = path.extname(file.originalname).toLowerCase();
  
  if (file.fieldname === 'video') {
    if (allowedVideoTypes.test(extname.substring(1))) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed!'));
    }
  } else if (file.fieldname === 'thumbnail' || file.fieldname === 'avatar') {
    if (allowedImageTypes.test(extname.substring(1))) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  } else if (file.fieldname === 'document' || file.fieldname === 'resource') {
    if (allowedDocumentTypes.test(extname.substring(1))) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed!'));
    }
  } else {
    cb(null, true);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 500000000, // 500MB
  },
});

export default upload;
