const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "usersData.json");

function readData() {
  if (!fs.existsSync(filePath)) return {};
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function saveAllUserData(allData) {
  fs.writeFileSync(filePath, JSON.stringify(allData, null, 2));
}

function saveData(chatId, field, value) {
  const data = readData();
  if (!data[chatId]) data[chatId] = {};
  data[chatId][field] = value;
  saveAllUserData(data);
}

function getUserData(chatId) {
  const data = readData();
  return data[chatId] || {};
}

function getAllUserData() {
  return readData();
}

// ==========================
// ===== BLOCKED DATES ======
// ==========================

function getBlockedDates() {
  const data = readData();
  return data.blockedDates || {};
}

function isDateBlocked(dateStr) {
  const blockedDates = getBlockedDates();
  return !!blockedDates[dateStr];
}

function toggleBlockedDate(dateStr) {
  const data = readData();
  if (!data.blockedDates) {
    data.blockedDates = {};
  }

  if (data.blockedDates[dateStr]) {
    delete data.blockedDates[dateStr];
  } else {
    data.blockedDates[dateStr] = true;
  }

  saveAllUserData(data);
}
// === ДОДАНО ДЛЯ ЗАБРОНЬОВАНИХ ГОДИН ===
function getBookedTimes() {
  const data = readData();
  if (!data.bookedTimes) data.bookedTimes = {};
  return data.bookedTimes;
}

function saveBookedTimes(bookedTimes) {
  const data = readData();
  data.bookedTimes = bookedTimes;
  saveAllUserData(data);
}

function addBooking(dateStr, timeStr, chatId) {
  const bookedTimes = getBookedTimes();
  if (!bookedTimes[dateStr]) bookedTimes[dateStr] = {};
  bookedTimes[dateStr][timeStr] = chatId;
  saveBookedTimes(bookedTimes);
}

function removeBooking(dateStr, timeStr) {
  const bookedTimes = getBookedTimes();
  if (bookedTimes[dateStr] && bookedTimes[dateStr][timeStr]) {
    delete bookedTimes[dateStr][timeStr];
    if (Object.keys(bookedTimes[dateStr]).length === 0) {
      delete bookedTimes[dateStr];
    }
    saveBookedTimes(bookedTimes);
  }
}

function isTimeBooked(dateStr, timeStr) {
  const bookedTimes = getBookedTimes();
  return bookedTimes[dateStr] && bookedTimes[dateStr][timeStr] !== undefined;
}
module.exports = {
  saveData,
  saveAllUserData,
  getUserData,
  getAllUserData,
  getBlockedDates,
  isDateBlocked,
  toggleBlockedDate,
  getBookedTimes,
  saveBookedTimes,
  addBooking,
  removeBooking,
  isTimeBooked,
};
