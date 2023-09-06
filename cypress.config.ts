import { defineConfig } from "cypress";

export default defineConfig({
  // Your other Cypress configuration options go here

  // Add or update the testFiles key to specify the location of your test files
  // This pattern will match all spec.js files in cypress/integration
  e2e: {
    specPattern: "**/*.spec.js",
  },
  component: {
    devServer: {
      framework: "vue",
      bundler: "vite",
    },
  },
});
