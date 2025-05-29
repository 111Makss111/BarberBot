// handleBlockDates.js
const { toggleBlockedDate, getUserData } = require("../utils/userData.js");
const { createInlineCalendar } = require("../utils/showCalendar.js");

function isAdmin(chatId) {
  return process.env.ADMIN_IDS.split(",").includes(chatId.toString());
}

function registerBlockCalendarHandler(bot) {
  bot.on("callback_query", async (query) => {
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;
    const data = query.data;

    if (!data.startsWith("BLOCK_DAY::") && !data.startsWith("BLOCK_MONTH::")) {
      return; // Ігноруємо інші callback-и
    }

    const lang = getUserData(chatId).language || "uk";
    const t = require("../utils/translate")[lang];

    if (data.startsWith("BLOCK_DAY::")) {
      const dateStr = data.split("::")[1];

      toggleBlockedDate(dateStr); // Змінюємо статус дати

      const [year, month] = dateStr.split("-").map(Number);
      const updatedKeyboard = createInlineCalendar(
        year,
        month - 1,
        chatId,
        true
      );

      await bot.editMessageReplyMarkup(
        { inline_keyboard: updatedKeyboard },
        { chat_id: chatId, message_id: messageId }
      );

      if (isAdmin(chatId)) {
        await bot.sendMessage(
          chatId,
          t.calendarUpdated || "⬇️ Календар оновлено",
          {
            reply_markup: {
              keyboard: [["🔐 Повернутись до Адмін меню"]],
              resize_keyboard: true,
              one_time_keyboard: false,
            },
          }
        );
      }

      await bot.answerCallbackQuery(query.id, {
        text: `Дата ${dateStr} змінена.`,
      });
    }

    if (data.startsWith("BLOCK_MONTH::")) {
      const [, yearStr, monthStr] = data.split("::");
      const year = parseInt(yearStr);
      const month = parseInt(monthStr);

      const updatedKeyboard = createInlineCalendar(year, month, chatId, true);

      await bot.editMessageReplyMarkup(
        { inline_keyboard: updatedKeyboard },
        { chat_id: chatId, message_id: messageId }
      );

      if (isAdmin(chatId)) {
        await bot.sendMessage(
          chatId,
          t.calendarUpdated || "⬇️ Календар оновлено",
          {
            reply_markup: {
              keyboard: [
                [t.backToMainMenu || "🔙 Повернутись до головного меню"],
              ],
              resize_keyboard: true,
              one_time_keyboard: false,
            },
          }
        );
      }

      await bot.answerCallbackQuery(query.id);
    }
  });
}

module.exports = {
  registerBlockCalendarHandler,
};
