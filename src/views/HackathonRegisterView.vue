<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import Badge from "../components/ui/Badge.vue";
import GridBar from "../components/ui/GridBar.vue";
import HalftoneMark from "../components/ui/HalftoneMark.vue";
import FormField from "../components/hackathon/FormField.vue";
import PersonFields from "../components/hackathon/PersonFields.vue";
import { getRegistrationStatus, registerTeam } from "../lib/hackathon/api";
import type { PersonInput, RegistrationResult, RegistrationStatus } from "../lib/hackathon/types";
import {
  emptyPerson,
  hasErrors,
  toPayload,
  validatePeople,
  validateTeamName,
  type PersonErrors,
} from "../lib/hackathon/validation";
import { setPageSeo } from "../composables/useRouteSeo";

const route = useRoute();
const slug = computed(() => String(route.params.slug));

// ---- hackathon status ----
const loading = ref(true);
const loadError = ref("");
const status = ref<RegistrationStatus | null>(null);

// ---- form state ----
const step = ref<1 | 2>(1);
const teamName = ref("");
const leader = ref<PersonInput>(emptyPerson());
const members = ref<PersonInput[]>([]);
const honeypot = ref("");
const showErrors = ref(false);
const submitting = ref(false);
const submitError = ref("");
const result = ref<RegistrationResult | null>(null);

const minMembers = computed(() => Math.max(0, (status.value?.min_team_size ?? 2) - 1));
const maxMembers = computed(() => Math.max(minMembers.value, (status.value?.max_team_size ?? 3) - 1));

const storageKey = computed(() => `hackathon-registration:${slug.value}`);

function readSaved(): RegistrationResult | null {
  try {
    return JSON.parse(localStorage.getItem(storageKey.value) ?? "null");
  } catch {
    return null;
  }
}

function save(r: RegistrationResult) {
  try {
    localStorage.setItem(storageKey.value, JSON.stringify(r));
  } catch {
    /* private mode: the code is still on screen */
  }
}

async function load() {
  loading.value = true;
  loadError.value = "";
  try {
    status.value = await getRegistrationStatus(slug.value);
    if (status.value) {
      members.value = Array.from({ length: minMembers.value }, emptyPerson);
      setPageSeo({
        title: `${status.value.name} — Register — Logic Play`,
        description: status.value.description ?? `Register your team for ${status.value.name}.`,
        path: route.path,
        noindex: true,
      });
    }
    // A refresh after registering shows the code again instead of the form.
    result.value = readSaved();
  } catch (e) {
    loadError.value = (e as Error).message;
  } finally {
    loading.value = false;
  }
}

onMounted(load);
watch(slug, load);

// ---- validation ----
const nameError = computed(() => validateTeamName(teamName.value));
const personErrors = computed<PersonErrors[]>(() => validatePeople([leader.value, ...members.value]));
const leaderErrors = computed(() => personErrors.value[0]);
const memberErrors = computed(() => personErrors.value.slice(1));
const leaderValid = computed(() => !nameError.value && !hasErrors(leaderErrors.value));
const membersValid = computed(() => memberErrors.value.every((e) => !hasErrors(e)));

const noErrors: PersonErrors = {};
const shown = <T,>(value: T, empty: T) => (showErrors.value ? value : empty);

function next() {
  showErrors.value = true;
  if (!leaderValid.value) return;
  showErrors.value = false;
  step.value = 2;
  window.scrollTo({ top: 0 });
}

function back() {
  step.value = 1;
  showErrors.value = false;
}

function addMember() {
  if (members.value.length < maxMembers.value) members.value.push(emptyPerson());
}

function removeMember(i: number) {
  if (members.value.length > minMembers.value) members.value.splice(i, 1);
}

