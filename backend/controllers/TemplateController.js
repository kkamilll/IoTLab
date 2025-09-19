import Template from '../models/Template.js';

import mongoose from "mongoose";
import { AppError, ValidationError, BadRequestError, DuplicateKeyError, PermissionError, ResourceNotFoundError, ConflictError, ServerError } from '../errors/CustomErrors.js'

export const getTemplateNames = (req, res, next) => {
    try {
        res.json({ success: true, data: Template.schema.path("name").enumValues });
    } catch (error) {
        next(error);
    }
};

export const getTemplateById = async (req, res, next) => {
    try {
        const { templateId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(templateId))
            return next(new BadRequestError("Invalid template ID"));

        const template = await Template.findById(templateId).lean();
        if (!template) {
            return next(new ResourceNotFoundError('Template'));
        }

        res.status(200).json({ success: true, data: template });
    } catch (error) {
        next(error);
    }
};

export const getTemplates = async (req, res, next) => {
    try {
        const { name, isDefault, subject } = req.query;

        const filter = {};
        if (name) filter.name = name;
        if (isDefault != undefined && isDefault != '') filter.isDefault = isDefault === 'true';
        if (subject) filter.subject = new RegExp(subject, 'i');

        const templates = await Template.find(filter)
            .sort({ createdAt: -1, name: -1 }).lean();

        res.status(200).json({ success: true, data: templates });
    } catch (error) {
        next(error);
    }
};

export const createTemplate = async (req, res, next) => {
    try {
        if (!req.body) {
            return next(new BadRequestError("Request body is missing"));
        }
        const { name, subject, body, isDefault } = req.body;

        const newTemplate = new Template({
            name, subject, body, isDefault
        });

        const existingTemplates = await Template.find({ name, isDefault: true });
        if (existingTemplates.length === 0) {
            newTemplate.isDefault = true;
        }

        await newTemplate.save();

        res.status(201).json({ success: true, message: "Template created", data: newTemplate });
    } catch (error) {
        next(error);
    }
};

export const updateTemplate = async (req, res, next) => {
    try {
        if (!req.body) {
            return next(new BadRequestError("Request body is missing"));
        }

        const { templateId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(templateId))
            return next(new BadRequestError("Invalid template ID"));

        const { name, subject, body, isDefault } = req.body;

        const updatedTemplate = await Template.findById(templateId);
        if (!updatedTemplate) {
            return next(new ResourceNotFoundError('Template'));
        }
        if (name != undefined) updatedTemplate.name = name;
        if (subject != undefined) updatedTemplate.subject = subject;
        if (body != undefined) updatedTemplate.body = body;
        if (isDefault != undefined) updatedTemplate.isDefault = isDefault;

        const existingTemplates = await Template.find({ name, isDefault: true });
        if (existingTemplates.length === 0) {
            updatedTemplate.isDefault = true;
        }

        await updatedTemplate.save();

        res.status(200).json({ success: true, message: "Template updated", data: updatedTemplate });

    } catch (error) {
        next(error);
    }
};

export const deleteTemplate = async (req, res, next) => {
    try {
        const { templateId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(templateId))
            return next(new BadRequestError("Invalid template ID"));

        const template = await Template.findById(templateId);
        if (!template) {
            return next(new ResourceNotFoundError('Template'));
        }

        if (template.isDefault) {
            return next(new BadRequestError("Cannot delete the default template."));
        }

        // Check if there are other templates with the same name
        const otherTemplates = await Template.find({
            _id: { $ne: template._id },
            name: template.name
        });

        if (otherTemplates.length === 0) {
            return next(new BadRequestError("Cannot delete the only template with this name."));
        }

        await template.deleteOne();

        return res.status(200).json({ success: true, message: "Template deleted", data: null });
    } catch (error) {
        next(error);
    }
};