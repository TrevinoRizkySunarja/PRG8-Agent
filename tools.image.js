import { tool } from "langchain";
import { z } from "zod";
import Replicate from "replicate";

export const generateImage = tool({
  name: "generate_image",
  description: "Generate an image using Replicate",
  schema: z.object({
    prompt: z.string(),
  }),
  async run({ prompt }) {
    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN
    });

    const input = {
      prompt,
      aspect_ratio: "1:1"
    };

    const output = await replicate.run("google/nano-banana-2", { input });

    return {
      url: output.url().href,
      prompt
    };
  }
});