<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from "vue";
import { runCode, type RunnableLanguage } from "../../composables/useCodeRunner";

const props = defineProps<{ html: string }>();
const root = ref<HTMLElement | null>(null);

// The renderer marks python/javascript blocks with data-runnable; this adds
// the Run button and an output panel after each render.
function decorate() {
  root.value?.querySelectorAll<HTMLElement>("pre[data-runnable]").forEach((pre) => {
    if (pre.querySelector(".code-run")) return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "code-run";
    button.textContent = "Run";
    pre.appendChild(button);
    const output = document.createElement("pre");
    output.className = "code-output";
    output.hidden = true;
    pre.after(output);
  });
}

onMounted(decorate);
watch(
  () => props.html,
  () => nextTick(decorate),
);

async function onClick(event: MouseEvent) {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>(".code-run");
  if (!button) return;
  const pre = button.closest<HTMLElement>("pre")!;
  const output = pre.nextElementSibling as HTMLElement;

  button.disabled = true;
  button.textContent = "Running…";
  output.hidden = false;
  output.textContent = "";

  await runCode(pre.dataset.lang as RunnableLanguage, pre.querySelector("code")!.textContent ?? "", {
    onOutput(text, isError) {
      const line = document.createElement("span");
      line.className = isError ? "code-output-error" : "";
      line.textContent = `${text}\n`;
      output.appendChild(line);
    },
  });

  if (!output.textContent) output.textContent = "(no output)";
  button.disabled = false;
  button.textContent = "Run";
}
</script>

<template>
  <div ref="root" class="prose-post" @click="onClick" v-html="html" />
</template>
