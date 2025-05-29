const {
  getAllUserData,
  saveAllUserData,
  removeBooking,
} = require("../utils/userData");
const translate = require("../utils/translate");

function handleCancelRecord(bot, chatId) {
  const allUsersData = getAllUserData();
  const userData = allUsersData[chatId] || {};
  const lang = userData.language || "uk";
  const t = translate[lang];

  if (
    userData.selectedDay &&
    userData.selectedTime &&
    userData.selectedService
  ) {
    const selectedDay = userData.selectedDay;
    const selectedTime = userData.selectedTime;

    // Знімаємо бронювання години
    removeBooking(selectedDay, selectedTime);

    // Видаляємо лише поля запису
    delete userData.selectedDay;
    delete userData.selectedTime;
    delete userData.selectedService;

    // Зберігаємо назад повну структуру
    allUsersData[chatId] = userData;
    saveAllUserData(allUsersData);

    // Повідомлення користувачу
    bot.sendMessage(chatId, `✅ ${t.bookingCancelled}`);

    // Адмінам
    const adminIds = process.env.ADMIN_IDS
      ? process.env.ADMIN_IDS.split(",")
      : [];
    const fullName = userData.full_name || "Невідоме ім'я";
    const phone = userData.phone_number || "Невідомий номер";

    const message = `⚠️ Клієнт скасував запис\n👤 ${fullName}\n📱 +${phone}`;

    adminIds.forEach((adminId) => {
      if (adminId !== String(chatId)) {
        bot.sendMessage(adminId, message);
      }
    });
  } else {
    bot.sendMessage(chatId, t.noBooking);
  }

  // Повернення до меню
  const { showMainMenu } = require("../keyboard/mainMenu");
  showMainMenu(bot, chatId);
}

module.exports = handleCancelRecord;
