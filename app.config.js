const { expo } = require("./app.json");

module.exports = {
  expo: {
    ...expo,
    android: {
      ...expo.android,
      // Use environment variable if provided, otherwise fallback to the path in app.json
      googleServicesFile:
        process.env.GOOGLE_SERVICES_JSON ||
        expo.android?.googleServicesFile ||
        "./google-services.json",
    },
  },
};
