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
  <div class="wrap py-10 pb-20 md:py-16 md:pb-28">
    <article class="mx-auto max-w-3xl">
      <router-link
        to="/blog"
        class="group mb-9 inline-flex min-h-10 items-center gap-2 font-mono text-[12.5px] text-fg-muted uppercase transition-[color,gap] duration-200 hover:gap-3 hover:text-fg"
      >
        &larr; All posts
      </router-link>

      <p v-if="loading" class="font-mono text-xs text-fg-subtle uppercase">Loading&hellip;</p>

      <div v-else-if="notFound" class="empty-state">Post not found.</div>

      <template v-else-if="post">
        <p
          v-if="post.status !== 'published'"
          class="mb-6 inline-block border border-accent-dim bg-accent-soft px-3 py-1.5 font-mono text-[11.5px] text-accent uppercase"
        >
          {{ post.status === "pending" ? "Awaiting review" : "Draft" }} &mdash; not public
        </p>

        <h1 class="mb-5 text-[clamp(2rem,7vw,3.4rem)] leading-[1.08] font-bold tracking-[-0.02em] wrap-break-word">
          {{ post.title }}
        </h1>
        <p class="mb-5 flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-[12.5px] text-fg-subtle">
          <span>@{{ post.author }}</span><span class="text-border-strong">·</span>
          <span>{{ formatDate(post.date) }}</span><span class="text-border-strong">·</span>
          <span>{{ post.readingMinutes }} min read</span>
        </p>
        <div v-if="post.tags.length" class="mb-9 flex flex-wrap gap-2">
          <span
            v-for="tag in post.tags"
            :key="tag"
            class="border border-border px-3 py-1.5 font-mono text-[11.5px] text-fg-muted transition-[border-color,color] duration-200 hover:border-accent hover:text-fg"
          >
            {{ tag }}
          </span>
        </div>
        <img
          v-if="post.cover"
          :src="post.cover"
          :alt="post.title"
          decoding="async"
          class="mb-10 aspect-video w-full border border-border object-cover"
        />

        <PostBody :html="html" />

        <div v-if="canEdit" class="mt-12 flex items-center gap-3 border-t border-border pt-8">
          <Badge :to="`/blog/edit/${post.slug}`" interactive>Edit post</Badge>
        </div>
      </template>
    </article>
  </div>
</template>
