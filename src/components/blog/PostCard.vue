<script setup lang="ts">
import HalftoneMark from "../ui/HalftoneMark.vue";
import type { PostSummary } from "../../composables/useBlog";
import { formatDate } from "../../utils/date";

defineProps<{ post: PostSummary }>();
</script>

<template>
  <router-link
    :to="`/blog/${post.slug}`"
    class="post-card group flex flex-col border border-border bg-bg-elevated transition-[border-color,translate] duration-300 hover:-translate-y-1 hover:border-accent-dim"
  >
    <img
      v-if="post.cover"
      :src="post.cover"
      :alt="post.title"
      loading="lazy"
      decoding="async"
      width="640"
      height="360"
      class="aspect-video w-full border-b border-border object-cover"
    />
    <div v-else class="flex aspect-video w-full items-center justify-center border-b border-border">
      <HalftoneMark :size="34" :opacity="0.5" color="var(--color-accent)" />
    </div>
    <div class="flex flex-1 flex-col gap-3 p-5 sm:p-6">
      <span class="font-mono text-[11.5px] text-fg-subtle">
        {{ formatDate(post.date) }} · {{ post.readingMinutes }} min · @{{ post.author }}
      </span>
      <span class="text-lg leading-snug font-semibold transition-colors duration-200 group-hover:text-accent">{{ post.title }}</span>
      <span class="text-sm text-fg-muted">{{ post.excerpt }}</span>
      <span v-if="post.tags.length" class="mt-auto flex flex-wrap gap-2 pt-1">
        <span v-for="tag in post.tags" :key="tag" class="border border-border px-2.5 py-1 font-mono text-[11px] text-fg-subtle">
          {{ tag }}
        </span>
      </span>
    </div>
  </router-link>
</template>
