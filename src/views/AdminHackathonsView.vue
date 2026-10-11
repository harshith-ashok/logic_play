<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import AccountTabs from "../components/ui/AccountTabs.vue";
import Badge from "../components/ui/Badge.vue";
import GridBar from "../components/ui/GridBar.vue";
import FormField from "../components/hackathon/FormField.vue";
import { createHackathon, listHackathons } from "../lib/hackathon/api";
import type { Hackathon } from "../lib/hackathon/types";
import { useAuth } from "../composables/useAuth";
import { formatDate } from "../utils/date";

const router = useRouter();
const { profile } = useAuth();
const allowed = computed(() => profile.value?.role === "core_team");

const hackathons = ref<Hackathon[]>([]);
const loading = ref(true);
const loadError = ref("");

async function load() {
  loading.value = true;
  loadError.value = "";
  try {
    hackathons.value = await listHackathons();
    // Default to cloning the most recent event: options and problems carry over.
    form.copyFrom ||= hackathons.value[0]?.id ?? "";
  } catch (e) {
    loadError.value = (e as Error).message;
  } finally {
    loading.value = false;
  }
}

const form = reactive({ name: "", slug: "", copyFrom: "" });
const slugTouched = ref(false);
const creating = ref(false);
const createError = ref("");

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);

function onName(value: string) {
  form.name = value;
  if (!slugTouched.value) form.slug = slugify(value);
}

function onSlug(value: string) {
  slugTouched.value = true;
  form.slug = slugify(value);
}

async function create() {
  createError.value = "";
  if (form.name.trim().length < 2) return (createError.value = "Enter a name.");
  if (!form.slug) return (createError.value = "Enter a URL slug.");
  creating.value = true;
  try {
    await createHackathon(form.slug, form.name.trim(), form.copyFrom || null);
    router.push(`/admin/hackathons/${form.slug}`);
  } catch (e) {
    createError.value = (e as Error).message;
  } finally {
    creating.value = false;
  }
}

const copyOptions = computed(() => hackathons.value.map((h) => ({ value: h.id, label: h.name })));

onMounted(load);
</script>

<template>
  <div class="wrap py-10 md:py-16">
    <div class="mx-auto max-w-4xl">
      <AccountTabs />
      <h1 class="page-title">Hackathons</h1>
      <p class="page-sub mb-10">Create an event, share its registration link, run the draw. Core team only.</p>

      <div v-if="!allowed" class="glass-surface px-6 py-12 text-center">
        <h2 class="font-display text-xl uppercase tracking-tight">Not allowed</h2>
        <p class="mt-2 font-sans text-sm text-fg-muted">This page is for the core team.</p>
      </div>

      <template v-else>
        <section class="mb-12">
          <h2 class="mb-4 font-display text-xl uppercase tracking-tight">All hackathons</h2>
          <p v-if="loading" class="font-sans text-sm text-fg-muted" role="status">Loading…</p>
          <p v-else-if="loadError" class="font-sans text-sm text-accent" role="alert">{{ loadError }}</p>
          <ul v-else-if="hackathons.length" class="glass-surface divide-y divide-border">
            <li v-for="h in hackathons" :key="h.id">
              <router-link
                :to="`/admin/hackathons/${h.slug}`"
                class="flex flex-wrap items-center justify-between gap-2 px-5 py-4 text-fg hover:bg-glass-hover"
              >
                <span class="font-display text-sm uppercase tracking-tight">{{ h.name }}</span>
                <span class="font-sans text-xs text-fg-muted">
                  {{ h.registration_open ? "Open" : "Closed" }} · cap {{ h.max_teams }} · {{ formatDate(h.created_at) }}
                </span>
              </router-link>
            </li>
          </ul>
          <p v-else class="empty-state">No hackathons yet. Create the first one below.</p>
        </section>

        <section>
          <h2 class="mb-4 font-display text-xl uppercase tracking-tight">New hackathon</h2>
          <form class="glass-surface px-6 py-8" novalidate @submit.prevent="create">
            <div class="grid gap-5 sm:grid-cols-2">
              <FormField id="h-name" :model-value="form.name" label="Name" @update:model-value="onName" />
              <FormField
                id="h-slug" :model-value="form.slug" label="URL slug"
                :hint="form.slug ? `/hackathon/${form.slug}/register` : 'Used in the registration link'"
                @update:model-value="onSlug"
              />
              <div class="sm:col-span-2">
                <FormField
                  v-if="hackathons.length" id="h-copy" v-model="form.copyFrom" label="Copy options & problems from"
                  :options="copyOptions"
                />
              </div>
            </div>
            <p v-if="createError" class="mt-6 font-sans text-sm text-accent" role="alert">{{ createError }}</p>
            <div class="mt-8 flex justify-end">
              <button type="submit" :disabled="creating" class="cursor-pointer border-none bg-transparent p-0 disabled:opacity-50">
                <Badge as="span" tone="solid" size="md" interactive arrow>{{ creating ? "Creating…" : "Create hackathon" }}</Badge>
              </button>
            </div>
          </form>
        </section>
      </template>
    </div>
    <GridBar class="mt-24" />
  </div>
</template>
