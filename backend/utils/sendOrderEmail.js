import { orderTemplates } from "./emailTemplates.js";
import { sendEmail } from "./sendEmail.js"; // whatever your actual email sending function is

export const handleOrderEmail = async (order, isNew = true) => {
    try {
        if (!order) return;

        const type = isNew ? "new" : "update";

        await sendOrderEmail(order, type);

        console.log(`Order email sent (${type}) for order ${order._id}`);
    } catch (err) {
        console.error("Error sending order email:", err);
    }
};

const sendOrderEmail = async (order, type = "new") => {
    try {
        if (!order) throw new Error("Missing order");

        const email = order.customer?.email;
        if (!email) throw new Error("Missing customer's email");

        let message;

        if (type === "new") {
            message = orderTemplates.newOrder({ order });
        } else if (type === "update") {
            message = orderTemplates.updateOrder({ order });
        } else {
            throw new Error("Invalid email type");
        }

        console.log("test");
        await sendEmail(email, `Order ${type === "new" ? "Confirmation" : "Update"} ${order._id}`, message);
        console.log(`Order ${type} email sent to ${email}`);
    } catch (error) {
        console.error("Failed to send email:", err);
    }
};