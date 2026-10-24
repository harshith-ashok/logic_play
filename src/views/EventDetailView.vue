<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import Badge from "../components/ui/Badge.vue";
import EventEditor from "../components/club/EventEditor.vue";
import { useIsAdmin } from "../composables/useIsAdmin";
import { setPageSeo } from "../composables/useRouteSeo";
import {
  addParticipants, deleteEvent, getEvent, listAlbums, listParticipants, removeParticipant,
} from "../lib/club/api";
import type { Album, ClubEvent, Participant } from "../lib/club/types";

const route = useRoute();
const router = useRouter();
const isAdmin = useIsAdmin();

const event = ref<ClubEvent | null>(null);
const participants = ref<Participant[]>([]);
const albums = ref<Album[]>([]);
const loading = ref(true);
const error = ref("");

async function load() {
  loading.value = true;
  error.value = "";
  try {
    const ev = await getEvent(String(route.params.slug));
    event.value = ev;
    if (ev) {
      [participants.value, albums.value] = await Promise.all([
        listParticipants(ev.id),
        listAlbums().then((all) => all.filter((a) => a.event_id === ev.id)),
      ]);
      setPageSeo({
        title: `${ev.title} — Logic Play`,
        description: ev.summary ?? `${ev.title}, a Logic Play event at SRM.`,
        path: route.path,
        image: ev.cover_url ?? undefined,
      });
    }
  } catch (e) {
    error.value = (e as Error).message;
  } finally {
    loading.value = false;
  }
}
watch(() => route.params.slug, load, { immediate: true });

