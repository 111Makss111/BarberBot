const dotenv = require("dotenv");
dotenv.config();

const TelegramBot = require("node-telegram-bot-api");
const express = require("express");
const bodyParser = require("body-parser");

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Ініціалізація бота без polling (для Webhook або кастомного polling)
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

// 2. Обгортка sendMessage для обробки помилки 429 (Too Many Requests)
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

// 3. Імпорти модулів
const { startCommand } = require("./keyboard/mainMenu.js");
const handleRecord = require("./handlers/handleRecord.js");
const handleMyAccount = require("./handlers/handleMyAccount.js");
const { createInlineCalendar } = require("./utils/showCalendar.js");
const cleanOldRecords = require("./utils/cleanOldRecords");
const { showTimeSelector } = require("./utils/timeSelector.js");
const handleReminders = require("./handlers/handleReminders.js");

// 4. Запуск обробників
startCommand(bot);
handleRecord(bot);
handleMyAccount(bot);
createInlineCalendar(bot);
showTimeSelector(bot);
handleReminders(bot);
cleanOldRecords();

// 5. Express Web сервер для Render (не дублює порт)
app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.send("Бот працює! ✅");
});

app.post("/webhook", (req, res) => {
  console.log("📨 Отримано повідомлення від Telegram:", req.body);
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

app.listen(PORT, () => {
  console.log(`🚀 Сервер запущено на порту ${PORT}`);
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
