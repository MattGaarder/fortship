require("dotenv").config();

function formatForecast(forecast) {
    return {
        condition: forecast.weather[0].description,
        icon: forecast.weather[0].icon,

        temperature: Math.round(forecast.main.temp),
        feelsLike: Math.round(forecast.main.feels_like),

        humidity: forecast.main.humidity,

        windSpeed: Math.round(forecast.wind.speed * 3.6),
        windDirection: forecast.wind.deg,
        windGust: forecast.wind.gust
            ? Math.round(forecast.wind.gust * 3.6)
            : null,

        rainChance: Math.round(forecast.pop * 100)
    };
}

async function getWeather() {
    const lat = -3.7014;
    const lon = -38.4754;
    const apiKey = process.env.OPENWEATHER_API_KEY;

    console.log("========== WEATHER DEBUG ==========");
    console.log("Latitude:", lat);
    console.log("Longitude:", lon);
    console.log("API key exists:", Boolean(apiKey));
    console.log("API key length:", apiKey ? apiKey.length : 0);

    if (!apiKey) {
        throw new Error("OPENWEATHER_API_KEY is required.");
    }

    const url =
        `https://api.openweathermap.org/data/2.5/forecast` +
        `?lat=${lat}` +
        `&lon=${lon}` +
        `&appid=${apiKey}` +
        `&units=metric` +
        `&lang=en`;

    let response;

    try {
        response = await fetch(url);
    } catch (error) {
        console.error("========== OPENWEATHER FETCH FAILED ==========");
        console.error("Error name:", error.name);
        console.error("Error message:", error.message);
        console.error("Error code:", error.code);
        console.error("Error cause:", error.cause);
        console.error("Full error:", error);

        throw error;
    }

    if (!response.ok) {
        const error = await response.text();
        throw new Error(
            `OpenWeather returned ${response.status}: ${error}`
        );
    }

    const data = await response.json();

    // console.log("OPENWEATHER RESPONSE:", JSON.stringify(data, null, 2));

    const forecast = data.list[0];

    const nightForecast = data.list.find(
        forecast => forecast.dt_txt.endsWith("21:00:00")
    );

    if (!nightForecast) {
        throw new Error("No 21:00 forecast available.");
    }

    return {
        current: formatForecast(forecast),
        night: formatForecast(nightForecast)
    };
}

module.exports = getWeather;