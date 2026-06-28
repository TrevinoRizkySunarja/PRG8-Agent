export function createTools(vectorStore) {
  return {
    async document_search({ query }) {
      const results = vectorStore.search(query, 5);
      return {
        name: "document_search",
        summary: `${results.length} relevante documentstukken gevonden.`,
        results
      };
    },

    async calculator({ expression }) {
      const safeExpression = expression.replace(/[^0-9+\-*/().,%\s]/g, "");
      if (!safeExpression.trim()) {
        return {
          name: "calculator",
          summary: "Geen veilige berekening gevonden.",
          result: null
        };
      }

      try {
        const result = Function(`"use strict"; return (${safeExpression.replaceAll("%", "/100")});`)();
        return {
          name: "calculator",
          summary: `${safeExpression} = ${result}`,
          result
        };
      } catch {
        return {
          name: "calculator",
          summary: "De calculator kon deze som niet veilig uitvoeren.",
          result: null
        };
      }
    },

    async weather({ city }) {
      const geoEndpoint = new URL("https://geocoding-api.open-meteo.com/v1/search");
      geoEndpoint.searchParams.set("name", city);
      geoEndpoint.searchParams.set("count", "1");
      geoEndpoint.searchParams.set("language", "nl");
      geoEndpoint.searchParams.set("format", "json");

      const geoResponse = await fetch(geoEndpoint);
      if (!geoResponse.ok) {
        return {
          name: "weather",
          summary: `Ik kon de locatie ${city} niet opzoeken via Open-Meteo (${geoResponse.status}).`,
          result: null
        };
      }

      const geoData = await geoResponse.json();
      const location = geoData.results?.[0];
      if (!location) {
        return {
          name: "weather",
          summary: `Ik kon geen weerlocatie vinden voor ${city}.`,
          result: null
        };
      }

      const endpoint = new URL("https://api.open-meteo.com/v1/forecast");
      endpoint.searchParams.set("latitude", String(location.latitude));
      endpoint.searchParams.set("longitude", String(location.longitude));
      endpoint.searchParams.set("current", "temperature_2m,weather_code,wind_speed_10m");
      endpoint.searchParams.set("timezone", "auto");

      const response = await fetch(endpoint);
      if (!response.ok) {
        return {
          name: "weather",
          summary: `Weer ophalen voor ${location.name} is mislukt via Open-Meteo (${response.status}).`,
          result: null
        };
      }

      const data = await response.json();
      const current = data.current;
      const temperature = Math.round(current.temperature_2m);
      const wind = Math.round(current.wind_speed_10m);
      const description = describeWeatherCode(current.weather_code);

      return {
        name: "weather",
        summary: `Volgens Open-Meteo is het nu ${description} en ${temperature} graden in ${location.name}. De wind is ongeveer ${wind} km/u.`,
        result: {
          location,
          weather: data
        }
      };
    }
  };
}

export function chooseToolCalls(message) {
  const calls = [{ name: "document_search", arguments: { query: message } }];
  const lower = message.toLowerCase();

  if (/(reken|bereken|hoeveel is|[0-9]\s*[+\-*/]\s*[0-9])/.test(lower)) {
    calls.push({
      name: "calculator",
      arguments: { expression: extractExpression(message) }
    });
  }

  const weatherMatch = lower.match(/weer(?:\s+in)?\s+([\p{L}\s-]{2,40})/u);
  if (weatherMatch) {
    calls.push({
      name: "weather",
      arguments: { city: cleanupCity(weatherMatch[1]) || "Rotterdam" }
    });
  }

  return calls;
}

function extractExpression(message) {
  const match = message.match(/[0-9][0-9+\-*/().,%\s]+[0-9%]/);
  return match ? match[0] : message;
}

function cleanupCity(value) {
  return value
    .replace(/[?.!,].*$/, "")
    .replace(/\b(vandaag|morgen|nu|alsjeblieft|aub)\b/gi, "")
    .trim();
}

function describeWeatherCode(code) {
  const descriptions = {
    0: "helder weer",
    1: "grotendeels helder weer",
    2: "gedeeltelijk bewolkt weer",
    3: "bewolkt weer",
    45: "mist",
    48: "aanvriezende mist",
    51: "lichte motregen",
    53: "motregen",
    55: "zware motregen",
    61: "lichte regen",
    63: "regen",
    65: "zware regen",
    71: "lichte sneeuw",
    73: "sneeuw",
    75: "zware sneeuw",
    80: "lichte buien",
    81: "buien",
    82: "zware buien",
    95: "onweer",
    96: "onweer met hagel",
    99: "zwaar onweer met hagel"
  };
  return descriptions[code] ?? "onbekend weer";
}
