const fs = require("fs");
const path = require("path");
const cron = require("node-cron");

const sourceFile = path.join(__dirname, "usersData.json");
const backupDir = path.join(__dirname, "backup");

if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir);
}

cron.schedule("0 */6 * * *", () => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupFile = path.join(backupDir, `usersData_${timestamp}.json`);
  fs.copyFileSync(sourceFile, backupFile);
  console.log(`✅ Backup created: ${backupFile}`);
});
