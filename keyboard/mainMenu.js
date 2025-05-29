const translate = require("../utils/translate.js");
const { saveData, getUserData } = require("../utils/userData.js");
const handleMyAccount = require("../handlers/handleMyAccount");
const handleCancelRecord = require("../handlers/handleCancelRecord");
const handleViewAllRecords = require("../handlers/handleViewAllRecords.js");
const { handleBlockDates } = require("../handlers/handleBlockDates");
const { createInlineCalendar } = require("../utils/showCalendar.js");
const {
  registerBlockCalendarHandler,
} = require("../handlers/handleBlockDates");
const {
  handleAdminPhotoUpload,
  handlePortfolioView,
  handlePortfolioCallbacks,
} = require("../handlers/handlePortfolio.js");
function startCommand(bot) {
  const ADMIN_IDS = process.env.ADMIN_IDS.split(",").map((id) => id.trim());

  bot.onText(/\/start/, (msg) => {
    registerBlockCalendarHandler(bot);
    const chatId = msg.chat.id;

    const replyKeyboard = {
      reply_markup: {
        keyboard: [["🇺🇦 Українська", "🇵🇱 Polska"]],
        resize_keyboard: true,
        one_time_keyboard: false,
      },
    };

    bot.sendMessage(chatId, translate.uk.start, replyKeyboard);
  });

  bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    const userData = getUserData(chatId) || {};
    const isAdmin = ADMIN_IDS.includes(chatId.toString());

    // Вибір мови
    if (text === "🇺🇦 Українська" || text === "🇵🇱 Polska") {
      const lang = text === "🇺🇦 Українська" ? "uk" : "pl";
      const t = translate[lang];

      saveData(chatId, "language", lang);
      saveData(chatId, "isAdmin", isAdmin);

      if (isAdmin) {
        bot.sendMessage(chatId, t.gratulacje, getAdminMenu(lang));
      } else {
        bot.sendMessage(chatId, t.askFullName);
        saveData(chatId, "step", "waiting_name");
      }
      return;
    }

    // Введення імені
    if (userData.step === "waiting_name") {
      saveData(chatId, "full_name", text);
      saveData(chatId, "step", "waiting_phone");

      const lang = userData.language || "uk";
      const t = translate[lang];

      if (userData.isAdmin) {
        saveData(chatId, "step", null);
        bot.sendMessage(chatId, t.gratulacje, getAdminMenu(lang));
        return;
      }

      bot.sendMessage(chatId, t.askPhone, {
        reply_markup: {
          keyboard: [[t.skip]],
          resize_keyboard: true,
          one_time_keyboard: true,
        },
      });
      return;
    }

    // Введення телефону
    if (userData.step === "waiting_phone") {
      const lang = userData.language || "uk";
      const t = translate[lang];

      if (text === t.skip) {
        bot.sendMessage(chatId, t.thanksSkip);
        saveData(chatId, "step", null);
        showMainMenu(bot, chatId);
        return;
      }

      saveData(chatId, "phone_number", text);
      saveData(chatId, "step", null);

      bot.sendMessage(chatId, t.thanksPhone);
      showMainMenu(bot, chatId);
      return;
    }

    // ==== ОБРОБКА ГОЛОВНОГО МЕНЮ ====
    const lang = userData.language || "uk";
    const t = translate[lang];

    if (text === t.backToMainMenu) {
      showMainMenu(bot, chatId);
      return;
    }

    if (text === t.myAccount) {
      handleMyAccount(bot, chatId);
      return;
    }

    // Тут додавай інші гілки (наприклад, запис, скасування, портфоліо)
    // if (text === t.record) { ... }
    if (text === t.cancelRecord) {
      handleCancelRecord(bot, chatId, showMainMenu);
      return;
    }
    if (text === t.addToPortfolio && isAdmin) {
      bot.sendMessage(
        chatId,
        "📸 Надішліть фото, щоб додати його до портфоліо."
      );
      return;
    }
    if (text === "🔐 Повернутись до Адмін меню") {
      if (isAdmin) {
        bot.sendMessage(chatId, "🔙 Головне меню", getAdminMenu(lang));
      } else {
        showMainMenu(bot, chatId);
      }
      return;
    }
    // if (text === t.portfolio) { ... }
    if (text === t.viewAllRecords && isAdmin) {
      handleViewAllRecords(bot, chatId);
      return;
    }
    if (text === t.blockDate && isAdmin) {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();

      const keyboard = createInlineCalendar(year, month, chatId, true);

      bot.sendMessage(
        chatId,
        t.chooseDateToBlock || "🗓 Виберіть дату для блокування:",
        {
          reply_markup: {
            inline_keyboard: keyboard,
          },
        }
      );

      return;
    }
  });

  handleAdminPhotoUpload(bot); // без залежностей
  handlePortfolioView(bot, showMainMenu); // передаємо функцію
  handlePortfolioCallbacks(bot, showMainMenu, getAdminMenu); // передаємо обидві функції
}

function showMainMenu(bot, chatId) {
  const userData = getUserData(chatId);
  const lang = userData.language || "uk";
  const t = translate[lang];

  const replyKeyboard = {
    reply_markup: {
      keyboard: [
        [t.myAccount, t.record],
        [t.cancelRecord, t.portfolio],
      ],
      resize_keyboard: true,
      one_time_keyboard: true,
    },
  };

  bot.sendMessage(chatId, t.gratulacje, replyKeyboard);
}

function getAdminMenu(lang) {
  const t = translate[lang];
  return {
    reply_markup: {
      keyboard: [[t.viewAllRecords], [t.blockDate, t.addToPortfolio]],
      resize_keyboard: true,
      one_time_keyboard: true,
    },
  };
}

module.exports = {
  startCommand,
  showMainMenu,
  getAdminMenu,
};
