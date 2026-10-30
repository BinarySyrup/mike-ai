// Load the repository-level .env for local Functions development only.
// Azure Static Web Apps supplies production settings through app configuration.
if (process.env.NODE_ENV === "development") {
  require("dotenv").config({ path: require("node:path").resolve(__dirname, "../../.env") });
}

require("./handlers/auth");
require("./handlers/chat");
