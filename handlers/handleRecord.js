const translate = require("../utils/translate");
const startCommand = require("../keyboard/mainMenu");
const { saveData, getUserData } = require("../utils/userData.js");
const { createInlineCalendar } = require("../utils/showCalendar.js");
const moment = require("moment");
require("moment/locale/uk");
require("moment/locale/pl");

function handleRecord(bot) {
  bot.on("message", (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    const userData = getUserData(chatId);
    const lang = userData.language || "uk";

    const t = translate[lang];

    if (text === t.record) {
      const replyKeyboard = {
        reply_markup: {
          inline_keyboard: [
            [
              { text: t.manicure, callback_data: `${t.manicure}` },
              { text: t.pedicure, callback_data: `${t.pedicure}` },
            ],
            [
              {
                text: t.manicureRemoval,
                callback_data: `${t.manicureRemoval}`,
              },
              { text: t.withdraw, callback_data: `${t.withdraw}` },
            ],
          ],
        },
      };

      bot.sendMessage(chatId, `${t.chose}`, replyKeyboard);
    }
  });

  bot.on("callback_query", (query) => {
    const chatId = query.message.chat.id;
    const selected = query.data;
    const userData = getUserData(chatId);
    const lang = userData.language || "uk";
    const t = translate[lang];

    if (
      selected === t.manicure ||
      selected === t.pedicure ||
      selected === t.manicureRemoval ||
      selected === t.withdraw
    ) {
      saveData(chatId, "selectedService", selected);
      bot.sendMessage(chatId, `${t.youChose} ${selected}`, {
        reply_markup: {
          inline_keyboard: [
            [{ text: `📅 ${t.choosDate}`, callback_data: "SHOW_CALENDAR" }],
          ],
        },
      });
    }

    // 🟢 Обробка натискання "📅 Оберіть дату"
    if (selected === "SHOW_CALENDAR") {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();

      saveData(chatId, "selectedYear", year);
      saveData(chatId, "selectedMonth", month);

      const keyboard = createInlineCalendar(year, month, chatId, false);

      bot.sendMessage(chatId, t.choosDate, {
        reply_markup: {
          inline_keyboard: keyboard,
        },
      });
    }

    // 🟢 Обробка перемикання місяців
    if (selected.startsWith("MONTH::")) {
      const [, yearStr, monthStr] = selected.split("::");
      const year = parseInt(yearStr);
      const month = parseInt(monthStr);

      saveData(chatId, "selectedYear", year);
      saveData(chatId, "selectedMonth", month);

      const keyboard = createInlineCalendar(year, month, chatId, false);

      bot.editMessageReplyMarkup(
        { inline_keyboard: keyboard },
        { chat_id: chatId, message_id: query.message.message_id }
      );
    }

    // 🟢 Обробка вибору дати
    if (selected.startsWith("DAY::")) {
      const dateStr = selected.split("::")[1];

      saveData(chatId, "selectedDate", dateStr);

      bot.answerCallbackQuery({
        callback_query_id: query.id,
        text: `📅 ${t.youChose} ${dateStr}`,
        show_alert: false,
      });

      bot.sendMessage(chatId, `${t.youChose} ${dateStr}`);
    }
  });
}

module.exports = handleRecord;
