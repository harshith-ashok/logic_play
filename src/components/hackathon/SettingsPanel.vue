<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import type { useHackathonAdmin } from "../../composables/useHackathonAdmin";
import { deleteHackathon, updateHackathon } from "../../lib/hackathon/api";
import Badge from "../ui/Badge.vue";
import FormField from "./FormField.vue";

const props = defineProps<{ admin: ReturnType<typeof useHackathonAdmin> }>();
const emit = defineEmits<{ deleted: [] }>();

const hackathon = computed(() => props.admin.hackathon.value!);

const form = reactive({
  name: "",
  description: "",
  layers: "",
  registration_open: true,
  roulette_open: false,
  max_problem_changes: "",
  max_stack_rerolls: "",
  max_teams: "",
  min_team_size: "",
  max_team_size: "",
  whatsapp_link: "",
});

watch(
  hackathon,
  (h) => {
    form.name = h.name;
    form.description = h.description ?? "";
    form.layers = h.layers.join(", ");
    form.registration_open = h.registration_open;
    form.roulette_open = h.roulette_open;
    form.max_problem_changes = String(h.max_problem_changes);
    form.max_stack_rerolls = String(h.max_stack_rerolls);
    form.max_teams = String(h.max_teams);
    form.min_team_size = String(h.min_team_size);
    form.max_team_size = String(h.max_team_size);
    form.whatsapp_link = h.whatsapp_link ?? "";
  },
  { immediate: true },
);

const busy = ref(false);
const error = ref("");
const saved = ref(false);

async function save() {
  error.value = "";
  saved.value = false;
  const layers = [...new Set(form.layers.split(",").map((l) => l.trim().toLowerCase()).filter(Boolean))];
  const maxTeams = Number(form.max_teams);
  const min = Number(form.min_team_size);
  const max = Number(form.max_team_size);
  const link = form.whatsapp_link.trim();
  const problemChanges = Number(form.max_problem_changes);
  const stackRerolls = Number(form.max_stack_rerolls);

  if (form.name.trim().length < 2) return (error.value = "Enter a hackathon name.");
  if (!layers.length || layers.length > 6) return (error.value = "Enter 1 to 6 layers, separated by commas.");
  if (!Number.isInteger(maxTeams) || maxTeams < 1 || maxTeams > 900) return (error.value = "Max teams must be 1 to 900.");
  if (!Number.isInteger(min) || !Number.isInteger(max) || min < 1 || max < min || max > 10)
    return (error.value = "Team sizes must satisfy 1 ≤ min ≤ max ≤ 10.");
  if (![problemChanges, stackRerolls].every((n) => Number.isInteger(n) && n >= 0 && n <= 10))
    return (error.value = "Roulette change limits must be whole numbers from 0 to 10.");
  if (link && !/^https?:\/\//i.test(link)) return (error.value = "WhatsApp link must start with http:// or https://.");

  busy.value = true;
  const { error: err } = await props.admin.run(() =>
    updateHackathon(hackathon.value.id, {
      name: form.name.trim(),
      description: form.description.trim() || null,
      layers,
      registration_open: form.registration_open,
      roulette_open: form.roulette_open,
      max_problem_changes: problemChanges,
      max_stack_rerolls: stackRerolls,
      max_teams: maxTeams,
      min_team_size: min,
      max_team_size: max,
      whatsapp_link: link || null,
    }),
  );
  busy.value = false;
  error.value = err;
  saved.value = !err;
}

async function remove() {
  const h = hackathon.value;
  const typed = prompt(`This deletes "${h.name}" with all its teams, participants and options.\nType the slug (${h.slug}) to confirm.`);
  if (typed !== h.slug) return;
  try {
    await deleteHackathon(h.id);
    emit("deleted");
  } catch (e) {
    error.value = (e as Error).message;
  }
}
</script>

<template>
  <form class="glass-surface px-6 py-8" novalidate @submit.prevent="save">
    <div class="grid gap-5 sm:grid-cols-2">
      <FormField id="s-name" v-model="form.name" label="Name" />
      <FormField id="s-layers" v-model="form.layers" label="Stack layers" hint="Comma-separated, e.g. frontend, backend, database" />
      <div class="sm:col-span-2">
        <FormField id="s-desc" v-model="form.description" label="Description (shown on the registration page)" />
      </div>
      <FormField id="s-max" v-model="form.max_teams" label="Max teams" type="number" inputmode="numeric" />
      <FormField id="s-wa" v-model="form.whatsapp_link" label="WhatsApp group link" type="url" placeholder="https://chat.whatsapp.com/…" />
      <FormField id="s-min" v-model="form.min_team_size" label="Min team size (incl. leader)" type="number" inputmode="numeric" />
      <FormField id="s-maxsize" v-model="form.max_team_size" label="Max team size (incl. leader)" type="number" inputmode="numeric" />
      <label class="flex items-center gap-2 font-sans text-sm sm:col-span-2">
        <input v-model="form.registration_open" type="checkbox" />
        Registration open
      </label>
      <FormField
        id="s-pchg" v-model="form.max_problem_changes" label="Problem changes per team" type="number" inputmode="numeric"
        hint="After the first pick; each change also re-deals the stack"
      />
      <FormField
        id="s-sroll" v-model="form.max_stack_rerolls" label="Stack re-rolls per team" type="number" inputmode="numeric"
        hint="Re-rolls only the stack, keeps the problem"
      />
      <label class="flex items-center gap-2 font-sans text-sm sm:col-span-2">
        <input v-model="form.roulette_open" type="checkbox" />
        Stack Roulette open (teams can pick a problem and draw their stack)
      </label>
    </div>

    <p v-if="error" class="mt-6 font-sans text-sm text-accent" role="alert">{{ error }}</p>
    <p v-if="saved" class="mt-6 font-sans text-sm text-fg-muted" role="status">Saved.</p>

    <div class="mt-8 flex flex-wrap items-center justify-between gap-4">
      <button type="button" class="cursor-pointer border-none bg-transparent p-0" @click="remove">
        <Badge as="span" size="sm" interactive class="border-accent!">Delete hackathon</Badge>
      </button>
      <button type="submit" :disabled="busy" class="cursor-pointer border-none bg-transparent p-0 disabled:opacity-50">
        <Badge as="span" tone="solid" size="md" interactive arrow>{{ busy ? "Saving…" : "Save settings" }}</Badge>
      </button>
    </div>
  </form>
</template>
