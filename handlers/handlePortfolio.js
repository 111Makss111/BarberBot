// handlers/handlePortfolio.js
const { getUserData, saveData } = require("../utils/userData");

function handleAdminPhotoUpload(bot) {
  bot.on("photo", (msg) => {
    const chatId = msg.chat.id;
    const isAdmin = process.env.ADMIN_IDS.split(",").includes(
      chatId.toString()
    );
    if (!isAdmin) return;

    const photoArray = msg.photo;
    const fileId = photoArray[photoArray.length - 1].file_id;
    const userData = getUserData("portfolio") || {};

    const photos = userData.photos || [];
    photos.push({ file_id: fileId, added_at: new Date().toISOString() });
    saveData("portfolio", "photos", photos);

    bot.sendMessage(chatId, "✅ Фото додано до портфоліо.", {
      reply_markup: {
        keyboard: [["📂 Переглянути портфоліо"]],
        resize_keyboard: true,
        one_time_keyboard: false,
      },
    });
  });
}

function handlePortfolioView(bot, showMainMenu) {
  bot.on("message", (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;
    const lang = getUserData(chatId).language || "uk";
    const t = require("../utils/translate")[lang];

    if (text === "🔙 Повернутись до головного меню") {
      showMainMenu(bot, chatId);
      return;
    }

    if (text !== t.portfolio && text !== "📂 Переглянути портфоліо") return;

    const portfolio = getUserData("portfolio") || {};
    const photos = portfolio.photos || [];

    if (photos.length === 0) {
      bot.sendMessage(chatId, `${t.isNotFoto}`);
      return;
    }

    sendPortfolioGroup(bot, chatId, 0, photos, isAdmin(chatId));
  });
}

function handlePortfolioCallbacks(bot, showMainMenu, getAdminMenu) {
  bot.on("callback_query", (query) => {
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;
    const data = query.data;

    const portfolio = getUserData("portfolio") || {};
    let photos = portfolio.photos || [];

    const parts = data.split(":");
    if (parts[0] !== "portfolio") return;

    let page = parseInt(parts[1]);
    const action = parts[2];
    const isAdm = isAdmin(chatId);

    const pageSize = 3;
    if (action === "prev") page--;
    if (action === "next") page++;

    if (action === "open") {
      sendPortfolioGroup(bot, chatId, page, photos, isAdm);
      bot.answerCallbackQuery(query.id);
      return;
    }

    if (action === "menu") {
      const lang = getUserData(chatId).language || "uk";
      if (isAdm) {
        bot.sendMessage(chatId, "🔙 Головне меню", getAdminMenu(lang));
      } else {
        showMainMenu(bot, chatId);
      }
      bot.answerCallbackQuery(query.id);
      return;
    }

    if (action.startsWith("delete") && isAdm) {
      const indexToDelete = parseInt(action.split("_")[1]);
      photos.splice(indexToDelete, 1);
      saveData("portfolio", "photos", photos);
      if (photos.length === 0) {
        bot.editMessageText("✅ Фото видалено. Портфоліо порожнє.", {
          chat_id: chatId,
          message_id: messageId,
        });
        return;
      }
      if (page * pageSize >= photos.length)
        page = Math.max(0, Math.floor((photos.length - 1) / pageSize));
    }

    sendPortfolioGroup(bot, chatId, page, photos, isAdm, messageId);
    bot.answerCallbackQuery(query.id);
  });
}

function sendPortfolioGroup(
  bot,
  chatId,
  page,
  photos,
  isAdm,
  messageId = null
) {
  const pageSize = 3;
  const start = page * pageSize;
  const end = Math.min(start + pageSize, photos.length);
  const photoGroup = photos.slice(start, end);

  const mediaGroup = photoGroup.map((photo, idx) => ({
    type: "photo",
    media: photo.file_id,
    caption: `Фото ${start + idx + 1} з ${photos.length}`,
  }));

  const navButtons = [];
  if (page > 0)
    navButtons.push({ text: "⬅️", callback_data: `portfolio:${page}:prev` });
  if (end < photos.length)
    navButtons.push({ text: "➡️", callback_data: `portfolio:${page}:next` });

  const deleteButtons = [];
  if (isAdm) {
    photoGroup.forEach((_, idx) => {
      deleteButtons.push({
        text: `❌ ${start + idx + 1}`,
        callback_data: `portfolio:${page}:delete_${start + idx}`,
      });
    });
  }

  const actionButtons = [
    {
      text: "🔙 Повернутись до головного меню",
      callback_data: `portfolio:${page}:menu`,
    },
  ];

  const inlineMarkup = {
    inline_keyboard: [
      navButtons,
      ...(isAdm ? [deleteButtons] : []),
      actionButtons,
    ],
  };

  if (messageId) {
    bot.editMessageMedia(mediaGroup[0], {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: inlineMarkup,
    });
  } else {
    bot.sendMediaGroup(chatId, mediaGroup).then(() => {
      bot.sendMessage(chatId, "⬇️ Навігація по портфоліо:", {
        reply_markup: inlineMarkup,
      });
    });
  }
}

function isAdmin(chatId) {
  return process.env.ADMIN_IDS.split(",").includes(chatId.toString());
}

module.exports = {
  handleAdminPhotoUpload,
  handlePortfolioView,
  handlePortfolioCallbacks,
};
