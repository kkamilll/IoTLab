import multer from "multer";
import fs from "fs";
import path from "path";

const storageProduct = multer.diskStorage({
  destination: (req, file, cb) => {
    // cb(null, "uploads/products")
    const dir = path.join("uploads", "products");
    fs.mkdir(dir, { recursive: true }, (error) => {
      if (error) cb(error);
      cb(null, dir);
    })
  },
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
export const filesUploadProduct = multer({ storage: storageProduct });

const storageMaterial = multer.diskStorage({
  destination: (req, file, cb) => {
    // cb(null, `uploads/materials`)
    const dir = path.join("uploads", "materials");
    fs.mkdir(dir, { recursive: true }, (error) => {
      if (error) return cb(error);
      cb(null, dir);
    })
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});
export const filesUploadMaterial = multer({ storage: storageMaterial });

const storageCollection = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join("uploads", "collections", req.params.collectionId);
    fs.mkdir(dir, { recursive: true }, (error) => {
      if (error) return cb(error);
      cb(null, dir);
    });
  },
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});
export const filesUploadCollection = multer({ storage: storageCollection });

const storageUser = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join("uploads", "users");
    fs.mkdir(dir, { recursive: true }, (error) => {
      if (error) cb(error);
      cb(null, dir);
    })
  },
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
export const filesUploadUser = multer({ storage: storageUser });