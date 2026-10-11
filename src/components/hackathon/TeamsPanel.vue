<script setup lang="ts">
import { computed, ref } from "vue";
import type { useHackathonAdmin } from "../../composables/useHackathonAdmin";
import { downloadCsv, participantsCsv, teamsCsv } from "../../lib/hackathon/csv";
import Badge from "../ui/Badge.vue";
import FormField from "./FormField.vue";
import Input from "../ui/Input.vue";
import TeamRow from "./TeamRow.vue";

const props = defineProps<{ admin: ReturnType<typeof useHackathonAdmin> }>();

const query = ref("");
const drawn = ref("");
const year = ref("");
const college = ref("");

const hackathon = computed(() => props.admin.hackathon.value!);
const colleges = computed(() => {
  const set = new Set<string>();
  for (const t of props.admin.teams.value) for (const p of t.people) set.add(p.college);
  return [...set].sort((a, b) => a.localeCompare(b)).map((c) => ({ value: c, label: c }));
});

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase();
  return props.admin.teams.value.filter((t) => {
    if (drawn.value === "drawn" && !t.drawn) return false;
    if (drawn.value === "undrawn" && t.drawn) return false;
    if (year.value && !t.people.some((p) => String(p.year_of_study) === year.value)) return false;
    if (college.value && !t.people.some((p) => p.college === college.value)) return false;
    if (!q) return true;
    const hay = [t.code, t.name, ...t.people.flatMap((p) => [p.college, p.registration_number, p.full_name])];
    return hay.some((s) => s.toLowerCase().includes(q));
  });
});

const drawOptions = [
  { value: "drawn", label: "Drawn" },
  { value: "undrawn", label: "Not drawn" },
];
const yearOptions = [1, 2, 3, 4, 5].map((y) => ({ value: String(y), label: `Year ${y}` }));

const actionError = ref("");
const act = async (fn: () => Promise<unknown>) => (await props.admin.run(fn)).error;

function exportCsv(kind: "participants" | "teams") {
  const h = hackathon.value;
  const csv =
    kind === "participants"
      ? participantsCsv(filtered.value, h.layers)
      : teamsCsv(filtered.value, h.layers, h.max_team_size);
  downloadCsv(csv, kind, h);
}
</script>

<template>
  <div>
    <div class="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div class="flex flex-col gap-2 sm:col-span-2 lg:col-span-1">
        <label for="team-search" class="font-display text-xs uppercase tracking-tight text-fg-subtle">Search</label>
        <Input id="team-search" v-model="query" placeholder="Name, code, college, reg. no." />
      </div>
      <FormField id="f-drawn" v-model="drawn" label="Draw" :options="drawOptions" />
      <FormField id="f-year" v-model="year" label="Year" :options="yearOptions" />
      <FormField id="f-college" v-model="college" label="College" :options="colleges" />
    </div>

    <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
      <p class="font-sans text-xs text-fg-muted">
        Showing {{ filtered.length }} of {{ admin.teams.value.length }} teams
        <button
          v-if="query || drawn || year || college" type="button"
          class="ml-2 cursor-pointer border-none bg-transparent p-0 text-accent underline"
          @click="query = drawn = year = college = ''"
        >
          Clear filters
        </button>
      </p>
      <div class="flex gap-2">
        <button type="button" :disabled="!filtered.length" class="cursor-pointer border-none bg-transparent p-0 disabled:opacity-50" @click="exportCsv('participants')">
          <Badge as="span" size="sm" interactive>Participants CSV</Badge>
        </button>
        <button type="button" :disabled="!filtered.length" class="cursor-pointer border-none bg-transparent p-0 disabled:opacity-50" @click="exportCsv('teams')">
          <Badge as="span" size="sm" interactive>Teams CSV</Badge>
        </button>
      </div>
    </div>

    <p v-if="actionError" class="mb-4 font-sans text-sm text-accent" role="alert">{{ actionError }}</p>

    <ul v-if="filtered.length" class="flex flex-col gap-3">
      <TeamRow
        v-for="t in filtered" :key="t.id" :team="t" :layers="hackathon.layers"
        :options="admin.options.value" :problems="admin.problems.value" :act="act"
      />
    </ul>
    <p v-else class="empty-state">
      {{ admin.teams.value.length ? "No teams match these filters." : "No teams yet. Share the registration link." }}
    </p>
  </div>
</template>
