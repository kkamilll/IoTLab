import mongoose from "mongoose";

const TEMPLATE_TYPES = ["newOrder", "updateOrder", "resetPassword"];

const TEMPLATE_TYPE_VARIABLE_MAP = {
    newOrder: ["orderId", "CustomerName", "orderLink", "orderPassword"],
    updateOrder: ["orderId", "CustomerName"],
    resetPassword: ["VerificationCode"],
}

const templateSchema = new mongoose.Schema({
    name: { type: String, enum: TEMPLATE_TYPES, required: true },
    subject: { type: String, required: true },
    body: { type: String, required: true },
    isDefault: { type: Boolean, default: false }
}, { timestamps: true });

templateSchema.pre("save", async function (next) {
    const template = this;

    const requiredPlaceholders = TEMPLATE_TYPE_VARIABLE_MAP[template.name] || [];

    // Build regex for each placeholder
    const missingPlaceholders = requiredPlaceholders.filter(variable => {
        const placeholder = `\${${variable}}`;
        return !(template.subject.includes(placeholder) || template.body.includes(placeholder));
    });

    if (missingPlaceholders.length > 0) {
        const err = new Error(
            `Missing required placeholders in subject/body: ${missingPlaceholders.join(", ")}`
        );
        return next(err); // stop save and throw error
    }

    if (template.isDefault) {
        await template.constructor.updateMany(
            {
                _id: { $ne: template._id },  // exclude current template
                name: template.name,          // only same name
                isDefault: true               // currently default
            },
            { $set: { isDefault: false } }
        );
    }

    next();
});

templateSchema.index({ "isDefault": 1 });

templateSchema.set("optimisticConcurrency", true);
export default mongoose.model('Template', templateSchema);