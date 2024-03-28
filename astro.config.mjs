import { defineConfig } from "astro/config";
import react from "@astrojs/react";
// import awsAmplify from "astro-aws-amplify";
// import vercel from "@astrojs/vercel/serverless";

import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  output: "server",
  trailingSlash: "always",
  adapter: cloudflare()
});