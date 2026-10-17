import cron from 'node-cron';
import Order from '../models/Order.js';
import { sendReturnReminderEmail } from './sendEmail.js';

export const startCronJobs = () => {
  // Run every day at 08:00 AM
  cron.schedule('0 8 * * *', async () => {
    console.log('Running daily cron job for rental reminders...');
    try {
      const now = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      // We need to find orders that contain items that are "rented" or "late"
      const activeOrders = await Order.find({
        "ownersData.status": { $in: ["rented", "late"] }
      });

      let lateCount = 0;
      let reminderCount = 0;

      for (const order of activeOrders) {
        if (!order.customer?.email) continue;

        let isOverdue = false;
        let isDueTomorrow = false;
        let needsSave = false;

        for (const ownerData of order.ownersData) {
          if (["rented", "late"].includes(ownerData.status)) {
            const endDate = new Date(ownerData.assignedEndDate || order.requestedEndDate);

            // Set end of the day for the due date
            endDate.setHours(23, 59, 59, 999);

            if (now > endDate && ownerData.status !== "late") {
              // It is overdue
              ownerData.status = "late"; // Update status
              
              // Also update corresponding items
              order.items.forEach(item => {
                if (item.responsibleOwner?.toString() === ownerData.owner?.toString() && item.status === "rented") {
                  item.status = "late";
                }
              });

              isOverdue = true;
              needsSave = true;
            } else if (now > endDate && ownerData.status === "late") {
              // Already late, remind them again
              isOverdue = true;
            } else if (endDate.getDate() === tomorrow.getDate() && 
                       endDate.getMonth() === tomorrow.getMonth() && 
                       endDate.getFullYear() === tomorrow.getFullYear()) {
              // Due tomorrow
              isDueTomorrow = true;
            }
          }
        }

        if (needsSave) {
          // Disable optimistic concurrency or save safely
          await order.save();
        }

        if (isOverdue) {
          await sendReturnReminderEmail(order.customer.email, order, true);
          lateCount++;
        } else if (isDueTomorrow) {
          await sendReturnReminderEmail(order.customer.email, order, false);
          reminderCount++;
        }
      }

      console.log(`Cron job completed. Sent ${lateCount} overdue emails and ${reminderCount} reminder emails.`);
    } catch (error) {
      console.error('Error in daily cron job:', error);
    }
  });

  console.log('Cron jobs initialized.');
};
