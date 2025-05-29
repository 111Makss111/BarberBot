const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const bodyParser = require("body-parser");
const TelegramBot = require("node-telegram-bot-api");

const TOKEN = process.env.BOT_TOKEN;
const URL =
  process.env.RENDER_EXTERNAL_URL || `https://твоє-доменне-ім’я.onrender.com`;
const PORT = process.env.PORT || 3000;

const bot = new TelegramBot(TOKEN); // ⬅️ без { webHook: { port } }
bot.setWebHook(`${URL}/bot${TOKEN}`);

// Підключення логіки
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

const app = express();
app.use(bodyParser.json());

app.post(`/bot${TOKEN}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

app.get("/", (req, res) => {
  res.send("Бот працює через webhook ✅");
});

app.listen(PORT, async () => {
  console.log(`Сервер запущено на порту ${PORT}`);
  // Можна ще раз явно задати webhook
  await bot.setWebHook(`${URL}/bot${TOKEN}`);
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
