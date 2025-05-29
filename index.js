const dotenv = require("dotenv");
dotenv.config();
const TelegramBot = require("node-telegram-bot-api");
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

const { startCommand } = require("./keyboard/mainMenu.js");
const handleRecord = require("./handlers/handleRecord.js");
const handleMyAccount = require("./handlers/handleMyAccount.js");
const { createInlineCalendar } = require("./utils/showCalendar.js");
const cleanOldRecords = require("./utils/cleanOldRecords");
const { showTimeSelector } = require("./utils/timeSelector.js");
const handleReminders = require("./handlers/handleReminders.js");
require("http")
  .createServer((req, res) => {
    res.writeHead(200);
    res.end("I'm alive!");
  })
  .listen(process.env.PORT || 3000);
// Запускаємо функції
startCommand(bot);
handleRecord(bot);
createInlineCalendar(bot);
showTimeSelector(bot);
handleReminders(bot);
cleanOldRecords();
// Ловимо помилки
const express = require("express");
const bodyParser = require("body-parser");

const app = express(); // Ось тут створюється змінна app

const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

// Приклад обробки webhook запиту
app.post("/webhook", (req, res) => {
  console.log("Отримано повідомлення від Telegram:", req.body);
  res.sendStatus(200);
});

app.get("/", (req, res) => {
  res.send("Бот працює!");
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
