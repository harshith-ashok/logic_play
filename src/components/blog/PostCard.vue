<script setup lang="ts">
import Badge from "../ui/Badge.vue";
import HalftoneMark from "../ui/HalftoneMark.vue";
import type { PostSummary } from "../../composables/useBlog";
import { formatDate } from "../../utils/date";

defineProps<{ post: PostSummary }>();
</script>

<template>
  <Badge :to="`/blog/${post.slug}`" column interactive class="post-card gap-0! overflow-hidden p-0!">
    <img
      v-if="post.cover"
      :src="post.cover"
      :alt="post.title"
      loading="lazy"
      class="aspect-video w-full object-cover"
    />
    <div v-else class="flex aspect-video w-full items-center justify-center border-b border-border">
      <HalftoneMark :size="40" :opacity="0.3" />
    </div>
    <div class="flex flex-col gap-3 p-6">
      <span class="font-sans text-xs tracking-normal text-fg-subtle">
        {{ formatDate(post.date) }} · {{ post.readingMinutes }} min · @{{ post.author }}
      </span>
      <span class="font-display text-lg uppercase tracking-tight">{{ post.title }}</span>
      <span class="font-sans text-sm tracking-normal text-fg-muted">{{ post.excerpt }}</span>
      <span v-if="post.tags.length" class="flex flex-wrap gap-2">
        <span
          v-for="tag in post.tags"
          :key="tag"
          class="rounded-sm border border-border px-3 py-1 font-sans text-xs tracking-normal text-fg-subtle"
        >
          {{ tag }}
        </span>
      </span>
    </div>
  </Badge>
</template>
