const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const TelegramBot = require("node-telegram-bot-api");

const token = process.env.BOT_TOKEN;
const url = process.env.RENDER_EXTERNAL_URL; // це Render автоматично дає тобі у Settings → Environment

const bot = new TelegramBot(token, {
  webHook: {
    port: process.env.PORT || 3000,
  },
});

bot.setWebHook(`${url}/bot${token}`);

const app = express();
app.use(express.json());

// Обробка запитів від Telegram
app.post(`/bot${token}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// Перевірка живості
app.get("/", (req, res) => {
  res.send("Bot is running on webhook!");
});

// Підключення обробників
const { startCommand } = require("./keyboard/mainMenu.js");
const handleRecord = require("./handlers/handleRecord.js");
const handleMyAccount = require("./handlers/handleMyAccount.js");
const { createInlineCalendar } = require("./utils/showCalendar.js");
const cleanOldRecords = require("./utils/cleanOldRecords");
const { showTimeSelector } = require("./utils/timeSelector.js");
const handleReminders = require("./handlers/handleReminders.js");

startCommand(bot);
handleRecord(bot);
createInlineCalendar(bot);
showTimeSelector(bot);
handleReminders(bot);
cleanOldRecords();

console.log("Express server started, bot webhook is active.");

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
