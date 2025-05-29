const { getUserData } = require("../utils/userData");
const translate = require("../utils/translate");

function handleMyAccount(bot, chatId) {
  const userData = getUserData(chatId);
  const lang = userData.language || "uk";
  const t = translate[lang];

  const fullName = userData.full_name || t.noName;
  const phone = userData.phone_number ? `+${userData.phone_number}` : t.noPhone;
  const service = userData.selectedService || t.noService;
  const day = userData.selectedDay || t.noDate;
  const time = userData.selectedTime || t.noTime;

  let message = `👤 ${t.profil}\n`;
  message += `📛 ${t.name}: ${fullName}\n`;
  message += `📱 ${t.phone}: ${phone}\n`;

  if (
    userData.selectedDay &&
    userData.selectedTime &&
    userData.selectedService
  ) {
    message += `💼 ${t.service}: ${service}\n`;
    message += `📅 ${t.date}: ${day}\n`;
    message += `🕒 ${t.time}: ${time}`;
  } else {
    message += `⚠️ ${t.noBooking}`;
  }

  const replyKeyboard = {
    reply_markup: {
      keyboard: [[t.backToMainMenu]],
      resize_keyboard: true,
      one_time_keyboard: true,
    },
  };

  bot.sendMessage(chatId, message, replyKeyboard);
}

module.exports = handleMyAccount;
