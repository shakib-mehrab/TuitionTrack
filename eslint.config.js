// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
    rules: {
      // Allow @env imports (virtual module from react-native-dotenv)
      "import/no-unresolved": ["error", { ignore: ["^@env$"] }],
    },
  },
]);
