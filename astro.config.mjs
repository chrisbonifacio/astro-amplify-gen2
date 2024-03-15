import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import awsAmplify from "astro-aws-amplify";

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  output: "server",
  adapter: awsAmplify(),
  trailingSlash: "always",
});
