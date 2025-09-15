import { orderTemplates } from "./emailTemplates.js";
import { sendEmail } from "./sendEmail.js"; // whatever your actual email sending function is

export const handleOrderEmail = async (order, customerKey = null, uuid = null) => {
    try {
        if (!order) return;

        const type = customerKey && uuid ? "new" : "update";

        await sendOrderEmail(order, customerKey, uuid);

        // console.log(`Order email sent (${type}) for order ${order._id}`);
    } catch (err) {
        console.error("Error sending order email:", err);
    }
};

const sendOrderEmail = async (order, customerKey = null, uuid = null) => {
    try {
        if (!order) throw new Error("Missing order");

        const type = customerKey && uuid ? "new" : "update";

        const email = order.customer?.email;
        if (!email) throw new Error("Missing customer's email");

        let message;

        if (customerKey) {
            message = orderTemplates.newOrder({ order, customerKey, uuid });
        } else {
            message = orderTemplates.updateOrder({ order });
        }

        await sendEmail(email, `Order ${type === "new" ? "Confirmation" : "Update"} ${order._id}`, message);
        // console.log(`Order ${type} email sent to ${email}`);
    } catch (error) {
        console.error("Failed to send email:", err);
    }
};