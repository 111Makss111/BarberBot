const cron = require("node-cron");
const {
  getBookedTimes,
  removeBooking,
  getAllUserData,
  saveAllUserData,
} = require("./userData.js");

function cleanOldRecords(bot) {
  cron.schedule("*/15 * * * *", () => {
    const now = new Date();
    const bookedTimes = getBookedTimes();
    const users = getAllUserData();

    let removedCount = 0;

    for (const dateStr in bookedTimes) {
      const times = bookedTimes[dateStr];
      for (const timeStr in times) {
        const [year, month, day] = dateStr.split("-").map(Number);
        const [hour, minute] = timeStr.split(":").map(Number);
        const recordTime = new Date(year, month - 1, day, hour, minute);

        if (recordTime < now) {
          const chatId = times[timeStr].toString();
          const user = users[chatId];

          removeBooking(dateStr, timeStr);
          removedCount++;

          if (user) {
            // Видаляємо поля запису
            if (
              user.selectedDate === dateStr &&
              user.selectedTime === timeStr
            ) {
              delete user.selectedDate;
              delete user.selectedTime;
              delete user.selectedService;
              delete user.selectedYear;
              delete user.selectedMonth;
              delete user.selectedDay;
            }

            // Видаляємо відповідне повідомлення-нагадування
            if (user.notifications) {
              user.notifications = user.notifications.filter(
                (n) => n.id !== `${dateStr} ${timeStr}`
              );

              // Якщо після фільтрації список пустий — видаляємо повністю
              if (user.notifications.length === 0) {
                delete user.notifications;
              }
            }
          }
        }
      }
    }

    if (removedCount > 0) {
      saveAllUserData(users);
      console.log(`🧹 Видалено ${removedCount} протермінованих записів.`);
    } else {
      console.log("✅ Немає протермінованих записів для видалення.");
    }
  });
}

module.exports = cleanOldRecords;
