const {
  getUserData,
  getAllUserData,
  saveData,
  addBooking,
  removeBooking,
  isTimeBooked,
} = require("../utils/userData.js");
const translate = require("../utils/translate");
const { showMainMenu } = require("../keyboard/mainMenu.js");

function showTimeSelector(bot) {
  bot.on("callback_query", (query) => {
    const chatId = query.message.chat.id;
    const data = query.data;

    if (data.startsWith("DAY::")) {
      const selectedDay = data.split("::")[1];
      const userData = getUserData(chatId);
      const lang = userData.language || "uk";
      const t = translate[lang];

      const [y, m, d] = selectedDay.split("-").map(Number);
      const bookingDate = new Date(y, m - 1, d);
      bookingDate.setHours(0, 0, 0, 0);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (bookingDate < today) {
        bot.sendMessage(chatId, `${t.invalidDate}`);
        return;
      }

      saveData(chatId, "selectedDay", selectedDay);
      bot.sendMessage(chatId, `${t.youChose}: ${selectedDay}`);

      sendTimeOptions(bot, chatId, lang);
    }

    if (data.startsWith("TIME::")) {
      const selectedTime = data.split("::")[1];
      const userData = getUserData(chatId);
      const lang = userData.language || "uk";
      const t = translate[lang];

      const selectedDay = userData.selectedDay;
      const [y, m, d] = selectedDay.split("-").map(Number);
      const bookingDateTime = new Date(y, m - 1, d);
      const [hours, minutes] = selectedTime.split(":").map(Number);
      bookingDateTime.setHours(hours, minutes, 0, 0);

      const now = new Date();

      if (bookingDateTime < now) {
        bot.sendMessage(chatId, `${t.invalidTime}`);
        return;
      }

      // Якщо користувач мав попередній запис, видаляємо його з bookedTimes
      if (userData.selectedDay && userData.selectedTime) {
        removeBooking(userData.selectedDay, userData.selectedTime);
      }

      // Додаємо новий запис
      addBooking(selectedDay, selectedTime, chatId);

      // Зберігаємо в дані користувача
      saveData(chatId, "selectedTime", selectedTime);

      const message = `✅ ${
        t.youChoseTime || `🕒${t.timeSet}`
      }: ${selectedTime}`;

      const inlineKeyboard = {
        reply_markup: {
          inline_keyboard: [
            [{ text: `${t.returnMenu}`, callback_data: "BACK_TO_MAIN" }],
          ],
        },
      };

      bot.sendMessage(chatId, message, inlineKeyboard);

      notifyAdminsAboutBooking(bot, chatId);
    }

    if (data === "BACK_TO_MAIN") {
      bot.answerCallbackQuery({ callback_query_id: query.id });
      bot.editMessageReplyMarkup(
        { inline_keyboard: [] },
        { chat_id: query.message.chat.id, message_id: query.message.message_id }
      );
      showMainMenu(bot, chatId);
    }

    if (data === "IGNORE") {
      bot.answerCallbackQuery({
        callback_query_id: query.id,
        text: `${t.notTime}`,
      });
    }
  });
}

function sendTimeOptions(bot, chatId, lang) {
  const t = translate[lang];
  const userData = getUserData(chatId);

  const selectedDay = userData.selectedDay;
  const [y, m, d] = selectedDay.split("-").map(Number);

  const today = new Date();
  const selectedDate = new Date(y, m - 1, d);
  selectedDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const times = ["09:00", "12:00", "15:00", "18:00"];
  const availableButtons = [];

  times.forEach((time) => {
    const [hours, minutes] = time.split(":").map(Number);
    const timeDate = new Date(y, m - 1, d, hours, minutes);

    const isBooked = isTimeBooked(selectedDay, time);

    if (
      isBooked ||
      (selectedDate.getTime() === today.getTime() && timeDate < new Date())
    ) {
      if (availableButtons.length % 2 === 0) availableButtons.push([]);
      availableButtons[availableButtons.length - 1].push({
        text: "❌",
        callback_data: "IGNORE",
      });
    } else {
      if (availableButtons.length % 2 === 0) availableButtons.push([]);
      availableButtons[availableButtons.length - 1].push({
        text: time,
        callback_data: `TIME::${time}`,
      });
    }
  });

  bot.sendMessage(chatId, `🕒${t.time}`, {
    reply_markup: {
      inline_keyboard: availableButtons,
    },
  });
}

const notifyAdminsAboutBooking = (bot, chatId) => {
  const userData = getUserData(chatId);
  const adminIds = process.env.ADMIN_IDS
    ? process.env.ADMIN_IDS.split(",")
    : [];

  if (adminIds.length === 0) return;

  const fullName = userData.full_name || "Невідоме ім'я";
  const phone = userData.phone_number || "Невідомий номер";
  const service = userData.selectedService || "Невідома послуга";
  const day = userData.selectedDay || "Невідома дата";
  const time = userData.selectedTime || "Невідомий час";

  const message = `📢 НОВИЙ ЗАПИС\n👤 ${fullName}\n📱 +${phone}\n💼 ${service}\n📅 ${day}\n🕒 ${time}`;

  adminIds.forEach((adminId) => {
    if (adminId !== String(chatId)) {
      bot.sendMessage(adminId, message);
    }
  });
};

module.exports = {
  showTimeSelector,
  sendTimeOptions,
};
