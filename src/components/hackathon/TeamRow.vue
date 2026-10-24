<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import {
  deleteParticipant,
  deleteTeam,
  setTeamProblem,
  setTeamStack,
  updateParticipant,
  updateTeamName,
} from "../../lib/hackathon/api";
import type { PersonInput, Problem, TechOption, Team } from "../../lib/hackathon/types";
import { hasErrors, toPayload, validatePerson, validateTeamName, type PersonErrors } from "../../lib/hackathon/validation";
import { formatDateTime } from "../../utils/date";
import Badge from "../ui/Badge.vue";
import FormField from "./FormField.vue";
import PersonFields from "./PersonFields.vue";

const props = defineProps<{
  team: Team;
  layers: string[];
  options: TechOption[];
  problems: Problem[];
  /** Runs a mutation, reloads, resolves with an error string ("" on success). */
  act: (fn: () => Promise<unknown>) => Promise<string>;
}>();

const open = ref(false);
const error = ref("");
const teamName = ref(props.team.name);
const drafts = reactive<Record<string, PersonInput>>({});
const draftErrors = reactive<Record<string, PersonErrors>>({});

const stackSummary = computed(() => props.layers.map((l) => props.team.stack[l] ?? "—").join(" · "));
const optionsFor = (layer: string) =>
  props.options.filter((o) => o.layer === layer).map((o) => ({ value: String(o.id), label: o.name + (o.active ? "" : " (off)") }));
const problemOptions = computed(() => props.problems.map((p) => ({ value: String(p.id), label: p.title })));
const currentOptionId = (layer: string) =>
  String(props.options.find((o) => o.layer === layer && o.name === props.team.stack[layer])?.id ?? "");

function toggle() {
  open.value = !open.value;
  if (!open.value) return;
  teamName.value = props.team.name;
  for (const p of props.team.people) {
    drafts[p.participant_id] = {
      full_name: p.full_name,
      registration_number: p.registration_number,
      year_of_study: String(p.year_of_study),
      phone: p.phone,
      department: p.department,
      college: p.college,
    };
    draftErrors[p.participant_id] = {};
  }
}

async function exec(fn: () => Promise<unknown>) {
  error.value = await props.act(fn);
}

async function saveName() {
  const problem = validateTeamName(teamName.value);
  if (problem) return (error.value = problem);
  await exec(() => updateTeamName(props.team.id, teamName.value.trim()));
}

async function savePerson(id: string) {
  const errs = validatePerson(drafts[id]);
  draftErrors[id] = errs;
  if (hasErrors(errs)) return;
  await exec(() => updateParticipant(id, toPayload(drafts[id])));
}

async function removePerson(id: string, name: string) {
  if (confirm(`Remove ${name} from team ${props.team.name}?`)) await exec(() => deleteParticipant(id));
}

async function removeTeam() {
  if (confirm(`Delete team ${props.team.code} (${props.team.name}) and all its members? This can't be undone.`))
    await exec(() => deleteTeam(props.team.id));
}

const overrideStack = (layer: string, value: string) =>
  exec(() => setTeamStack(props.team.id, layer, value ? Number(value) : null));
const overrideProblem = (value: string) => exec(() => setTeamProblem(props.team.id, value ? Number(value) : null));
</script>