async function submit() {
  showErrors.value = true;
  submitError.value = "";
  if (!leaderValid.value) {
    step.value = 1;
    return;
  }
  if (!membersValid.value) return;

  // Bots fill hidden fields; pretend it worked and never call the API.
  if (honeypot.value) {
    result.value = { team_code: String(100 + Math.floor(Math.random() * 900)), team_name: teamName.value, whatsapp_link: null };
    return;
  }

  submitting.value = true;
  try {
    const res = await registerTeam(
      slug.value,
      teamName.value.trim(),
      toPayload(leader.value),
      members.value.map(toPayload),
    );
    result.value = res;
    save(res);
    // Don't keep phone numbers in memory longer than needed.
    leader.value = emptyPerson();
    members.value = [];
    window.scrollTo({ top: 0 });
  } catch (e) {
    submitError.value = (e as Error).message;
  } finally {
    submitting.value = false;
  }
}

const whatsappLink = computed(() => {
  const link = result.value?.whatsapp_link?.trim();
  return link && /^https?:\/\//i.test(link) && !link.includes("REPLACE_ME") ? link : null;
});

const sizeLabel = computed(() => {
  const s = status.value;
  if (!s) return "";
  return s.min_team_size === s.max_team_size ? `${s.max_team_size} people` : `${s.min_team_size}-${s.max_team_size} people`;
});

const steps = [
  { n: 1, label: "Team leader" },
  { n: 2, label: "Members & review" },
] as const;

// Form-wide structure used by the review summary.
const review = computed(() => [leader.value, ...members.value]);
const announce = computed(() => `Step ${step.value} of 2: ${steps[step.value - 1].label}`);
</script>

