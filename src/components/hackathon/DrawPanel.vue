<script setup lang="ts">
import { computed, ref } from "vue";
import { runDraw } from "../../lib/hackathon/api";
import type { useHackathonAdmin } from "../../composables/useHackathonAdmin";
import Badge from "../ui/Badge.vue";

const props = defineProps<{ admin: ReturnType<typeof useHackathonAdmin> }>();

const busy = ref(false);
const error = ref("");
const message = ref("");
const confirming = ref(false);
const typed = ref("");

const hackathon = computed(() => props.admin.hackathon.value!);
const noProblems = computed(() => !props.admin.problems.value.some((p) => p.active));

async function draw(redraw: boolean) {
  busy.value = true;
  error.value = message.value = "";
  const { value, error: err } = await props.admin.run(() => runDraw(hackathon.value.id, redraw));
  busy.value = false;
  if (err) {
    error.value = err;
    return;
  }
  message.value = `${value} team${value === 1 ? "" : "s"} drawn.`;
  confirming.value = false;
  typed.value = "";
}
</script>

<template>
  <div class="glass-surface relative px-6 py-6">
    <p class="mb-4 font-sans text-sm text-fg-muted">
      Teams normally pick their own problem in Stack Roulette, which deals their stack. This is the fallback: it
      deals a stack ({{ hackathon.layers.join(", ") }}) and a problem to every team that hasn't picked yet.
    </p>
    <p v-if="noProblems" class="mb-4 font-sans text-sm text-accent">
      No active problem statements: teams will get a stack but no problem.
    </p>

    <div class="flex flex-wrap items-center gap-3">
      <button
        type="button" :disabled="busy || !admin.stats.value.undrawn"
        class="cursor-pointer border-none bg-transparent p-0 disabled:cursor-not-allowed disabled:opacity-50"
        @click="draw(false)"
      >
        <Badge as="span" tone="solid" size="md" interactive arrow>
          {{ busy ? "Drawing…" : `Run draw for ${admin.stats.value.undrawn} undrawn` }}
        </Badge>
      </button>
      <button
        type="button" :disabled="busy || !admin.stats.value.teams"
        class="cursor-pointer border-none bg-transparent p-0 disabled:cursor-not-allowed disabled:opacity-50"
        @click="confirming = !confirming"
      >
        <Badge as="span" size="md" interactive class="border-accent!">Redraw all teams</Badge>
      </button>
    </div>

    <form
      v-if="confirming" class="mt-5 flex flex-wrap items-end gap-3 border border-accent p-4"
      @submit.prevent="typed === 'REDRAW' && draw(true)"
    >
      <label class="flex min-w-48 flex-1 flex-col gap-2">
        <span class="font-sans text-xs text-fg-muted">
          This wipes every team's chosen problem, stack and used change/re-roll counts, including manual overrides, and deals again with a new seed.
          Type <strong>REDRAW</strong> to confirm.
        </span>
        <input
          v-model="typed" autocomplete="off"
          class="w-full border border-border-strong bg-bg px-3.5 py-3 font-sans text-base text-fg outline-none focus:border-accent sm:text-sm"
        />
      </label>
      <button
        type="submit" :disabled="typed !== 'REDRAW' || busy"
        class="cursor-pointer border-none bg-transparent p-0 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Badge as="span" tone="solid" size="md" interactive>Redraw</Badge>
      </button>
    </form>

    <p v-if="error" class="mt-4 font-sans text-sm text-accent" role="alert">{{ error }}</p>
    <p v-if="message" class="mt-4 font-sans text-sm text-fg-muted" role="status">{{ message }}</p>
  </div>
</template>
