<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { terminalCommands } from "@/data/terminal";

const displayed = ref("");
let commandIndex = 0;
let timeoutId: number | undefined;

function typeStep(cmd: string, pos: number) {
  displayed.value = cmd.slice(0, pos);
  if (pos < cmd.length) {
    timeoutId = window.setTimeout(() => typeStep(cmd, pos + 1), 55);
  } else {
    timeoutId = window.setTimeout(() => eraseStep(cmd, cmd.length), 1100);
  }
}

function eraseStep(cmd: string, pos: number) {
  displayed.value = cmd.slice(0, pos);
  if (pos > 0) {
    timeoutId = window.setTimeout(() => eraseStep(cmd, pos - 1), 25);
  } else {
    commandIndex = (commandIndex + 1) % terminalCommands.length;
    timeoutId = window.setTimeout(() => typeStep(terminalCommands[commandIndex], 0), 300);
  }
}

onMounted(() => {
  timeoutId = window.setTimeout(() => typeStep(terminalCommands[0], 0), 600);
});

onBeforeUnmount(() => {
  if (timeoutId) window.clearTimeout(timeoutId);
});
</script>

<template>
  <div class="w-full max-w-sm rounded-xl border border-border bg-surface/80 backdrop-blur-sm">
    <div class="flex items-center gap-1.5 border-b border-border px-4 py-3">
      <span class="h-2.5 w-2.5 rounded-full bg-red-500/70" />
      <span class="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
      <span class="h-2.5 w-2.5 rounded-full bg-green-500/70" />
      <span class="ml-2 text-xs text-muted">logic-play — zsh</span>
    </div>
    <div class="p-4 text-sm">
      <div class="flex items-center gap-2">
        <span class="text-accent-violet">➜</span>
        <span class="text-accent-blue">~/logic-play</span>
        <span class="text-text">{{ displayed }}</span>
        <span class="h-4 w-2 animate-pulse bg-text" />
      </div>
    </div>
  </div>
</template>
