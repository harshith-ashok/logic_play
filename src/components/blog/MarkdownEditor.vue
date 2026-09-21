<script setup lang="ts">
import { computed, nextTick, ref } from "vue";
import { renderMarkdown } from "../../../shared/markdown";
import { useBlog } from "../../composables/useBlog";
import PostBody from "./PostBody.vue";

const props = defineProps<{ modelValue: string }>();
const emit = defineEmits<{ "update:modelValue": [string] }>();

const { uploadImage } = useBlog();
const textarea = ref<HTMLTextAreaElement | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const tab = ref<"write" | "preview">("write");
const uploading = ref(false);
const uploadError = ref<string | null>(null);

const preview = computed(() => renderMarkdown(props.modelValue));

const tools = [
  { label: "B", title: "Bold", before: "**", after: "**", placeholder: "bold text" },
  { label: "I", title: "Italic", before: "_", after: "_", placeholder: "italic text" },
  { label: "H2", title: "Heading", before: "\n## ", after: "\n", placeholder: "Heading" },
  { label: "Link", title: "Link", before: "[", after: "](https://)", placeholder: "link text" },
  { label: "Code", title: "Inline code", before: "`", after: "`", placeholder: "code" },
  { label: "Block", title: "Code block", before: "\n```python\n", after: "\n```\n", placeholder: "print('hello')" },
  { label: "List", title: "List", before: "\n- ", after: "\n", placeholder: "item" },
  { label: "Quote", title: "Quote", before: "\n> ", after: "\n", placeholder: "quote" },
];

/** Replaces the selection (or a placeholder) and re-selects the inserted text. */
function insert(before: string, after: string, placeholder: string) {
  const el = textarea.value;
  if (!el) return;
  const { selectionStart: start, selectionEnd: end, value } = el;
  const selected = value.slice(start, end) || placeholder;
  emit("update:modelValue", value.slice(0, start) + before + selected + after + value.slice(end));
  nextTick(() => {
    el.focus();
    el.setSelectionRange(start + before.length, start + before.length + selected.length);
  });
}

async function addImages(files: File[]) {
  const images = files.filter((f) => f.type.startsWith("image/"));
  if (!images.length) return;
  uploading.value = true;
  uploadError.value = null;
  try {
    for (const file of images) {
      const url = await uploadImage(file);
      insert("\n![", `](${url})\n`, file.name.replace(/\.[^.]+$/, ""));
    }
  } catch (err) {
    uploadError.value = err instanceof Error ? err.message : "Upload failed.";
  } finally {
    uploading.value = false;
  }
}

function onPaste(event: ClipboardEvent) {
  const files = [...(event.clipboardData?.files ?? [])];
  if (files.some((f) => f.type.startsWith("image/"))) {
    event.preventDefault();
    addImages(files);
  }
}

function onDrop(event: DragEvent) {
  const files = [...(event.dataTransfer?.files ?? [])];
  if (files.length) {
    event.preventDefault();
    addImages(files);
  }
}

function onPick(event: Event) {
  const input = event.target as HTMLInputElement;
  addImages([...(input.files ?? [])]);
  input.value = "";
}
</script>

<template>
  <div class="glass-surface relative overflow-hidden ">
    <div class="flex flex-wrap items-center gap-2 border-b border-border p-3">
      <div class="flex gap-1">
        <button
          v-for="name in ['write', 'preview'] as const"
          :key="name"
          type="button"
          class="cursor-pointer border-none px-4 py-1.5 font-display text-xs uppercase tracking-tight transition-colors duration-200"
          :class="tab === name ? 'bg-accent text-white' : 'bg-transparent text-fg-muted hover:text-fg'"
          @click="tab = name"
        >
          {{ name }}
        </button>
      </div>
      <template v-if="tab === 'write'">
        <span class="mx-1 hidden h-4 w-px bg-border sm:block" />
        <button
          v-for="tool in tools"
          :key="tool.label"
          type="button"
          :title="tool.title"
          class="cursor-pointer border border-border bg-transparent px-3 py-1 font-sans text-xs text-fg-muted transition-colors duration-200 hover:border-border-strong hover:text-fg"
          @click="insert(tool.before, tool.after, tool.placeholder)"
        >
          {{ tool.label }}
        </button>
        <button
          type="button"
          title="Upload image"
          :disabled="uploading"
          class="cursor-pointer border border-border bg-transparent px-3 py-1 font-sans text-xs text-fg-muted transition-colors duration-200 hover:border-border-strong hover:text-fg disabled:opacity-50"
          @click="fileInput?.click()"
        >
          {{ uploading ? "Uploading…" : "Image" }}
        </button>
        <input ref="fileInput" type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple class="hidden" @change="onPick" />
      </template>
    </div>

    <textarea
      v-show="tab === 'write'"
      ref="textarea"
      :value="modelValue"
      rows="22"
      spellcheck="true"
      placeholder="Write in markdown. Paste or drop an image to upload it."
      class="block min-h-96 w-full resize-y border-none bg-transparent p-5 font-sans text-sm leading-relaxed text-fg outline-none placeholder:text-fg-subtle"
      @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
      @paste="onPaste"
      @drop="onDrop"
      @dragover.prevent
    />
    <div v-show="tab === 'preview'" class="min-h-96 p-5 sm:p-8">
      <PostBody v-if="modelValue.trim()" :html="preview" />
      <p v-else class="font-sans text-sm text-fg-subtle">Nothing to preview yet.</p>
    </div>

    <p v-if="uploadError" class="border-t border-border px-5 py-3 font-sans text-xs text-accent">
      {{ uploadError }}
    </p>
  </div>
</template>
