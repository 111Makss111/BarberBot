const dotenv = require("dotenv");
dotenv.config();

const TelegramBot = require("node-telegram-bot-api");
const express = require("express");
const bodyParser = require("body-parser");

const app = express();
const PORT = process.env.PORT || 3000;
const URL = process.env.RENDER_EXTERNAL_URL; // обов’язково додай у .env

// 1. Створюємо бота БЕЗ polling
const bot = new TelegramBot(process.env.BOT_TOKEN);

// 2. Webhook для Render
bot.setWebHook(`${URL}/webhook`);

// 3. Обгортка sendMessage (обробка 429)
const originalSendMessage = bot.sendMessage.bind(bot);
bot.sendMessage = async function (chatId, text, options = {}) {
  try {
    return await originalSendMessage(chatId, text, options);
  } catch (error) {
    if (
      error.response &&
      error.response.statusCode === 429 &&
      error.response.body.parameters?.retry_after
    ) {
      const retryAfter = error.response.body.parameters.retry_after;
      console.warn(`⏳ Rate limit! Waiting ${retryAfter} sec...`);
      await new Promise((r) => setTimeout(r, retryAfter * 1000));
      return await bot.sendMessage(chatId, text, options);
    } else {
      console.error("❌ Telegram error:", error.message);
      throw error;
    }
  }
};

// 4. Імпорти логіки
const { startCommand } = require("./keyboard/mainMenu.js");
const handleRecord = require("./handlers/handleRecord.js");
const handleMyAccount = require("./handlers/handleMyAccount.js");
const { createInlineCalendar } = require("./utils/showCalendar.js");
const cleanOldRecords = require("./utils/cleanOldRecords");
const { showTimeSelector } = require("./utils/timeSelector.js");
const handleReminders = require("./handlers/handleReminders.js");

// 5. Реєстрація обробників
startCommand(bot);
handleRecord(bot);
handleMyAccount(bot);
createInlineCalendar(bot);
showTimeSelector(bot);
handleReminders(bot);
cleanOldRecords();

// 6. Express Webhook
app.use(bodyParser.json());

app.post("/webhook", (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

app.get("/", (req, res) => {
  res.send("Бот працює через Webhook 🚀");
});

app.listen(PORT, () => {
  console.log(`Сервер запущено на порту ${PORT}`);
});

// bot.on("polling_error", (error) => {
//   console.error(
//     "Polling error:",
//     error.code,
//     error.response?.body || error.message
//   );
// });

// bot.onText(/\/start/, (msg) => {
//   const userId = msg.from.id;
//   console.log(msg.chat.id);
// });
