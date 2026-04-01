const XLSX = require("xlsx");
const path = require("path");

function readSourceData() {
  const filePath = path.join(__dirname, "../source.xlsx");

  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];

  const data = XLSX.utils.sheet_to_json(sheet);

  return data;
}

module.exports = { readSourceData };