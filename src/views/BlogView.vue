<script setup lang="ts">
import { onMounted, ref } from "vue";
import Badge from "../components/ui/Badge.vue";
import Marquee from "../components/ui/Marquee.vue";
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
  <div>
    <div class="wrap page-hero">
      <div class="eyebrow">WRITING</div>
      <h1 class="page-title">Blog</h1>
      <p class="page-sub">Build logs, write-ups and lessons from the people shipping at Logic Play.</p>

      <div v-if="profile && profile.role !== 'volunteer'" class="mt-7 flex flex-wrap gap-3">
        <Badge to="/blog/write" tone="solid" interactive arrow>Write a post</Badge>
        <Badge to="/blog/dashboard" interactive>My posts</Badge>
      </div>
    </div>

    <Marquee :words="['Write', 'Ship', 'Share']" :duration="20" />

    <div class="wrap py-10 pb-16 md:py-14 md:pb-24">
      <p v-if="loading" class="font-mono text-xs text-fg-subtle uppercase">Loading&hellip;</p>
      <p v-else-if="error" class="font-mono text-xs text-accent">{{ error }}</p>

      <div v-else-if="posts.length === 0" class="empty-state">No posts yet &mdash; first one coming soon.</div>

      <div v-else ref="list" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <PostCard v-for="post in posts" :key="post.slug" :post="post" />
      </div>
    </div>
  </div>
</template>
