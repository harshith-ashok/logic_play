<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import type { useHackathonAdmin } from "../../composables/useHackathonAdmin";
import { deleteOption, deleteProblem, saveOption, saveProblem } from "../../lib/hackathon/api";
import Badge from "../ui/Badge.vue";
import Input from "../ui/Input.vue";

const props = defineProps<{ admin: ReturnType<typeof useHackathonAdmin> }>();

const hackathon = computed(() => props.admin.hackathon.value!);
const error = ref("");

// Local edits keyed by row id; fall back to the stored row until touched.
const optionEdits = reactive<Record<number, { name: string; weight: string; is_hard: boolean; active: boolean }>>({});
const problemEdits = reactive<Record<number, { title: string; gist: string; active: boolean }>>({});

const optionDraft = (o: (typeof props.admin.options.value)[number]) =>
  (optionEdits[o.id] ??= { name: o.name, weight: String(o.weight), is_hard: o.is_hard, active: o.active });
const problemDraft = (p: (typeof props.admin.problems.value)[number]) =>
  (problemEdits[p.id] ??= { title: p.title, gist: p.gist ?? "", active: p.active });

const optionsByLayer = computed(() => {
  const layers = [...new Set([...hackathon.value.layers, ...props.admin.options.value.map((o) => o.layer)])];
  return layers.map((layer) => ({ layer, items: props.admin.options.value.filter((o) => o.layer === layer) }));
});

async function exec(fn: () => Promise<unknown>) {
  error.value = (await props.admin.run(fn)).error;
  return !error.value;
}

function parseWeight(raw: string): number | null {
  const w = Number(raw);
  if (!Number.isInteger(w) || w < 0) {
    error.value = "Weight must be a whole number, 0 or more.";
    return null;
  }
  return w;
}

async function updateOption(id: number, layer: string) {
  const d = optionEdits[id];
  const weight = parseWeight(d.weight);
  if (weight === null) return;
  if (!d.name.trim()) return (error.value = "Option name is required.");
  await exec(() => saveOption(hackathon.value.id, { id, layer, name: d.name.trim(), weight, is_hard: d.is_hard, active: d.active }));
}

async function removeOption(id: number, name: string) {
  if (!confirm(`Delete "${name}"? Teams that were dealt it lose that layer's assignment. Disable it instead to keep history.`)) return;
  delete optionEdits[id];
  await exec(() => deleteOption(id));
}

const newOption = reactive({ layer: "", name: "", weight: "2", is_hard: false });
async function addOption() {
  const weight = parseWeight(newOption.weight);
  if (weight === null) return;
  const layer = newOption.layer || hackathon.value.layers[0];
  if (!newOption.name.trim()) return (error.value = "Option name is required.");
  if (await exec(() => saveOption(hackathon.value.id, { layer, name: newOption.name.trim(), weight, is_hard: newOption.is_hard, active: true })))
    newOption.name = "";
}

async function updateProblem(id: number) {
  const d = problemEdits[id];
  if (!d.title.trim()) return (error.value = "Problem title is required.");
  await exec(() => saveProblem(hackathon.value.id, { id, title: d.title.trim(), gist: d.gist.trim() || null, active: d.active }));
}

async function removeProblem(id: number, title: string) {
  if (!confirm(`Delete "${title}"? Teams that had it are left without a problem.`)) return;
  delete problemEdits[id];
  await exec(() => deleteProblem(id));
}

const newProblem = reactive({ title: "", gist: "" });
async function addProblem() {
  if (!newProblem.title.trim()) return (error.value = "Problem title is required.");
  if (await exec(() => saveProblem(hackathon.value.id, { title: newProblem.title.trim(), gist: newProblem.gist.trim() || null, active: true }))) {
    newProblem.title = "";
    newProblem.gist = "";
  }
}

const smallInput =
  "border border-border-strong bg-bg px-2.5 py-2 font-sans text-base text-fg outline-none focus:border-accent sm:text-sm";
</script>

