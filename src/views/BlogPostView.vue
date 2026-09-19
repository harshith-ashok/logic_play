<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { useRoute } from "vue-router";
import Badge from "../components/ui/Badge.vue";
import PostBody from "../components/blog/PostBody.vue";
import { renderMarkdown } from "../../shared/markdown";
import { useAuth } from "../composables/useAuth";
import { useBlog, type Post } from "../composables/useBlog";
import { clearJsonLd, setJsonLd, setPageSeo } from "../composables/useRouteSeo";
import { formatDate } from "../utils/date";

const route = useRoute();
const { profile } = useAuth();
const { getPost } = useBlog();

const post = ref<Post | null>(null);
const loading = ref(true);
const notFound = ref(false);

const html = computed(() => (post.value ? renderMarkdown(post.value.body) : ""));
const canEdit = computed(
  () => !!profile.value && !!post.value && (profile.value.role === "core_team" || profile.value.username === post.value.author),
);

async function load(slug: string) {
  loading.value = true;
  notFound.value = false;
  post.value = null;
  try {
    post.value = await getPost(slug);
    const url = `${window.location.origin}/blog/${post.value.slug}`;
    const image = post.value.cover ? new URL(post.value.cover, window.location.origin).toString() : undefined;
    if (post.value.status === "published") {
      setPageSeo({ title: `${post.value.title} — Logic Play`, description: post.value.excerpt, path: `/blog/${post.value.slug}`, type: "article", image });
      setJsonLd({
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: post.value.title,
        description: post.value.excerpt,
        datePublished: post.value.date,
        author: { "@type": "Person", name: post.value.author },
        publisher: { "@type": "Organization", name: "Logic Play" },
        mainEntityOfPage: url,
        ...(image && { image }),
        keywords: post.value.tags.join(", "),
      });
    } else {
      setPageSeo({ title: `${post.value.title} — Logic Play`, description: post.value.excerpt, path: `/blog/${post.value.slug}`, noindex: true });
    }
  } catch {
    notFound.value = true;
    setPageSeo({ title: "Post not found — Logic Play", description: "This post doesn't exist or isn't published.", path: "/blog", noindex: true });
  } finally {
    loading.value = false;
  }
}

// `profile` in the deps so a draft/pending post loads once the session resolves.
watch(() => [route.params.slug, profile.value?.id], () => load(String(route.params.slug)), { immediate: true });
onBeforeUnmount(clearJsonLd);
</script>

<template>
  <div class="px-4 py-28 sm:px-6">
    <article class="mx-auto max-w-3xl">
      <router-link to="/blog" class="mb-8 inline-block font-sans text-xs uppercase tracking-wide text-fg-subtle transition-colors hover:text-fg">
        &larr; All posts
      </router-link>

      <p v-if="loading" class="font-sans text-sm text-fg-subtle">Loading…</p>

      <div v-else-if="notFound" class="rounded-2xl border border-dashed border-border-strong px-8 py-20 text-center">
        <p class="font-display text-lg uppercase tracking-tight text-fg-subtle">Post not found.</p>
      </div>

      <template v-else-if="post">
        <Badge v-if="post.status !== 'published'" as="p" size="sm" class="mb-6 text-accent">
          {{ post.status === "pending" ? "Awaiting review" : "Draft" }} &mdash; not public
        </Badge>

        <h1 class="mb-4 font-display text-3xl uppercase leading-tight tracking-tight sm:text-5xl">
          {{ post.title }}
        </h1>
        <p class="mb-8 font-sans text-xs text-fg-subtle">
          @{{ post.author }} · {{ formatDate(post.date) }} · {{ post.readingMinutes }} min read
        </p>
        <div v-if="post.tags.length" class="mb-8 flex flex-wrap gap-2">
          <span v-for="tag in post.tags" :key="tag" class="rounded-sm border border-border px-3 py-1 font-sans text-xs text-fg-subtle">
            {{ tag }}
          </span>
        </div>
        <img
          v-if="post.cover"
          :src="post.cover"
          :alt="post.title"
          class="mb-10 aspect-video w-full rounded-2xl border border-border object-cover"
        />

        <PostBody :html="html" />

        <div v-if="canEdit" class="mt-12">
          <Badge :to="`/blog/edit/${post.slug}`" size="sm" interactive>Edit post</Badge>
        </div>
      </template>
    </article>
  </div>
</template>
