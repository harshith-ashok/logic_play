<script setup lang="ts">
import { onMounted, ref } from "vue";
import Badge from "../components/ui/Badge.vue";
import { useAuth } from "../composables/useAuth";
import { useBlog, type PostSummary } from "../composables/useBlog";
import { formatDate } from "../utils/date";

const { profile } = useAuth();
const { listMine, listForReview, reviewPost, deletePost } = useBlog();

const mine = ref<PostSummary[]>([]);
const review = ref<PostSummary[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

const STATUS_LABEL = { draft: "Draft", pending: "In review", published: "Published" } as const;

async function load() {
  try {
    const isCore = profile.value?.role === "core_team";
    [mine.value, review.value] = await Promise.all([listMine(), isCore ? listForReview() : Promise.resolve([])]);
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Could not load posts.";
  } finally {
    loading.value = false;
  }
}

async function decide(slug: string, decision: "approve" | "reject") {
  error.value = null;
  try {
    await reviewPost(slug, decision);
    await load();
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Could not update the post.";
  }
}

async function remove(slug: string) {
  if (!window.confirm("Delete this post permanently?")) return;
  error.value = null;
  try {
    await deletePost(slug);
    await load();
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Could not delete the post.";
  }
}

onMounted(load);
</script>

<template>
  <div class="px-4 py-28 sm:px-6">
    <div class="mx-auto max-w-4xl">
      <h1 class="mb-4 font-display text-3xl uppercase tracking-tight sm:text-5xl">My posts</h1>
      <div class="mb-12 flex flex-wrap gap-2">
        <Badge to="/blog/write" size="sm" tone="solid" interactive arrow>New post</Badge>
        <Badge to="/blog" size="sm" interactive>Public blog</Badge>
      </div>

      <p v-if="error" class="mb-6 font-sans text-sm text-accent">{{ error }}</p>
      <p v-if="loading" class="font-sans text-sm text-fg-subtle">Loading…</p>

      <template v-else>
        <section v-if="profile?.role === 'core_team'" class="mb-16">
          <h2 class="mb-6 font-display text-xl uppercase tracking-tight">Awaiting review</h2>
          <p v-if="!review.length" class="font-sans text-sm text-fg-subtle">Nothing waiting.</p>
          <div v-else class="flex flex-col gap-3">
            <Badge v-for="post in review" :key="post.slug" column class="gap-3!">
              <span class="font-display text-base uppercase tracking-tight">{{ post.title }}</span>
              <span class="font-sans text-xs tracking-normal text-fg-subtle">@{{ post.author }} · {{ formatDate(post.date) }}</span>
              <span class="flex flex-wrap gap-2">
                <Badge :to="`/blog/${post.slug}`" size="sm" interactive>Read</Badge>
                <button type="button" class="cursor-pointer border-none bg-transparent p-0" @click="decide(post.slug, 'approve')">
                  <Badge as="span" size="sm" tone="solid" interactive>Approve</Badge>
                </button>
                <button type="button" class="cursor-pointer border-none bg-transparent p-0" @click="decide(post.slug, 'reject')">
                  <Badge as="span" size="sm" interactive>Send back</Badge>
                </button>
              </span>
            </Badge>
          </div>
        </section>

        <section>
          <h2 class="mb-6 font-display text-xl uppercase tracking-tight">Your posts</h2>
          <p v-if="!mine.length" class="font-sans text-sm text-fg-subtle">You haven't written anything yet.</p>
          <div v-else class="flex flex-col gap-3">
            <Badge v-for="post in mine" :key="post.slug" column class="gap-3!">
              <span class="font-display text-base uppercase tracking-tight">{{ post.title }}</span>
              <span class="font-sans text-xs tracking-normal text-fg-subtle">
                {{ STATUS_LABEL[post.status] }} · {{ formatDate(post.date) }}
              </span>
              <span class="flex flex-wrap gap-2">
                <Badge :to="`/blog/${post.slug}`" size="sm" interactive>View</Badge>
                <Badge :to="`/blog/edit/${post.slug}`" size="sm" interactive>Edit</Badge>
                <button
                  v-if="post.status !== 'published' || profile?.role === 'core_team'"
                  type="button"
                  class="cursor-pointer border-none bg-transparent p-0"
                  @click="remove(post.slug)"
                >
                  <Badge as="span" size="sm" interactive class="text-accent">Delete</Badge>
                </button>
              </span>
            </Badge>
          </div>
        </section>
      </template>
    </div>
  </div>
</template>
