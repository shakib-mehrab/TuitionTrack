const { expo } = require("./app.json");

// CI (GitHub Actions) sets APP_VERSION / APP_VERSION_CODE for each release build,
// e.g. 2.0.14 / 214, so the in-app update check can compare against GitHub releases.
const version = process.env.APP_VERSION || expo.version;
const versionCode = process.env.APP_VERSION_CODE ? Number(process.env.APP_VERSION_CODE) : expo.android?.versionCode;

module.exports = {
  expo: {
    ...expo,
    version,
    android: {
      ...expo.android,
      versionCode,
      // Use environment variable if provided, otherwise fallback to the path in app.json
      googleServicesFile:
        process.env.GOOGLE_SERVICES_JSON ||
        expo.android?.googleServicesFile ||
        "./google-services.json",
    },
  },
};
