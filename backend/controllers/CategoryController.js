import Category from "../models/Category.js";

import mongoose from "mongoose";
import { MongoServerError } from 'mongodb';
import { ValidationError, BadRequestError, PermissionError, ResourceNotFoundError, ServerError } from '../errors/CustomErrors.js'
import { validateRequiredFields } from '../utils/validateRequiredFields.js'

export const getCategories = async (req, res, next) => {
    try {
        const categories = await Category.find().populate("parent", "name").lean();
        res.json({ success: true, categories });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Nie udało się pobrać kategorii" });
    }
}

export const addCategory = async (req, res, next) => {
    try {
        const { name, description, parent } = req.body;
        if (!name) return res.status(400).json({ success: false, message: "Brak nazwy" });

        const existing = await Category.findOne({ name });
        if (existing) return res.status(400).json({ success: false, message: "Kategoria istnieje" });

        const category = await Category.create({ name, description, parent });
        res.json({ success: true, category });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Nie udało się dodać kategorii" });
    }
}

export const updateCategory = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;
        const parent = req.body.parent ? req.body.parent : null;

        if (parent && id.toString() === parent.toString()) {
        return res.status(400).json({ 
            success: false, 
            message: "A category cannot be its own parent" 
        });
        }

        const category = await Category.findByIdAndUpdate(id, { name, description, parent }, { new: true, runValidators: true });
        res.json({ success: true, category });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Nie udało się edytować kategorii" });
    }
}

export const deleteCategory = async (req, res, next) => {

}