<template>
  <div class="grid gap-10">
    <p v-if="error" class="font-sans text-sm text-accent" role="alert">{{ error }}</p>

    <section v-for="group in optionsByLayer" :key="group.layer" :aria-label="`${group.layer} options`">
      <h3 class="mb-3 font-display text-xs uppercase tracking-tight text-fg-subtle">{{ group.layer }}</h3>
      <ul class="glass-surface divide-y divide-border">
        <li v-for="o in group.items" :key="o.id" class="flex flex-wrap items-center gap-3 px-4 py-3">
          <input v-model="optionDraft(o).name" :class="[smallInput, 'min-w-40 flex-1']" :aria-label="`Name of ${o.name}`" />
          <label class="flex items-center gap-2 font-sans text-xs text-fg-muted">
            Weight
            <input v-model="optionDraft(o).weight" type="number" min="0" inputmode="numeric" :class="[smallInput, 'w-20']" />
          </label>
          <label class="flex items-center gap-1.5 font-sans text-xs text-fg-muted"><input v-model="optionDraft(o).is_hard" type="checkbox" /> Hard</label>
          <label class="flex items-center gap-1.5 font-sans text-xs text-fg-muted"><input v-model="optionDraft(o).active" type="checkbox" /> Active</label>
          <button type="button" class="cursor-pointer border-none bg-transparent p-0" @click="updateOption(o.id, o.layer)">
            <Badge as="span" size="sm" interactive>Save</Badge>
          </button>
          <button type="button" class="cursor-pointer border-none bg-transparent p-0" @click="removeOption(o.id, o.name)">
            <Badge as="span" size="sm" interactive class="border-accent!">Delete</Badge>
          </button>
        </li>
        <li v-if="!group.items.length" class="px-4 py-3 font-sans text-sm text-fg-muted">No options yet.</li>
      </ul>
    </section>

    <form class="glass-surface flex flex-wrap items-end gap-3 px-4 py-4" @submit.prevent="addOption">
      <label class="flex flex-col gap-1 font-sans text-xs text-fg-muted">
        Layer
        <select v-model="newOption.layer" :class="smallInput">
          <option v-for="l in hackathon.layers" :key="l" :value="l">{{ l }}</option>
        </select>
      </label>
      <label class="flex min-w-40 flex-1 flex-col gap-1 font-sans text-xs text-fg-muted">
        New option
        <input v-model="newOption.name" :class="smallInput" placeholder="e.g. Svelte" />
      </label>
      <label class="flex flex-col gap-1 font-sans text-xs text-fg-muted">
        Weight
        <input v-model="newOption.weight" type="number" min="0" :class="[smallInput, 'w-20']" />
      </label>
      <label class="flex items-center gap-1.5 pb-2 font-sans text-xs text-fg-muted"><input v-model="newOption.is_hard" type="checkbox" /> Hard</label>
      <button type="submit" class="cursor-pointer border-none bg-transparent p-0">
        <Badge as="span" tone="solid" size="sm" interactive>Add option</Badge>
      </button>
    </form>

    <section aria-label="Problem statements">
      <h3 class="mb-3 font-display text-xs uppercase tracking-tight text-fg-subtle">Problem statements</h3>
      <ul class="glass-surface divide-y divide-border">
        <li v-for="p in admin.problems.value" :key="p.id" class="flex flex-wrap items-center gap-3 px-4 py-3">
          <input v-model="problemDraft(p).title" :class="[smallInput, 'min-w-40 flex-1']" :aria-label="`Title of ${p.title}`" />
          <input v-model="problemDraft(p).gist" :class="[smallInput, 'min-w-40 flex-[2]']" placeholder="Gist" :aria-label="`Gist of ${p.title}`" />
          <label class="flex items-center gap-1.5 font-sans text-xs text-fg-muted"><input v-model="problemDraft(p).active" type="checkbox" /> Active</label>
          <button type="button" class="cursor-pointer border-none bg-transparent p-0" @click="updateProblem(p.id)">
            <Badge as="span" size="sm" interactive>Save</Badge>
          </button>
          <button type="button" class="cursor-pointer border-none bg-transparent p-0" @click="removeProblem(p.id, p.title)">
            <Badge as="span" size="sm" interactive class="border-accent!">Delete</Badge>
          </button>
        </li>
        <li v-if="!admin.problems.value.length" class="px-4 py-3 font-sans text-sm text-fg-muted">No problem statements yet.</li>
      </ul>
      <form class="mt-3 grid gap-3 sm:grid-cols-[1fr_2fr_auto]" @submit.prevent="addProblem">
        <Input v-model="newProblem.title" placeholder="Title" />
        <Input v-model="newProblem.gist" placeholder="Gist (optional)" />
        <button type="submit" class="cursor-pointer border-none bg-transparent p-0">
          <Badge as="span" tone="solid" size="md" interactive>Add</Badge>
        </button>
      </form>
    </section>
  </div>
</template>
