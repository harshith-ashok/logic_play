<script setup lang="ts">
import { reactive, ref } from "vue";
import Badge from "../ui/Badge.vue";
import FormField from "../hackathon/FormField.vue";
import ModalShell from "./ModalShell.vue";
import { pathFromUrl, removeFiles, saveEvent, uploadImage } from "../../lib/club/api";
import type { ClubEvent } from "../../lib/club/types";

const props = defineProps<{ event: ClubEvent | null }>();
const emit = defineEmits<{ close: []; saved: [ClubEvent] }>();

// <input type="datetime-local"> wants local time without a zone.
const toLocal = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
const slugify = (v: string) =>
  v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 70);

const e = props.event;
const f = reactive({
  title: e?.title ?? "",
  slug: e?.slug ?? "",
  tag: e?.tag ?? "",
  summary: e?.summary ?? "",
  details: e?.details ?? "",
  starts_at: toLocal(e?.starts_at ?? null),
  ends_at: toLocal(e?.ends_at ?? null),
  location: e?.location ?? "",
  rsvp_link: e?.rsvp_link ?? "",
  published: e?.published ?? true,
});

const cover = ref<string | null>(e?.cover_url ?? null);
const newCover = ref<{ url: string; path: string } | null>(null);
const uploading = ref(false);
const saving = ref(false);
const error = ref("");

async function pickCover(ev: Event) {
  const file = (ev.target as HTMLInputElement).files?.[0];
  if (!file) return;
  uploading.value = true;
  error.value = "";
  try {
    if (newCover.value) await removeFiles([newCover.value.path]); // replaced before saving
    newCover.value = await uploadImage(file, "events");
    cover.value = newCover.value.url;
  } catch (err) {
    error.value = (err as Error).message;
  } finally {
    uploading.value = false;
  }
}

async function submit() {
  error.value = "";
  const title = f.title.trim();
  const slug = (f.slug.trim() || slugify(title)).toLowerCase();
  if (title.length < 2) return (error.value = "Give the event a title.");
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return (error.value = "Link name can only use lowercase letters, numbers and dashes.");
  if (!f.starts_at) return (error.value = "Pick when it starts.");
  const starts = new Date(f.starts_at);
  const ends = f.ends_at ? new Date(f.ends_at) : null;
  if (ends && ends < starts) return (error.value = "It can't end before it starts.");
  if (f.rsvp_link.trim() && !/^https?:\/\//i.test(f.rsvp_link.trim())) return (error.value = "The RSVP link must start with http:// or https://.");

  saving.value = true;
  try {
    const saved = await saveEvent(e?.id ?? null, {
      slug,
      title,
      tag: f.tag.trim() || null,
      summary: f.summary.trim() || null,
      details: f.details.trim() || null,
      starts_at: starts.toISOString(),
      ends_at: ends ? ends.toISOString() : null,
      location: f.location.trim() || null,
      rsvp_link: f.rsvp_link.trim() || null,
      cover_url: cover.value,
      published: f.published,
    });
    // The old cover is garbage once a new one is saved.
    if (newCover.value && e?.cover_url) await removeFiles([pathFromUrl(e.cover_url)]);
    emit("saved", saved);
  } catch (err) {
    const msg = (err as Error).message;
    error.value = /duplicate key/i.test(msg) ? "That link name is taken. Change it." : msg;
  } finally {
    saving.value = false;
  }
}

async function cancel() {
  if (newCover.value) await removeFiles([newCover.value.path]);
  emit("close");
}

const area =
  "w-full border border-border-strong bg-bg px-3.5 py-3 font-sans text-base text-fg outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-fg-subtle focus:border-accent focus:shadow-[0_0_0_3px_var(--color-accent-soft)] sm:text-sm";
</script>

<template>
  <ModalShell :title="event ? 'Edit event' : 'New event'" @close="cancel">
    <form class="grid gap-5" novalidate @submit.prevent="submit">
      <div class="grid gap-5 sm:grid-cols-2">
        <FormField id="ev-title" v-model="f.title" label="Title" :maxlength="120" placeholder="Intro to LLMs workshop" />
        <FormField id="ev-tag" v-model="f.tag" label="Tag" :maxlength="40" placeholder="Workshop" />
      </div>

      <div class="grid gap-5 sm:grid-cols-2">
        <FormField id="ev-start" v-model="f.starts_at" type="datetime-local" label="Starts" />
        <FormField id="ev-end" v-model="f.ends_at" type="datetime-local" label="Ends (optional)" />
      </div>

      <div class="grid gap-5 sm:grid-cols-2">
        <FormField id="ev-loc" v-model="f.location" label="Location" :maxlength="160" placeholder="Tech Park, Lab 3" />
        <FormField id="ev-rsvp" v-model="f.rsvp_link" type="url" label="RSVP link (optional)" placeholder="https://forms.gle/…" />
      </div>

      <FormField id="ev-sum" v-model="f.summary" label="One-line summary" :maxlength="300" placeholder="Shown on the events list" />

      <div class="flex flex-col gap-2">
        <label for="ev-details" class="font-display text-xs uppercase tracking-tight text-fg-subtle">Details</label>
        <textarea id="ev-details" v-model="f.details" rows="7" maxlength="10000" :class="area" placeholder="What happens, who it's for, what to bring. Blank lines make paragraphs." />
      </div>

      <div class="grid gap-5 sm:grid-cols-2">
        <FormField id="ev-slug" v-model="f.slug" label="Link name" :maxlength="80" :placeholder="slugify(f.title) || 'auto from title'" :hint="`/events/${f.slug || slugify(f.title) || '…'}`" />
        <div class="flex flex-col gap-2">
          <span class="font-display text-xs uppercase tracking-tight text-fg-subtle">Cover picture</span>
          <div class="flex items-center gap-3">
            <img v-if="cover" :src="cover" alt="" class="h-16 w-28 border border-border object-cover" />
            <label class="cursor-pointer">
              <input type="file" accept="image/*" class="sr-only" :disabled="uploading" @change="pickCover" />
              <Badge as="span" size="sm" interactive>{{ uploading ? "Uploading…" : cover ? "Replace" : "Upload" }}</Badge>
            </label>
            <button v-if="cover" type="button" class="cursor-pointer border-none bg-transparent p-0" @click="cover = null; newCover = null">
              <Badge as="span" size="sm" interactive>Remove</Badge>
            </button>
          </div>
        </div>
      </div>

      <label class="flex cursor-pointer items-center gap-3 font-sans text-sm text-fg-muted">
        <input v-model="f.published" type="checkbox" class="h-4 w-4 accent-[var(--color-accent)]" />
        Published (unticked = only core team can see it)
      </label>

      <p v-if="error" class="font-sans text-sm text-accent" role="alert">{{ error }}</p>
      <div class="flex items-center justify-end gap-3">
        <button type="button" class="cursor-pointer border-none bg-transparent p-0" @click="cancel">
          <Badge as="span" size="md" interactive>Cancel</Badge>
        </button>
        <button type="submit" :disabled="saving || uploading" class="cursor-pointer border-none bg-transparent p-0 disabled:opacity-50">
          <Badge as="span" tone="solid" size="md" interactive arrow>{{ saving ? "Saving…" : "Save event" }}</Badge>
        </button>
      </div>
    </form>
  </ModalShell>
</template>
