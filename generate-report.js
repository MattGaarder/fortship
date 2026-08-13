const fs = require("fs");
const path = require("path");

const parseShippingReport = require("./parser");
const generateHtml = require("./generator");

const inputFile = path.join(__dirname, "LINEUP.xlsx");
const outputFile = path.join(__dirname, "generated-report.html");

console.log("Reading Excel workbook...");

const report = parseShippingReport(inputFile);

console.log("Parsed report:");
console.dir(report, { depth: null });

console.log("Generating HTML...");

const html = generateHtml(report);

console.log("Writing HTML file...");

fs.writeFileSync(outputFile, html, "utf8");

console.log("Done!");
console.log(`Output: ${outputFile}`);