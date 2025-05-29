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

// Запускаємо функції
startCommand(bot);
handleRecord(bot);
createInlineCalendar(bot);
showTimeSelector(bot);
handleReminders(bot);
cleanOldRecords();
// Ловимо помилки
bot.on("polling_error", (error) => {
  console.error(
    "Polling error:",
    error.code,
    error.response?.body || error.message
  );
  if (error.code === "ETELEGRAM" && error.response?.error_code === 409) {
    console.error("Another instance is running. Exiting process.");
    process.exit(1);
  }
});
const PORT = process.env.PORT || 3000;
http
  .createServer((req, res) => {
    res.writeHead(200);
    res.end("Bot is running");
  })
  .listen(PORT);
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
