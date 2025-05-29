const {
  saveData,
  getUserData,
  getBlockedDates,
} = require("../utils/userData.js");
const translate = require("../utils/translate.js");

function createInlineCalendar(year, month, chatId, isAdmin = false) {
  const userData = getUserData(chatId);
  const lang = userData.language || "uk";
  const t = translate[lang];

  const blockedDates = getBlockedDates();

  const date = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = (date.getDay() + 6) % 7;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const buttons = [];
  const weekdays = [t.day, t.day1, t.day2, t.day3, t.day4, t.day5, t.day6];
  buttons.push(weekdays.map((d) => ({ text: d, callback_data: "IGNORE" })));

  let row = [];

  for (let i = 0; i < firstDayOfWeek; i++) {
    row.push({ text: " ", callback_data: "IGNORE" });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const currentDate = new Date(year, month, day);
    currentDate.setHours(0, 0, 0, 0);

    const dateStr = `${year}-${(month + 1).toString().padStart(2, "0")}-${day
      .toString()
      .padStart(2, "0")}`;

    const isPast = currentDate < today;
    const isBlocked = !!blockedDates[dateStr];

    // Іконка показується ВСІМ, але доступ — залежно від ролі
    const buttonText = isBlocked ? "❌" : `${day}`;
    let callback_data = "IGNORE";

    if (!isPast) {
      if (isAdmin) {
        callback_data = `BLOCK_DAY::${dateStr}`;
      } else if (!isBlocked) {
        callback_data = `DAY::${dateStr}`;
      }
    }

    row.push({ text: buttonText, callback_data });

    if (row.length === 7) {
      buttons.push(row);
      row = [];
    }
  }

  if (row.length > 0) {
    while (row.length < 7) {
      row.push({ text: " ", callback_data: "IGNORE" });
    }
    buttons.push(row);
  }

  const prevMonth = month === 0 ? 11 : month - 1;
  const nextMonth = month === 11 ? 0 : month + 1;
  const prevYear = month === 0 ? year - 1 : year;
  const nextYear = month === 11 ? year + 1 : year;

  const monthSwitchRow = [
    {
      text: "⬅️",
      callback_data: isAdmin
        ? `BLOCK_MONTH::${prevYear}::${prevMonth}`
        : `MONTH::${prevYear}::${prevMonth}`,
    },
    {
      text: t.months[month],
      callback_data: "IGNORE",
    },
    {
      text: "➡️",
      callback_data: isAdmin
        ? `BLOCK_MONTH::${nextYear}::${nextMonth}`
        : `MONTH::${nextYear}::${nextMonth}`,
    },
  ];

  buttons.push(monthSwitchRow);

  return buttons;
}

module.exports = {
  createInlineCalendar,
};
