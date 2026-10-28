import multer from "multer";
import fs from "fs";
import path from "path";

const DANGEROUS_EXTENSIONS = new Set([
  ".exe", ".bat", ".cmd", ".sh", ".ps1", ".vbs", ".php", ".phtml",
  ".html", ".htm", ".js", ".jar", ".msi", ".com", ".scr", ".dll"
]);

const safeFileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (DANGEROUS_EXTENSIONS.has(ext)) {
    return cb(new Error("Niedozwolony format pliku (format wykonywalny lub skrypt)."));
  }
  cb(null, true);
};

const storageProduct = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join("uploads", "products");
    fs.mkdir(dir, { recursive: true }, (error) => {
      if (error) return cb(error);
      cb(null, dir);
    });
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  }
});
export const filesUploadProduct = multer({
  storage: storageProduct,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: safeFileFilter
});

const storageMaterial = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join("uploads", "materials");
    fs.mkdir(dir, { recursive: true }, (error) => {
      if (error) return cb(error);
      cb(null, dir);
    });
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});
export const filesUploadMaterial = multer({
  storage: storageMaterial,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Dozwolone są tylko pliki graficzne dla materiałów slidera."));
    }
  }
});

const storageCollection = multer.diskStorage({
  destination: (req, file, cb) => {
    const safeCollectionId = (req.params.collectionId || "default").replace(/[^a-zA-Z0-9_-]/g, "");
    const dir = path.join("uploads", "collections", safeCollectionId);
    fs.mkdir(dir, { recursive: true }, (error) => {
      if (error) return cb(error);
      cb(null, dir);
    });
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  }
});
export const filesUploadCollection = multer({
  storage: storageCollection,
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: safeFileFilter
});

const storageUser = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join("uploads", "users");
    fs.mkdir(dir, { recursive: true }, (error) => {
      if (error) return cb(error);
      cb(null, dir);
    });
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  }
});
export const filesUploadUser = multer({
  storage: storageUser,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Dozwolone są tylko zdjęcia profilowe (formaty graficzne)."));
    }
  }
});