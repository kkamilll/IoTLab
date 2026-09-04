import express from 'express';
import fs from 'fs';
import path from 'path';

import Product from '../models/Product.js';
import Material from '../models/Material.js';
import Component from '../models/Component.js';
import { BadRequestError } from '../errors/CustomErrors.js';

const router = express.Router();

// Helper to get model by schema name
const getModelBySchema = (schema) => {
  switch(schema) {
    case 'product': return Product;
    case 'material': return Material;
    case 'component': return Component;
    default: return null;
  }
};

// File download route
router.get('/:schema/:itemId/:fileId', async (req, res, next) => {
  try {
    const { schema, itemId, fileId } = req.params;
    const allowedSchemas = ['product', 'material', 'component'];
    if (!allowedSchemas.includes(schema)) return res.status(400).send('Invalid schema');

    const Model = getModelBySchema(schema);
    const item = await Model.findById(itemId);
    if (!item) return res.status(404).send(`${schema} not found`);

    let filePath = "";
    let originalName = "";

    switch (schema) {
        case "product": {
            const foundFile = (item.attachments || []).find(f => f._id.toString() === fileId && f.isVisible) ||
                              (item.images || []).find(f => f._id.toString() === fileId && f.isVisible);
            if (foundFile) {
                filePath = foundFile.path;
                originalName = foundFile.originalName;
            }
            break;
        }

        case "material": {
            filePath = item.path;
            originalName = item.filename;
            break;
        }

        case "component": {
            const foundFile = (item.files || []).find(f => f._id.toString() === fileId);
            if (foundFile) {
                filePath = foundFile.path;
                originalName = foundFile.name;
            }
            break;
        }

        default: 
            return next(new BadRequestError("Schema not found"));
    }
    
    if (!filePath) return res.status(404).send('File not found');

    if (!fs.existsSync(filePath)) return res.status(404).send('File missing on disk');
    res.download(filePath, originalName);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

export default router;
