import { Handler } from "@netlify/functions";
import { createApp } from "../../server/_core/index";

// We use the dynamic import of serverless-http so that Netlify's build
// process can include it only when bundling this function.  Make sure
// to install the dependency `serverless-http` in your package.json.
const serverless = require("serverless-http");

// Initialize the Express app outside of the handler so it only runs once.
const app = createApp();

// In production (i.e. when running on Netlify) serve the built client
// assets.  Netlify sets the `NODE_ENV` to 'production' during functions.
if (process.env.NODE_ENV === "production") {
  // Dynamically import the static server to avoid circular dependencies.
  const { serveStatic } = require("../../server/_core/vite");
  serveStatic(app);
}

export const handler: Handler = serverless(app);