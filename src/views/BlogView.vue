<script setup lang="ts">
import { onMounted, ref } from "vue";
import Badge from "../components/ui/Badge.vue";
import HalftoneMark from "../components/ui/HalftoneMark.vue";
import PostCard from "../components/blog/PostCard.vue";
import { useAuth } from "../composables/useAuth";
import { useBlog, type PostSummary } from "../composables/useBlog";
import { useScrollReveal } from "../composables/useScrollReveal";

const { profile } = useAuth();
const { listPublished } = useBlog();

const posts = ref<PostSummary[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

const list = ref<HTMLElement | null>(null);
useScrollReveal(list, { selector: ".post-card" });

onMounted(async () => {
  try {
    posts.value = await listPublished();
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Could not load posts.";
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="px-4 py-28 sm:px-6">
    <div class="mx-auto max-w-6xl">
      <h1 class="mb-4 font-display text-3xl uppercase tracking-tight sm:text-5xl">Blog</h1>
      <p class="mb-8 max-w-xl font-sans text-sm text-fg-muted">
        Build logs, write-ups and lessons from the people shipping at Logic Play.
      </p>

      <div v-if="profile && profile.role !== 'volunteer'" class="mb-12 flex flex-wrap gap-2">
        <Badge to="/blog/write" size="sm" tone="solid" interactive arrow>Write a post</Badge>
        <Badge to="/blog/dashboard" size="sm" interactive>My posts</Badge>
      </div>

      <p v-if="loading" class="font-sans text-sm text-fg-subtle">Loading…</p>
      <p v-else-if="error" class="font-sans text-sm text-accent">{{ error }}</p>

      <div v-else-if="posts.length === 0" class="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border-strong px-8 py-20 text-center">
        <HalftoneMark :size="40" :opacity="0.3" />
        <p class="font-display text-lg uppercase tracking-tight text-fg-subtle">
          No posts yet &mdash; first one coming soon.
        </p>
      </div>

      <div v-else ref="list" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <PostCard v-for="post in posts" :key="post.slug" :post="post" />
      </div>
    </div>
  </div>
</template>
