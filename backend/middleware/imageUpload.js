import multer from "multer";
import path from "path";

const storageProduct = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});

export const imageUploadProduct = multer({ storage: storageProduct });

const storageMaterial = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/materials"),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

export const imageUploadMaterial = multer({ storage: storageMaterial });