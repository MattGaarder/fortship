const fs = require("fs");
const path = require("path");

const icons = [
    "01d", "01n",
    "02d", "02n",
    "03d", "03n",
    "04d", "04n",
    "09d", "09n",
    "10d", "10n",
    "11d", "11n",
    "13d", "13n",
    "50d", "50n"
];

const outputDir = path.join(__dirname, "assets", "weather");

fs.mkdirSync(outputDir, { recursive: true });

async function downloadIcons() {
    for (const icon of icons) {
        const url = `https://openweathermap.org/img/wn/${icon}@2x.png`;
        const outputPath = path.join(outputDir, `${icon}.png`);

        console.log(`Downloading ${icon}...`);

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(
                `Failed to download ${icon}: ${response.status}`
            );
        }

        const buffer = Buffer.from(await response.arrayBuffer());

        fs.writeFileSync(outputPath, buffer);

        console.log(`Saved ${outputPath}`);
    }
}

downloadIcons().catch(console.error);