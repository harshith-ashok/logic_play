<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import Badge from "../components/ui/Badge.vue";
import Input from "../components/ui/Input.vue";
import MarkdownEditor from "../components/blog/MarkdownEditor.vue";
import { useAuth } from "../composables/useAuth";
import { useBlog } from "../composables/useBlog";

const route = useRoute();
const router = useRouter();
const { profile } = useAuth();
const { getPost, savePost, deletePost, uploadImage } = useBlog();

const isCore = computed(() => profile.value?.role === "core_team");
const slug = ref<string | null>((route.params.slug as string) ?? null);

const title = ref("");
const cover = ref("");
const tagsText = ref("");
const body = ref("");
const status = ref<string | null>(null);

const loading = ref(!!slug.value);
const busy = ref(false);
const message = ref<{ text: string; error: boolean } | null>(null);
const coverInput = ref<HTMLInputElement | null>(null);

const tags = computed(() => tagsText.value.split(",").map((t) => t.trim()).filter(Boolean));

onMounted(async () => {
  if (!slug.value) return;
  try {
    const post = await getPost(slug.value);
    title.value = post.title;
    cover.value = post.cover;
    tagsText.value = post.tags.join(", ");
    body.value = post.body;
    status.value = post.status;
  } catch (err) {
    message.value = { text: err instanceof Error ? err.message : "Could not load the post.", error: true };
  } finally {
    loading.value = false;
  }
});

async function submit(action: "save" | "submit" | "publish") {
  busy.value = true;
  message.value = null;
  try {
    const result = await savePost({
      slug: slug.value ?? undefined,
      title: title.value,
      body: body.value,
      cover: cover.value,
      tags: tags.value,
      action,
    });
    if (action === "save") {
      status.value = result.status;
      if (!slug.value) {
        slug.value = result.slug;
        router.replace(`/blog/edit/${result.slug}`);
      }
      message.value = { text: "Saved.", error: false };
    } else {
      router.push("/blog/dashboard");
    }
  } catch (err) {
    message.value = { text: err instanceof Error ? err.message : "Could not save.", error: true };
  } finally {
    busy.value = false;
  }
}

async function remove() {
  if (!slug.value || !window.confirm("Delete this post permanently?")) return;
  busy.value = true;
  try {
    await deletePost(slug.value);
    router.push("/blog/dashboard");
  } catch (err) {
    message.value = { text: err instanceof Error ? err.message : "Could not delete.", error: true };
    busy.value = false;
  }
}

async function onCoverPick(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (!file) return;
  try {
    cover.value = await uploadImage(file);
  } catch (err) {
    message.value = { text: err instanceof Error ? err.message : "Upload failed.", error: true };
  }
}
</script>

<template>
  <div class="wrap py-10 md:py-16">
    <div class="mx-auto max-w-4xl">
      <h1 class="page-title">
        {{ slug ? "Edit post" : "New post" }}
      </h1>
      <p class="page-sub mb-8">
        <template v-if="isCore">Core team posts go live as soon as you publish.</template>
        <template v-else>Submit when you're ready &mdash; the core team reviews it before it goes public.</template>
        <template v-if="status"> Current status: <strong class="text-fg">{{ status }}</strong>.</template>
      </p>

      <p v-if="loading" class="font-sans text-sm text-fg-subtle">Loading…</p>

      <form v-else class="flex flex-col gap-4" @submit.prevent="submit('save')">
        <Input v-model="title" placeholder="Post title" />
        <div class="flex gap-2">
          <Input v-model="cover" placeholder="Cover image URL (optional)" />
          <button type="button" class="cursor-pointer border-none bg-transparent p-0" @click="coverInput?.click()">
            <Badge as="span" size="sm" interactive class="h-full whitespace-nowrap">Upload</Badge>
          </button>
          <input ref="coverInput" type="file" accept="image/png,image/jpeg,image/webp,image/gif" class="hidden" @change="onCoverPick" />
        </div>
        <Input v-model="tagsText" placeholder="Tags, comma separated (e.g. robotics, projects)" />

        <MarkdownEditor v-model="body" />

        <p v-if="message" class="font-sans text-xs" :class="message.error ? 'text-accent' : 'text-fg-muted'">
          {{ message.text }}
        </p>

        <div class="flex flex-wrap items-center gap-2">
          <button type="submit" :disabled="busy" class="cursor-pointer border-none bg-transparent p-0 disabled:opacity-50">
            <Badge as="span" size="sm" interactive>Save draft</Badge>
          </button>
          <button
            v-if="isCore"
            type="button"
            :disabled="busy"
            class="cursor-pointer border-none bg-transparent p-0 disabled:opacity-50"
            @click="submit('publish')"
          >
            <Badge as="span" size="sm" tone="solid" interactive arrow>Publish</Badge>
          </button>
          <button
            v-else
            type="button"
            :disabled="busy"
            class="cursor-pointer border-none bg-transparent p-0 disabled:opacity-50"
            @click="submit('submit')"
          >
            <Badge as="span" size="sm" tone="solid" interactive arrow>Submit for review</Badge>
          </button>
          <button
            v-if="slug"
            type="button"
            :disabled="busy"
            class="ml-auto cursor-pointer border-none bg-transparent p-0 disabled:opacity-50"
            @click="remove"
          >
            <Badge as="span" size="sm" interactive class="text-accent">Delete</Badge>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
