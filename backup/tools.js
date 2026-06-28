import { tool } from "langchain";
import { z } from "zod";

export const getWeather = tool({
  name: "get_weather",
  description: "Get the weather for a city",
  schema: z.object({
    city: z.string()
  }),
  async run({ city }) {
    return `Het weer in ${city} is zonnig met 18 graden.`;
  }
});

export const getTime = tool({
  name: "get_time",
  description: "Get the current time",
  schema: z.object({}),
  async run() {
    return `De tijd is nu: ${new Date().toLocaleTimeString()}`;
  }
});