const fmt = (iso: string, o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-US", o).format(new Date(iso));
const when = computed(() => {
  const e = event.value;
  if (!e) return "";
  const start = fmt(e.starts_at, { weekday: "short", month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
  if (!e.ends_at) return start;
  const sameDay = new Date(e.starts_at).toDateString() === new Date(e.ends_at).toDateString();
  return `${start} → ${sameDay ? fmt(e.ends_at, { hour: "numeric", minute: "2-digit" }) : fmt(e.ends_at, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}`;
});
const isPast = computed(() => !!event.value && new Date(event.value.ends_at ?? event.value.starts_at).getTime() < Date.now());
const paragraphs = computed(() => (event.value?.details ?? "").split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean));

// ---- admin ----
const editing = ref(false);
const busy = ref(false);
const actionError = ref("");
const bulk = ref("");

async function act(fn: () => Promise<void>) {
  busy.value = true;
  actionError.value = "";
  try {
    await fn();
  } catch (e) {
    actionError.value = (e as Error).message;
  } finally {
    busy.value = false;
  }
}

const addPeople = () =>
  act(async () => {
    // One per line; "Name | note" adds a note like "Speaker" or "1st place".
    const rows = bulk.value
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => {
        const [name, ...rest] = l.split("|");
        return { name: name.trim().slice(0, 100), note: rest.join("|").trim().slice(0, 100) || null };
      })
      .filter((r) => r.name);
    if (!rows.length) return;
    await addParticipants(event.value!.id, rows);
    bulk.value = "";
    participants.value = await listParticipants(event.value!.id);
  });

const removeOne = (p: Participant) =>
  act(async () => {
    await removeParticipant(p.id);
    participants.value = participants.value.filter((x) => x.id !== p.id);
  });

const remove = () => {
  if (!event.value || !confirm(`Delete "${event.value.title}"? Its participant list goes with it. Albums are kept.`)) return;
  return act(async () => {
    await deleteEvent(event.value!);
    router.push("/events");
  });
};

function onSaved(saved: ClubEvent) {
  editing.value = false;
  if (saved.slug !== route.params.slug) router.replace(`/events/${saved.slug}`);
  else load();
}

const area =
  "w-full border border-border-strong bg-bg px-3.5 py-3 font-sans text-base text-fg outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-fg-subtle focus:border-accent focus:shadow-[0_0_0_3px_var(--color-accent-soft)] sm:text-sm";
</script>

<template>
  <div class="wrap py-10 md:py-16">
    <router-link to="/events" class="mono mb-8 inline-block text-fg-muted transition-colors hover:text-fg">← All events</router-link>

    <p v-if="loading" class="font-sans text-sm text-fg-muted" role="status">Loading…</p>
    <p v-else-if="error" class="font-sans text-sm text-accent" role="alert">{{ error }}</p>
    <div v-else-if="!event" class="empty-state">That event doesn't exist (or isn't published yet).</div>

    <article v-else>
      <img
        v-if="event.cover_url"
        :src="event.cover_url"
        :alt="event.title"
        width="1280"
        height="540"
        class="mb-8 aspect-[21/9] w-full border border-border object-cover"
        :class="isPast && 'grayscale'"
      />

      <div class="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] tracking-wider uppercase">
        <span v-if="event.tag" class="text-accent">{{ event.tag }}</span>
        <span v-if="isPast" class="text-fg-subtle">Past event</span>
        <span v-if="!event.published" class="border border-accent px-1.5 py-0.5 text-accent">Draft</span>
      </div>
      <h1 class="page-title max-w-[18ch]">{{ event.title }}</h1>
      <p v-if="event.summary" class="page-sub mb-8">{{ event.summary }}</p>

      <div class="mb-10 flex flex-wrap items-center gap-3">
        <Badge v-if="event.rsvp_link && !isPast" :href="event.rsvp_link" target="_blank" tone="solid" interactive arrow>RSVP</Badge>
        <template v-if="isAdmin">
          <button type="button" class="cursor-pointer border-none bg-transparent p-0" @click="editing = true">
            <Badge as="span" interactive>Edit event</Badge>
          </button>
          <router-link :to="{ path: '/gallery', query: { new: event.id } }">
            <Badge as="span" interactive>Add album</Badge>
          </router-link>
          <button type="button" :disabled="busy" class="cursor-pointer border-none bg-transparent p-0 disabled:opacity-50" @click="remove">
            <Badge as="span" interactive>Delete</Badge>
          </button>
        </template>
      </div>
      <p v-if="actionError" class="mb-6 font-sans text-sm text-accent" role="alert">{{ actionError }}</p>

      <div class="grid gap-10 lg:grid-cols-[2fr_1fr]">
        <div>
          <div v-if="paragraphs.length" class="flex max-w-[65ch] flex-col gap-4 font-sans text-[15px] leading-relaxed text-fg-muted">
            <p v-for="(p, i) in paragraphs" :key="i" class="whitespace-pre-line">{{ p }}</p>
          </div>
          <p v-else class="font-sans text-sm text-fg-subtle">Details coming soon.</p>

          <section v-if="albums.length" class="mt-12">
            <h2 class="label mb-4">Photos</h2>
            <div class="grid gap-3 sm:grid-cols-2">
              <router-link
                v-for="a in albums" :key="a.id" :to="{ path: '/gallery', query: { album: a.id } }"
                class="glass-surface group relative block aspect-4/3 overflow-hidden"
              >
                <img v-if="a.cover" :src="a.cover" :alt="a.title" loading="lazy" class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <span class="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/85 to-transparent p-4 pt-10 text-white">
                  <span class="font-display block text-base">{{ a.title }}</span>
                  <span class="mono">{{ a.count }} photos</span>
                </span>
              </router-link>
            </div>
          </section>
        </div>

        <aside class="flex flex-col gap-8">
          <dl class="glass-surface grid gap-4 p-5">
            <div>
              <dt class="label">When</dt>
              <dd class="mt-1 font-sans text-sm">{{ when }}</dd>
            </div>
            <div v-if="event.location">
              <dt class="label">Where</dt>
              <dd class="mt-1 font-sans text-sm">{{ event.location }}</dd>
            </div>
          </dl>

          <section aria-label="Participants">
            <h2 class="label mb-3">Participants ({{ participants.length }})</h2>
            <ul v-if="participants.length" class="glass-surface divide-y divide-border">
              <li v-for="p in participants" :key="p.id" class="flex items-center justify-between gap-3 px-4 py-2.5">
                <span class="min-w-0 font-sans text-sm">
                  {{ p.name }}
                  <span v-if="p.note" class="ml-2 font-mono text-[11px] tracking-wide text-accent uppercase">{{ p.note }}</span>
                </span>
                <button
                  v-if="isAdmin" type="button" :disabled="busy" :aria-label="`Remove ${p.name}`"
                  class="cursor-pointer border-none bg-transparent p-1 text-fg-subtle transition-colors hover:text-accent disabled:opacity-50"
                  @click="removeOne(p)"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6L6 18" /></svg>
                </button>
              </li>
            </ul>
            <p v-else class="font-sans text-sm text-fg-subtle">No one listed yet.</p>

            <form v-if="isAdmin" class="mt-4 grid gap-3" @submit.prevent="addPeople">
              <label for="bulk" class="sr-only">Add participants</label>
              <textarea id="bulk" v-model="bulk" rows="4" :class="area" placeholder="One name per line.&#10;Add a note with a bar: Asha K | Speaker" />
              <button type="submit" :disabled="busy || !bulk.trim()" class="cursor-pointer justify-self-start border-none bg-transparent p-0 disabled:opacity-50">
                <Badge as="span" size="sm" interactive>Add to list</Badge>
              </button>
            </form>
          </section>
        </aside>
      </div>
    </article>

    <EventEditor v-if="editing" :event="event" @close="editing = false" @saved="onSaved" />
  </div>
</template>