<template>
  <li class="glass-surface">
    <button
      type="button" class="grid w-full cursor-pointer gap-x-4 gap-y-1 border-none bg-transparent px-5 py-4 text-left text-fg md:grid-cols-[4rem_1.2fr_1fr_1.4fr_1.2fr]"
      :aria-expanded="open" @click="toggle"
    >
      <span class="font-display text-xl font-black text-accent">{{ team.code }}</span>
      <span class="min-w-0">
        <span class="block truncate font-display text-sm uppercase tracking-tight">{{ team.name }}</span>
        <span class="block truncate font-sans text-xs text-fg-muted">
          {{ team.leader?.full_name ?? "—" }} · {{ team.people.length }} member{{ team.people.length === 1 ? "" : "s" }}
        </span>
      </span>
      <span class="truncate font-sans text-xs text-fg-muted">{{ team.leader?.college ?? "—" }}</span>
      <span class="truncate font-sans text-xs">
        <template v-if="team.drawn">{{ stackSummary }}</template>
        <span v-else class="text-fg-subtle">Not drawn</span>
        <span v-if="team.problemChanges || team.stackRerolls" class="ml-2 text-accent" title="problem changes / stack re-rolls">
          ↻ P{{ team.problemChanges }} S{{ team.stackRerolls }}
        </span>
      </span>
      <span class="min-w-0 font-sans text-xs text-fg-muted">
        <span class="block truncate">{{ team.problem ?? "—" }}</span>
        <span v-if="team.githubUrl" class="block truncate text-fg">
          {{ team.githubUrl.replace(/^https:\/\/(www\.)?github\.com\//i, "") }}
        </span>
        <span class="block text-fg-subtle">{{ formatDateTime(team.registeredAt) }}</span>
      </span>
    </button>

    <div v-if="open" class="grid gap-8 border-t border-border px-5 py-6">
      <p v-if="error" class="font-sans text-sm text-accent" role="alert">{{ error }}</p>

      <section v-if="team.githubUrl" class="flex flex-wrap gap-x-6 gap-y-1 font-sans text-sm" aria-label="Submission">
        <a :href="team.githubUrl" target="_blank" rel="noopener noreferrer" class="text-fg underline">GitHub</a>
        <a v-if="team.vercelUrl" :href="team.vercelUrl" target="_blank" rel="noopener noreferrer" class="text-fg underline">Vercel</a>
      </section>

      <section class="flex flex-wrap items-end gap-3" aria-label="Team name">
        <div class="min-w-56 flex-1">
          <FormField :id="`name-${team.id}`" v-model="teamName" label="Team name" :maxlength="50" />
        </div>
        <button type="button" class="cursor-pointer border-none bg-transparent p-0" @click="saveName">
          <Badge as="span" size="sm" interactive>Save name</Badge>
        </button>
        <button type="button" class="cursor-pointer border-none bg-transparent p-0" @click="removeTeam">
          <Badge as="span" size="sm" interactive class="border-accent!">Delete team</Badge>
        </button>
      </section>

      <section v-for="p in team.people" :key="p.participant_id" :aria-label="p.full_name">
        <h3 class="mb-3 font-display text-xs uppercase tracking-tight text-fg-subtle">{{ p.role }}</h3>
        <PersonFields
          v-if="drafts[p.participant_id]" v-model="drafts[p.participant_id]"
          :errors="draftErrors[p.participant_id] ?? {}" :id-prefix="`p-${p.participant_id}`"
        />
        <div class="mt-3 flex gap-2">
          <button type="button" class="cursor-pointer border-none bg-transparent p-0" @click="savePerson(p.participant_id)">
            <Badge as="span" size="sm" interactive>Save</Badge>
          </button>
          <button
            v-if="p.role === 'member'" type="button" class="cursor-pointer border-none bg-transparent p-0"
            @click="removePerson(p.participant_id, p.full_name)"
          >
            <Badge as="span" size="sm" interactive class="border-accent!">Remove</Badge>
          </button>
        </div>
      </section>

      <section aria-label="Draw override">
        <h3 class="mb-3 font-display text-xs uppercase tracking-tight text-fg-subtle">Draw override</h3>
        <p v-if="!team.drawn" class="font-sans text-xs text-fg-subtle">Run the draw first, then adjust here.</p>
        <div v-else class="grid gap-4 sm:grid-cols-2">
          <FormField
            v-for="layer in layers" :id="`ov-${team.id}-${layer}`" :key="layer" :label="layer"
            :options="optionsFor(layer)" :model-value="currentOptionId(layer)"
            @update:model-value="overrideStack(layer, $event)"
          />
          <FormField
            :id="`ov-${team.id}-problem`" label="Problem" :options="problemOptions"
            :model-value="String(team.problemId ?? '')" @update:model-value="overrideProblem"
          />
        </div>
      </section>
    </div>
  </li>
</template>
