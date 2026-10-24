<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import Badge from "../ui/Badge.vue";
import ModalShell from "./ModalShell.vue";
import { addPhotos, deleteAlbum, deletePhoto, listPhotos } from "../../lib/club/api";
import { formatDate } from "../../utils/date";
import { useIsAdmin } from "../../composables/useIsAdmin";
import type { Album, Photo } from "../../lib/club/types";

const props = defineProps<{ album: Album; eventSlug?: string }>();
const emit = defineEmits<{ close: []; edit: []; changed: []; deleted: [] }>();

const isAdmin = useIsAdmin();
const photos = ref<Photo[]>([]);
const loading = ref(true);
const error = ref("");
const busy = ref(false);
const progress = ref("");

async function load() {
  try {
    photos.value = await listPhotos(props.album.id);
    error.value = "";
  } catch (e) {
    error.value = (e as Error).message;
  } finally {
    loading.value = false;
  }
}
onMounted(load);

// ---- big viewer (inside the popup) ----
const current = ref<number | null>(null);
const photo = computed(() => (current.value === null ? null : (photos.value[current.value] ?? null)));
const step = (d: number) => {
  if (current.value === null || !photos.value.length) return;
  current.value = (current.value + d + photos.value.length) % photos.value.length;
};
function onKey(e: KeyboardEvent) {
  if (current.value === null) return;
  if (e.key === "ArrowLeft") step(-1);
  else if (e.key === "ArrowRight") step(1);
  else if (e.key === "Escape") {
    e.stopPropagation();
    current.value = null;
  }
}
// Capture phase so Escape closes the viewer before the modal.
onMounted(() => document.addEventListener("keydown", onKey, true));
onBeforeUnmount(() => document.removeEventListener("keydown", onKey, true));

let touchX = 0;
const onTouchStart = (e: TouchEvent) => (touchX = e.touches[0].clientX);
const onTouchEnd = (e: TouchEvent) => {
  const dx = e.changedTouches[0].clientX - touchX;
  if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
};

// ---- admin ----
async function onFiles(e: Event) {
  const input = e.target as HTMLInputElement;
  const files = [...(input.files ?? [])];
  input.value = "";
  if (!files.length) return;
  busy.value = true;
  error.value = "";
  try {
    await addPhotos(props.album.id, files, (n) => (progress.value = `Uploading ${n}/${files.length}…`));
  } catch (err) {
    error.value = (err as Error).message;
  } finally {
    progress.value = "";
    busy.value = false;
    await load();
    emit("changed");
  }
}

async function removePhoto(p: Photo) {
  if (!confirm("Delete this photo?")) return;
  busy.value = true;
  try {
    await deletePhoto(p);
    photos.value = photos.value.filter((x) => x.id !== p.id);
    emit("changed");
  } catch (err) {
    error.value = (err as Error).message;
  } finally {
    busy.value = false;
  }
}

async function removeAlbum() {
  if (!confirm(`Delete the album "${props.album.title}" and all ${photos.value.length} photos?`)) return;
  busy.value = true;
  try {
    await deleteAlbum(props.album.id);
    emit("deleted");
  } catch (err) {
    error.value = (err as Error).message;
    busy.value = false;
  }
}
</script>

<template>
  <ModalShell :title="album.title" wide @close="emit('close')">
    <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div class="mono flex flex-wrap gap-x-4 gap-y-1 text-fg-subtle">
        <span v-if="album.album_date">{{ formatDate(album.album_date) }}</span>
        <span>{{ photos.length }} photos</span>
        <router-link v-if="eventSlug" :to="`/events/${eventSlug}`" class="text-accent hover:underline">Event page →</router-link>
      </div>
      <div v-if="isAdmin" class="flex flex-wrap gap-2">
        <label class="cursor-pointer">
          <input type="file" accept="image/*" multiple class="sr-only" :disabled="busy" @change="onFiles" />
          <Badge as="span" size="sm" interactive>{{ progress || "Add photos" }}</Badge>
        </label>
        <button type="button" class="cursor-pointer border-none bg-transparent p-0" @click="emit('edit')">
          <Badge as="span" size="sm" interactive>Edit album</Badge>
        </button>
        <button type="button" :disabled="busy" class="cursor-pointer border-none bg-transparent p-0 disabled:opacity-50" @click="removeAlbum">
          <Badge as="span" size="sm" interactive>Delete album</Badge>
        </button>
      </div>
    </div>

    <p v-if="error" class="mb-4 font-sans text-sm text-accent" role="alert">{{ error }}</p>
    <p v-if="loading" class="font-sans text-sm text-fg-muted" role="status">Loading…</p>
    <div v-else-if="!photos.length" class="empty-state">No photos in this album yet.</div>

    <div v-else class="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4">
      <div v-for="(p, i) in photos" :key="p.id" class="group relative aspect-square overflow-hidden border border-border">
        <button type="button" class="block h-full w-full cursor-pointer border-none bg-transparent p-0" :aria-label="`Open photo ${i + 1}`" @click="current = i">
          <img :src="p.url" :alt="p.caption ?? `${album.title}, photo ${i + 1}`" loading="lazy" decoding="async" class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        </button>
        <button
          v-if="isAdmin" type="button" :disabled="busy" aria-label="Delete photo"
          class="absolute top-1.5 right-1.5 grid h-7 w-7 cursor-pointer place-items-center border border-border-strong bg-black/70 text-white opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
          @click="removePhoto(p)"
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
      </div>
    </div>

    <!-- Big viewer -->
    <div
      v-if="photo"
      class="fixed inset-0 z-130 flex items-center justify-center bg-black/95 p-4"
      role="dialog" aria-modal="true" aria-label="Photo viewer"
      @click.self="current = null" @touchstart.passive="onTouchStart" @touchend.passive="onTouchEnd"
    >
      <button type="button" class="absolute top-4 right-4 grid h-11 w-11 cursor-pointer place-items-center border border-border-strong bg-black/60 text-white hover:border-accent" aria-label="Close photo" @click="current = null">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6L6 18" /></svg>
      </button>
      <figure class="w-full max-w-5xl">
        <img :src="photo.url" :alt="photo.caption ?? album.title" class="mx-auto max-h-[78svh] w-auto max-w-full border border-border-strong object-contain" />
        <figcaption class="mt-4 flex items-center justify-between gap-4 text-white">
          <span class="mono">{{ album.title }} · {{ (current ?? 0) + 1 }} / {{ photos.length }}</span>
          <span class="flex gap-2.5">
            <button type="button" class="grid h-11 w-11 cursor-pointer place-items-center border border-border-strong text-white hover:border-accent" aria-label="Previous" @click="step(-1)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6" /></svg>
            </button>
            <button type="button" class="grid h-11 w-11 cursor-pointer place-items-center border border-border-strong text-white hover:border-accent" aria-label="Next" @click="step(1)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6" /></svg>
            </button>
          </span>
        </figcaption>
      </figure>
    </div>
  </ModalShell>
</template>
