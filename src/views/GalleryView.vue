<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import Badge from "../components/ui/Badge.vue";
import HalftoneMark from "../components/ui/HalftoneMark.vue";
import AlbumForm from "../components/club/AlbumForm.vue";
import AlbumModal from "../components/club/AlbumModal.vue";
import { useIsAdmin } from "../composables/useIsAdmin";
import { listAlbums, listEvents } from "../lib/club/api";
import type { Album, ClubEvent } from "../lib/club/types";
import { formatDate } from "../utils/date";

const route = useRoute();
const router = useRouter();
const isAdmin = useIsAdmin();

const albums = ref<Album[]>([]);
const events = ref<ClubEvent[]>([]);
const loading = ref(true);
const error = ref("");

async function load() {
  try {
    const [a, e] = await Promise.all([listAlbums(), listEvents().catch(() => [] as ClubEvent[])]);
    albums.value = a;
    events.value = e;
    error.value = "";
  } catch (err) {
    error.value = (err as Error).message;
  } finally {
    loading.value = false;
  }
}

// The open album lives in the URL (?album=id) so a popup can be linked to.
const openId = computed(() => (typeof route.query.album === "string" ? route.query.album : null));
const open = computed(() => albums.value.find((a) => a.id === openId.value) ?? null);
const openAlbum = (id: string) => router.push({ query: { album: id } });
const closeAlbum = () => router.push({ query: {} });

// Form: new (optionally prefilled from ?new=<eventId>) or edit.
const formOpen = ref(false);
const editing = ref<Album | null>(null);
const prefill = ref<string | null>(null);

watch(
  () => [route.query.new, isAdmin.value, loading.value] as const,
  ([ev, admin, busy]) => {
    if (typeof ev === "string" && admin && !busy) {
      prefill.value = ev;
      editing.value = null;
      formOpen.value = true;
      router.replace({ query: {} });
    }
  },
  { immediate: true },
);

function newAlbum() {
  prefill.value = null;
  editing.value = null;
  formOpen.value = true;
}
function editAlbum() {
  editing.value = open.value;
  formOpen.value = true;
}
async function onSaved(id: string) {
  formOpen.value = false;
  await load();
  openAlbum(id);
}
async function onDeleted() {
  closeAlbum();
  await load();
}

onMounted(load);
</script>

<template>
  <div>
    <div class="wrap page-hero">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div class="eyebrow">RECAPS</div>
          <h1 class="page-title">Gallery</h1>
          <p class="page-sub">
            One album per event. Build sessions, hackathons, team shots — as they happen, they land here.
          </p>
        </div>
        <button v-if="isAdmin" type="button" class="cursor-pointer border-none bg-transparent p-0" @click="newAlbum">
          <Badge as="span" tone="solid" size="md" interactive arrow>New album</Badge>
        </button>
      </div>
    </div>

    <div class="wrap pb-16 md:pb-20">
      <p v-if="loading" class="font-sans text-sm text-fg-muted" role="status">Loading…</p>
      <p v-else-if="error" class="font-sans text-sm text-accent" role="alert">{{ error }}</p>

      <div v-else-if="!albums.length" class="flex flex-col items-center gap-3 border border-dashed border-border-strong px-6 py-16 text-center">
        <HalftoneMark :size="30" :opacity="0.5" color="var(--color-accent)" />
        <span class="mono text-fg-subtle">No albums yet. First recap coming soon.</span>
      </div>

      <div v-else class="grid grid-cols-1 gap-3 min-[560px]:grid-cols-2 md:grid-cols-3 md:gap-3.5">
        <button
          v-for="(a, i) in albums"
          :key="a.id"
          type="button"
          class="group relative aspect-4/3 cursor-pointer overflow-hidden border border-border bg-bg-elevated p-0 text-left transition-colors duration-300 hover:border-border-strong"
          :aria-label="`Open album ${a.title}`"
          @click="openAlbum(a.id)"
        >
          <img
            v-if="a.cover" :src="a.cover" :alt="a.title" loading="lazy" decoding="async" width="800" height="600"
            class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <span v-else class="grid h-full w-full place-items-center">
            <HalftoneMark :size="30" :opacity="0.4" color="var(--color-accent)" />
          </span>
          <span class="mono absolute top-3.5 left-3.5 text-white/80">LP · {{ String(i + 1).padStart(2, "0") }}</span>
          <span class="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-black/90 to-transparent p-4 pt-12 text-white">
            <span class="font-display block text-lg">{{ a.title }}</span>
            <span class="mono mt-1 block text-white/60">
              {{ a.count }} {{ a.count === 1 ? "photo" : "photos" }}<template v-if="a.album_date"> · {{ formatDate(a.album_date) }}</template>
            </span>
          </span>
        </button>
      </div>
    </div>

    <AlbumModal v-if="open" :key="open.id" :album="open" :event-slug="events.find((e) => e.id === open!.event_id)?.slug" @close="closeAlbum" @edit="editAlbum" @changed="load" @deleted="onDeleted" />
    <AlbumForm v-if="formOpen" :album="editing" :events="events" :prefill-event-id="prefill" @close="formOpen = false" @saved="onSaved" />
  </div>
</template>
