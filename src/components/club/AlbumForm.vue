<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import Badge from "../ui/Badge.vue";
import FormField from "../hackathon/FormField.vue";
import ModalShell from "./ModalShell.vue";
import { addPhotos, createAlbum, updateAlbum } from "../../lib/club/api";
import type { Album, ClubEvent } from "../../lib/club/types";

const props = defineProps<{ album: Album | null; events: ClubEvent[]; prefillEventId?: string | null }>();
const emit = defineEmits<{ close: []; saved: [albumId: string] }>();

const eventOf = (id: string) => props.events.find((e) => e.id === id);
const pre = props.album?.event_id ?? props.prefillEventId ?? "";

const f = reactive({
  event_id: pre,
  title: props.album?.title ?? eventOf(pre)?.title ?? "",
  album_date: props.album?.album_date ?? (eventOf(pre) ? eventOf(pre)!.starts_at.slice(0, 10) : ""),
});
const files = ref<File[]>([]);
const saving = ref(false);
const done = ref(0);
const error = ref("");

const eventOptions = computed(() => [
  { value: "", label: "None (standalone album)" },
  ...[...props.events]
    .sort((a, b) => +new Date(b.starts_at) - +new Date(a.starts_at))
    .map((e) => ({ value: e.id, label: e.title })),
]);

// Album named after the event: picking one fills the title and date unless you typed your own.
function pickEvent(id: string) {
  const prev = eventOf(f.event_id);
  f.event_id = id;
  const ev = eventOf(id);
  if (ev && (!f.title.trim() || f.title === prev?.title)) f.title = ev.title;
  if (ev && !f.album_date) f.album_date = ev.starts_at.slice(0, 10);
}

function pickFiles(e: Event) {
  files.value = [...((e.target as HTMLInputElement).files ?? [])];
}

async function submit() {
  error.value = "";
  const title = f.title.trim();
  if (title.length < 2) return (error.value = "Give the album a name.");
  saving.value = true;
  try {
    const patch = { title, event_id: f.event_id || null, album_date: f.album_date || null };
    let id = props.album?.id;
    if (id) await updateAlbum(id, patch);
    else id = (await createAlbum(title, patch.event_id, patch.album_date)).id;
    if (files.value.length) await addPhotos(id, files.value, (n) => (done.value = n));
    emit("saved", id);
  } catch (e) {
    error.value = (e as Error).message;
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <ModalShell :title="album ? 'Edit album' : 'New album'" @close="emit('close')">
    <form class="grid gap-5" novalidate @submit.prevent="submit">
      <FormField
        id="al-event" :model-value="f.event_id" label="Event" :options="eventOptions"
        hint="Albums take their name from the event they cover." @update:model-value="pickEvent"
      />
      <div class="grid gap-5 sm:grid-cols-2">
        <FormField id="al-title" v-model="f.title" label="Album name" :maxlength="120" placeholder="Hack Night 01" />
        <FormField id="al-date" v-model="f.album_date" type="date" label="Date (optional)" />
      </div>
      <div class="flex flex-col gap-2">
        <span class="font-display text-xs uppercase tracking-tight text-fg-subtle">{{ album ? "Add photos" : "Photos" }}</span>
        <label class="cursor-pointer">
          <input type="file" accept="image/*" multiple class="sr-only" @change="pickFiles" />
          <Badge as="span" size="sm" interactive>{{ files.length ? `${files.length} selected` : "Choose images" }}</Badge>
        </label>
        <p class="font-sans text-xs text-fg-subtle">Resized in your browser before upload, so big phone photos are fine.</p>
      </div>

      <p v-if="error" class="font-sans text-sm text-accent" role="alert">{{ error }}</p>
      <div class="flex items-center justify-end gap-3">
        <button type="button" class="cursor-pointer border-none bg-transparent p-0" :disabled="saving" @click="emit('close')">
          <Badge as="span" size="md" interactive>Cancel</Badge>
        </button>
        <button type="submit" :disabled="saving" class="cursor-pointer border-none bg-transparent p-0 disabled:opacity-50">
          <Badge as="span" tone="solid" size="md" interactive arrow>
            {{ saving ? (files.length ? `Uploading ${done}/${files.length}…` : "Saving…") : album ? "Save album" : "Create album" }}
          </Badge>
        </button>
      </div>
    </form>
  </ModalShell>
</template>
