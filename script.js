
const searchForm = document.getElementById("searchForm");
const cityInput = document.getElementById("cityInput");
const searchButton = document.getElementById("searchButton");
const refreshButton = document.getElementById("refreshButton");
const weatherCard = document.getElementById("weatherCard");
const statusBox = document.getElementById("status");

let lastSearch = null;
let requestId = 0;

const weatherDescriptions = {
  0: ["Clear sky", "☀️"],
  1: ["Mainly clear", "🌤️"],
  2: ["Partly cloudy", "⛅"],
  3: ["Overcast", "☁️"],
  45: ["Foggy", "🌫️"],
  48: ["Depositing rime fog", "🌫️"],
  51: ["Light drizzle", "🌦️"],
  53: ["Moderate drizzle", "🌦️"],
  55: ["Dense drizzle", "🌧️"],
  56: ["Light freezing drizzle", "🌧️"],
  57: ["Dense freezing drizzle", "🌧️"],
  61: ["Slight rain", "🌦️"],
  63: ["Moderate rain", "🌧️"],
  65: ["Heavy rain", "🌧️"],
  66: ["Light freezing rain", "🌧️"],
  67: ["Heavy freezing rain", "🌧️"],
  71: ["Slight snowfall", "🌨️"],
  73: ["Moderate snowfall", "🌨️"],
  75: ["Heavy snowfall", "❄️"],
  77: ["Snow grains", "❄️"],
  80: ["Slight rain showers", "🌦️"],
  81: ["Moderate rain showers", "🌧️"],
  82: ["Violent rain showers", "⛈️"],
  85: ["Slight snow showers", "🌨️"],
  86: ["Heavy snow showers", "❄️"],
  95: ["Thunderstorm", "⛈️"],
  96: ["Thunderstorm with hail", "⛈️"],
  99: ["Thunderstorm with heavy hail", "⛈️"]
};

function setStatus(message, type = "") {
  statusBox.textContent = message;
  statusBox.className = `status ${type}`;
}

function setLoading(loading) {
  searchButton.disabled = loading;
  refreshButton.disabled = loading;
  searchButton.textContent = loading ? "Searching..." : "Search ↗";
  refreshButton.textContent = loading ? "Loading..." : "↻ Refresh";
}

async function fetchJSON(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Request failed (${response.status}). Please try again.`);
  }

  return response.json();
}

async function getWeather(city) {
  const thisRequest = ++requestId;

  setLoading(true);
  setStatus("Finding city and fetching live weather...");

  try {
    // Step 1: Find the city coordinates.
    const geoURL = new URL("https://geocoding-api.open-meteo.com/v1/search");
    geoURL.search = new URLSearchParams({
      name: city,
      count: "1",
      language: "en",
      format: "json"
    });

    const geoData = await fetchJSON(geoURL);

    if (thisRequest !== requestId) return;

    if (!geoData.results || geoData.results.length === 0) {
      throw new Error("City not found. Check the spelling and try again.");
    }

    const place = geoData.results[0];

    // Step 2: Get current weather for the selected coordinates.
    const weatherURL = new URL("https://api.open-meteo.com/v1/forecast");
    weatherURL.search = new URLSearchParams({
      latitude: String(place.latitude),
      longitude: String(place.longitude),
      current: [
        "temperature_2m",
        "relative_humidity_2m",
        "apparent_temperature",
        "is_day",
        "precipitation",
        "weather_code",
        "cloud_cover",
        "pressure_msl",
        "wind_speed_10m"
      ].join(","),
      timezone: "auto"
    });

    const weatherData = await fetchJSON(weatherURL);

    if (thisRequest !== requestId) return;

    if (!weatherData.current) {
      throw new Error("Weather data is unavailable for this city.");
    }

    renderWeather(place, weatherData);
    lastSearch = city;
    cityInput.value = city;
    setStatus("Weather updated successfully.");
  } catch (error) {
    if (thisRequest !== requestId) return;

    setStatus(error.message || "Unable to load weather. Please try again.", "error");
  } finally {
    if (thisRequest === requestId) {
      setLoading(false);
    }
  }
}

function renderWeather(place, data) {
  const current = data.current;
  const weather = weatherDescriptions[current.weather_code] || [
    "Unknown conditions",
    "🌡️"
  ];

  document.getElementById("cityName").textContent =
    [place.name, place.admin1, place.country].filter(Boolean).join(", ");

  document.getElementById("weatherDescription").textContent = weather[0];
  document.getElementById("weatherIcon").textContent =
    current.is_day === 0 && current.weather_code <= 1 ? "🌙" : weather[1];

  document.getElementById("temperature").textContent =
    Math.round(current.temperature_2m);

  document.getElementById("feelsLike").textContent =
    `${Math.round(current.apparent_temperature)}°C`;

  document.getElementById("humidity").textContent =
    `${current.relative_humidity_2m}%`;

  document.getElementById("windSpeed").textContent =
    `${current.wind_speed_10m} km/h`;

  document.getElementById("pressure").textContent =
    `${Math.round(current.pressure_msl)} hPa`;

  document.getElementById("cloudCover").textContent =
    `${current.cloud_cover}%`;

  const localTime = current.time.replace("T", " ");
  document.getElementById("localTime").textContent =
    `Local time: ${localTime}`;

  weatherCard.hidden = false;
}

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const city = cityInput.value.trim();

  if (!city) {
    setStatus("Please enter a city name.", "error");
    cityInput.focus();
    return;
  }

  getWeather(city);
});

refreshButton.addEventListener("click", () => {
  if (lastSearch) {
    getWeather(lastSearch);
  }
});

// Show weather for Patna when the app first opens.
getWeather("Patna");
