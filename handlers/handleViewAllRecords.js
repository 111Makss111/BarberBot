const { getAllUserData } = require("../utils/userData");
const translate = require("../utils/translate");
function handleViewAllRecords(bot, chatId) {
  const allUsers = getAllUserData();
  const lang = allUsers[chatId]?.language || "uk";
  const t = translate[lang];

  const records = [];

  for (const [id, data] of Object.entries(allUsers)) {
    if (data.selectedDay && data.selectedTime && data.selectedService) {
      const fullName = data.full_name || "Невідоме ім'я";
      const phone = data.phone_number
        ? `+${data.phone_number}`
        : "Невідомий номер";

      records.push(
        `👤 ${fullName}\n📱 ${phone}\n📅 ${data.selectedDay}\n⏰ ${data.selectedTime}\n💅 ${data.selectedService}`
      );
    }
  }

  if (records.length === 0) {
    bot.sendMessage(
      chatId,
      `ℹ️ ${t.noActiveRecords || "Немає активних записів."}`
    );
  } else {
    const message = `📋 ${
      t.allActiveRecords || "Усі активні записи"
    }:\n\n${records.join("\n\n")}`;
    bot.sendMessage(chatId, message);
  }
  const { getAdminMenu } = require("../keyboard/mainMenu");
  const adminMenu = getAdminMenu(lang);

  bot.sendMessage(
    chatId,
    t.backToMainMenu || "🔙 Повернення до адмін-меню",
    adminMenu
  );
}
module.exports = handleViewAllRecords;
