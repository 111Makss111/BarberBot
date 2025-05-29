// handlers/handleReminders.js

const cron = require("node-cron");
const {
  getAllUserData,
  getBookedTimes,
  saveAllUserData,
} = require("../utils/userData.js");

/**
 * Обчислює різницю в хвилинах між двома об'єктами Date
 */
function getMinutesDiff(date1, date2) {
  return Math.round((date1 - date2) / (1000 * 60));
}

/**
 * Формує повідомлення-нагадування для користувача
 */
function generateReminderText(fullName, dateStr, timeStr, lang = "uk") {
  if (lang === "pl") {
    return `📅 Przypomnienie: masz wizytę ${dateStr} o ${timeStr}.`;
  }
  return `📅 Нагадування: у вас запис ${dateStr} о ${timeStr}.`;
}

function handleReminders(bot) {
  cron.schedule("*/15 * * * *", () => {
    const allUsers = getAllUserData();
    const bookedTimes = getBookedTimes();
    const now = new Date();

    for (const date in bookedTimes) {
      for (const time in bookedTimes[date]) {
        const chatId = bookedTimes[date][time].toString();
        const user = allUsers[chatId];

        if (!user) continue;

        const fullName = user.full_name || "Клієнт";
        const lang = user.language || "uk";

        // Формуємо дату запису в Date
        const [year, month, day] = date.split("-").map(Number);
        const [hour, minute] = time.split(":").map(Number);
        const appointmentDate = new Date(year, month - 1, day, hour, minute);

        const minutesDiff = getMinutesDiff(appointmentDate, now);

        if (!user.notifications) user.notifications = [];
        const recordId = `${date} ${time}`;
        const existing = user.notifications.find((n) => n.id === recordId);

        // Якщо нагадування ще не надсилались:
        if (!existing) {
          user.notifications.push({
            id: recordId,
            reminded24h: false,
            reminded2h: false,
          });
        }

        const notification = user.notifications.find((n) => n.id === recordId);

        // Нагадування за 24 години (±7 хв)
        if (
          !notification.reminded24h &&
          minutesDiff <= 1440 &&
          minutesDiff >= 1433
        ) {
          bot.sendMessage(
            chatId,
            generateReminderText(fullName, date, time, lang)
          );
          notification.reminded24h = true;
        }

        // Нагадування за 2 години (±7 хв)
        if (
          !notification.reminded2h &&
          minutesDiff <= 120 &&
          minutesDiff >= 113
        ) {
          bot.sendMessage(
            chatId,
            generateReminderText(fullName, date, time, lang)
          );
          notification.reminded2h = true;
        }
      }
    }

    saveAllUserData(allUsers);
  });
}

module.exports = handleReminders;
