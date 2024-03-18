import { defineConfig } from "astro/config";
import react from "@astrojs/react";
// import awsAmplify from "astro-aws-amplify";

import vercel from "@astrojs/vercel/serverless";

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  output: "server",
  adapter: vercel(),
  trailingSlash: "always"
});