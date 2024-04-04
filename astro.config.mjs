import { defineConfig } from "astro/config";
import react from "@astrojs/react";

import cloudflare from "@astrojs/cloudflare";
import awsAmplify from "astro-aws-amplify";

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  output: "server",
  trailingSlash: "always",
  adapter: awsAmplify(),
});
