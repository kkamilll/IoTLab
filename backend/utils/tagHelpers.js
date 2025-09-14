import Tag from "../models/Tag.js";

import mongoose from "mongoose";
import { MongoServerError } from 'mongodb';
import { AppError, ValidationError, BadRequestError, DuplicateKeyError, ResourceNotFoundError, ServerError } from '../errors/CustomErrors.js'

export const createTagHelper = async (name, session = null) => {
    if (!name) throw new ValidationError("Tag name is required");

    try {
        const tag = new Tag({ name });
        await tag.save({ session });
        return tag;
    } catch (error) {
        if (error instanceof MongoServerError && error.code === 11000) {
            const [field, value] = Object.entries(error.keyValue)[0];
            throw new DuplicateKeyError({ field, value });
        }

        if (error instanceof AppError)
            throw error;

        throw error;
    }
};

// export const updateTagHelper = async (tagId, name) => {
//     if (!mongoose.Types.ObjectId.isValid(tagId)) throw new BadRequestError("Invalid tag ID");
//     if (!name) throw new ValidationError("Tag name is required");

//     try {
//         const updatedTag = await Tag.findByIdAndUpdate(tagId, { name }, { new: true, runValidators: true });
//         if (!updatedTag) throw new Error("Tag not found");
//         return updatedTag;
//     } catch (error) {
//         if (error.code === 11000) throw new DuplicateKeyError("Tag already exists");
//         throw error;
//     }
// };

export const hardDeleteTagHelper = async (tagId) => {
    if (!mongoose.Types.ObjectId.isValid(tagId)) throw new BadRequestError("Invalid tag ID");

    try {
        const tag = await Tag.findById(tagId.toString());
        if (!tag) throw new ResourceNotFoundError("Tag");

        await tag.deleteOne();
        return true;
    } catch (error) {
        if (error instanceof AppError)
            throw error;

        return next(new ServerError({ message: error.message }));
    }
};