<template>
  <div class="wrap py-10 md:py-16">
    <div class="mx-auto max-w-2xl">
      <p v-if="loading" class="font-sans text-sm text-fg-muted" role="status">Loading…</p>

      <div v-else-if="loadError" class="glass-surface px-6 py-10 text-center">
        <p class="font-sans text-sm text-accent" role="alert">{{ loadError }}</p>
        <button type="button" class="mt-4 cursor-pointer border-none bg-transparent p-0" @click="load">
          <Badge as="span" size="sm" interactive>Retry</Badge>
        </button>
      </div>

      <div v-else-if="!status" class="glass-surface px-6 py-12 text-center">
        <h1 class="font-display text-xl uppercase tracking-tight">Hackathon not found</h1>
        <p class="mt-2 font-sans text-sm text-fg-muted">Check the link you were given.</p>
        <Badge to="/events" size="sm" interactive arrow class="mt-6">See events</Badge>
      </div>

      <template v-else>
        <h1 class="page-title mb-4">{{ status.name }}</h1>
        <p class="page-sub mb-10">
          {{ status.description ?? "Register your team." }}
          <span v-if="!result"> Teams of {{ sizeLabel }}, including the leader.</span>
        </p>

        <!-- Success -->
        <div
          v-if="result"
          class="glass-surface relative flex flex-col items-center gap-4 overflow-hidden px-6 py-14 text-center sm:px-10"
          role="status"
        >
          <HalftoneMark :size="40" color="var(--color-accent)" />
          <h2 class="font-display text-xl uppercase tracking-tight sm:text-2xl">You're in, {{ result.team_name }}</h2>
          <p class="font-sans text-sm text-fg-muted">Save this code. You'll need it at the event.</p>
          <p
            class="border border-accent px-8 py-4 font-display text-6xl font-black tracking-widest sm:text-7xl"
            aria-label="Your team code"
          >
            {{ result.team_code }}
          </p>
          <a v-if="whatsappLink" :href="whatsappLink" target="_blank" rel="noopener noreferrer" class="mt-2">
            <Badge as="span" tone="solid" size="lg" interactive arrow>Join the WhatsApp group</Badge>
          </a>
          <p v-else class="font-sans text-xs text-fg-subtle">The WhatsApp group link will be shared soon.</p>
          <Badge :to="`/stack-roulette/${slug}`" size="md" interactive arrow>Stack Roulette</Badge>
        </div>

        <!-- Closed -->
        <div v-else-if="!status.open" class="glass-surface px-6 py-14 text-center">
          <h2 class="font-display text-xl uppercase tracking-tight">Registration closed</h2>
          <p class="mt-2 font-sans text-sm text-fg-muted">
            Either registration has ended or all team slots are taken.
          </p>
        </div>

        <!-- Form -->
        <form v-else class="glass-surface relative overflow-hidden px-6 py-8 sm:px-10 sm:py-10" novalidate @submit.prevent="step === 1 ? next() : submit()">
          <ol class="mb-8 flex gap-2" aria-label="Progress">
            <li
              v-for="s in steps"
              :key="s.n"
              class="flex-1 border-t-2 pt-2 font-mono text-[11px] uppercase tracking-wide"
              :class="s.n <= step ? 'border-accent text-fg' : 'border-border text-fg-subtle'"
              :aria-current="s.n === step ? 'step' : undefined"
            >
              0{{ s.n }} / {{ s.label }}
            </li>
          </ol>
          <p class="sr-only" aria-live="polite">{{ announce }}</p>

          <!-- Honeypot: off-screen, not focusable, ignored by assistive tech. -->
          <div class="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
            <label>Website <input v-model="honeypot" type="text" name="website" tabindex="-1" autocomplete="off" /></label>
          </div>

          <!-- Step 1 -->
          <div v-show="step === 1" class="grid gap-6">
            <FormField
              id="team-name" v-model="teamName" label="Team name" autocomplete="off" :maxlength="50"
              :error="shown(nameError, undefined)"
            />
            <h2 class="font-display text-sm uppercase tracking-tight">Team leader</h2>
            <PersonFields v-model="leader" :errors="shown(leaderErrors, noErrors)" id-prefix="leader" />
          </div>

          <!-- Step 2 -->
          <div v-show="step === 2" class="grid gap-8">
            <section v-for="(_, i) in members" :key="i" :aria-label="`Member ${i + 2}`">
              <div class="mb-4 flex items-center justify-between">
                <h2 class="font-display text-sm uppercase tracking-tight">Member {{ i + 2 }}</h2>
                <button
                  v-if="members.length > minMembers" type="button"
                  class="cursor-pointer border-none bg-transparent p-0" @click="removeMember(i)"
                >
                  <Badge as="span" size="sm" interactive class="border-accent!">Remove</Badge>
                </button>
              </div>
              <PersonFields
                v-model="members[i]" :errors="shown(memberErrors[i] ?? noErrors, noErrors)" :id-prefix="`member-${i}`"
              />
            </section>

            <button
              v-if="members.length < maxMembers" type="button" class="cursor-pointer justify-self-start border-none bg-transparent p-0"
              @click="addMember"
            >
              <Badge as="span" size="sm" interactive>+ Add member</Badge>
            </button>

            <section class="border-t border-border pt-6" aria-label="Review">
              <h2 class="mb-3 font-display text-sm uppercase tracking-tight">Review</h2>
              <p class="mb-3 font-sans text-sm">Team <strong>{{ teamName.trim() }}</strong></p>
              <ul class="divide-y divide-border border border-border font-sans text-sm">
                <li v-for="(p, i) in review" :key="i" class="flex flex-wrap justify-between gap-2 px-4 py-3">
                  <span>{{ p.full_name.trim() || "—" }} <span class="text-fg-subtle">· {{ i === 0 ? "Leader" : "Member" }}</span></span>
                  <span class="text-fg-muted">{{ p.registration_number.trim().toUpperCase() || "—" }}</span>
                </li>
              </ul>
            </section>
          </div>

          <p v-if="submitError" class="mt-6 font-sans text-sm text-accent" role="alert">{{ submitError }}</p>
          <p v-if="showErrors && step === 2 && !membersValid" class="mt-6 font-sans text-sm text-accent" role="alert">
            Fix the highlighted fields to continue.
          </p>

          <div class="mt-8 flex items-center justify-between gap-4">
            <button v-if="step === 2" type="button" class="cursor-pointer border-none bg-transparent p-0" @click="back">
              <Badge as="span" size="md" interactive>Back</Badge>
            </button>
            <span v-else />
            <button
              type="submit" :disabled="submitting"
              class="cursor-pointer border-none bg-transparent p-0 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Badge as="span" tone="solid" size="md" interactive arrow>
                {{ step === 1 ? "Next" : submitting ? "Registering…" : "Register team" }}
              </Badge>
            </button>
          </div>
        </form>
      </template>
    </div>
    <GridBar class="mt-24" />
  </div>
</template>
