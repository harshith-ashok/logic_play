import { ref } from "vue";

export const appReady = ref(false);

export function markAppReady() {
  appReady.value = true;
}
