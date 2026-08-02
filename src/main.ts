import { createApp } from "vue";
import { inject } from "@vercel/analytics";
import { injectSpeedInsights } from "@vercel/speed-insights";
import "./style.css";
import App from "./App.vue";
import router from "./router";

createApp(App).use(router).mount("#app");

inject();
injectSpeedInsights();
