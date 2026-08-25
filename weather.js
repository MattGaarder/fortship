require("dotenv").config();

function formatForecast(forecast) {
    return {
        condition: forecast.weather[0].description,
        icon: forecast.weather[0].icon,

        temperature: Math.round(forecast.main.temp),
        feelsLike: Math.round(forecast.main.feels_like),

        humidity: forecast.main.humidity,

        windSpeed: Math.round(forecast.wind.speed * 3.6),
        windDirection: getWindDirection(forecast.wind.deg),
        windGust: forecast.wind.gust
            ? Math.round(forecast.wind.gust * 3.6)
            : null,

        rainChance: Math.round(forecast.pop * 100),

        pressure: forecast.main.sea_level,
        visibility: Math.round(forecast.visibility / 1000),
        clouds: forecast.clouds.all
    };
}

function formatTime(timestamp, timezoneOffset) {
    const date = new Date((timestamp + timezoneOffset) * 1000);

    return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone: "UTC"
    });
}

function getWindDirection(degrees) {
    const directions = [
        "N", "NNE", "NE", "ENE",
        "E", "ESE", "SE", "SSE",
        "S", "SSW", "SW", "WSW",
        "W", "WNW", "NW", "NNW"
    ];

    return directions[Math.round(degrees / 22.5) % 16];
}

async function fetchWithRetry(url, maxAttempts = 3, initialDelayMs = 1000) {
    let lastError;
    let delayMs = initialDelayMs;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            const response = await fetch(url, {
                signal: AbortSignal.timeout(8000)
            });

            if (!response.ok) {
                const errorText = await response.text();

                // Non-retryable auth/bad request errors
                if (response.status === 401 || response.status === 400) {
                    throw new Error(
                        `OpenWeather returned ${response.status}: ${errorText}`
                    );
                }

                throw new Error(
                    `OpenWeather returned ${response.status}: ${errorText}`
                );
            }

            return response;
        } catch (error) {
            lastError = error;
            const isAuthError = error.message.includes("401") || error.message.includes("400");

            if (isAuthError || attempt === maxAttempts) {
                console.error(`========== OPENWEATHER ATTEMPT ${attempt}/${maxAttempts} FAILED ==========`);
                console.error("Error message:", error.message);
                break;
            }

            console.warn(`[weather] Attempt ${attempt}/${maxAttempts} failed (${error.name || error.message}). Retrying in ${delayMs / 1000}s...`);
            await new Promise((resolve) => setTimeout(resolve, delayMs));
            delayMs *= 1.5;
        }
    }

    throw lastError;
}

async function getWeather({ lat, lon }) {
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

    const response = await fetchWithRetry(url, 3, 1000);

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
        night: formatForecast(nightForecast),

        sunrise: formatTime(data.city.sunrise, data.city.timezone),
        sunset: formatTime(data.city.sunset, data.city.timezone),

        city: data.city.name,
        timezone: data.city.timezone
    };
}

module.exports = getWeather;