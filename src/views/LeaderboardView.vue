<script setup lang="ts">
import { ref } from "vue";
import Badge from "../components/ui/Badge.vue";
import GridBar from "../components/ui/GridBar.vue";
import HalftoneMark from "../components/ui/HalftoneMark.vue";
import { useScrollReveal } from "../composables/useScrollReveal";
import { BLOG_WINDOW_WEEKS, useLeaderboard } from "../composables/useLeaderboard";

const { loading, error, githubEntries, leetcodeEntries, blogEntries } = useLeaderboard();

const githubGrid = ref<HTMLElement | null>(null);
const leetcodeGrid = ref<HTMLElement | null>(null);
useScrollReveal(githubGrid, { selector: ".github-card" });
useScrollReveal(leetcodeGrid, { selector: ".leetcode-card" });
const blogGrid = ref<HTMLElement | null>(null);
useScrollReveal(blogGrid, { selector: ".blog-card" });

function pad(n: number) {
  return String(n + 1).padStart(2, "0");
}
function fullName(p: { first_name: string; last_name: string }) {
  return `${p.first_name} ${p.last_name}`;
}
</script>

<template>
  <div class="px-4 py-28 sm:px-6">
    <div class="mx-auto max-w-6xl">
      <h1 class="mb-4 font-display text-3xl uppercase tracking-tight sm:text-5xl">
        Leaderboard
      </h1>
      <p class="mb-12 max-w-xl font-sans text-sm text-fg-muted">
        Public GitHub and LeetCode stats from members and core team — ranked, honest, no fluff.
      </p>

      <p v-if="loading" class="font-display text-xs uppercase tracking-tight text-fg-subtle">
        Loading stats&hellip;
      </p>
      <p v-else-if="error" class="font-display text-xs uppercase tracking-tight text-fg-subtle">
        {{ error }}
      </p>

      <div v-else class="flex flex-col gap-16">
        <section>
          <h2 class="mb-6 font-display text-xl uppercase tracking-tight">GitHub</h2>

          <div
            v-if="githubEntries.length === 0"
            class="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border-strong px-8 py-20 text-center"
          >
            <HalftoneMark :size="40" :opacity="0.3" />
            <p class="font-display text-lg uppercase tracking-tight text-fg-subtle">
              No GitHub stats yet — add a GitHub username to your profile.
            </p>
          </div>

          <div v-else ref="githubGrid" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Badge
              v-for="(entry, i) in githubEntries"
              :key="entry.profile.id"
              :href="`https://github.com/${entry.profile.github_username}`"
              column
              interactive
              class="github-card gap-3"
            >
              <span class="font-display text-xs uppercase tracking-tight text-fg-subtle">
                {{ pad(i) }} / {{ fullName(entry.profile) }} ({{ entry.profile.username }})
              </span>
              <span class="font-display text-2xl uppercase tracking-tight">
                {{ entry.stats.publicRepos }} repos
              </span>
              <span class="font-sans text-xs tracking-normal text-fg-muted">
                {{ entry.stats.followers }} followers · {{ entry.stats.following }} following
              </span>
            </Badge>
          </div>
        </section>

        <section>
          <h2 class="mb-6 font-display text-xl uppercase tracking-tight">LeetCode</h2>

          <div
            v-if="leetcodeEntries.length === 0"
            class="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border-strong px-8 py-20 text-center"
          >
            <HalftoneMark :size="40" :opacity="0.3" />
            <p class="font-display text-lg uppercase tracking-tight text-fg-subtle">
              No LeetCode stats yet — add a LeetCode username to your profile.
            </p>
          </div>

          <div v-else ref="leetcodeGrid" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Badge
              v-for="(entry, i) in leetcodeEntries"
              :key="entry.profile.id"
              :href="`https://leetcode.com/${entry.profile.leetcode_username}`"
              column
              interactive
              class="leetcode-card gap-3"
            >
              <span class="font-display text-xs uppercase tracking-tight text-fg-subtle">
                {{ pad(i) }} / {{ fullName(entry.profile) }} ({{ entry.profile.username }})
              </span>
              <span class="font-display text-2xl uppercase tracking-tight">
                {{ entry.stats.totalSolved }} solved
              </span>
              <span class="font-sans text-xs tracking-normal text-fg-muted">
                {{ entry.stats.easySolved }}E · {{ entry.stats.mediumSolved }}M · {{ entry.stats.hardSolved }}H
              </span>
            </Badge>
          </div>
        </section>

        <section>
          <h2 class="mb-6 font-display text-xl uppercase tracking-tight">Blog Consistency</h2>
          <div
            v-if="blogEntries.length === 0"
            class="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border-strong px-8 py-20 text-center"
          >
            <HalftoneMark :size="40" :opacity="0.3" />
            <p class="font-display text-lg uppercase tracking-tight text-fg-subtle">
              No published posts yet — write one.
            </p>
          </div>

          <div v-else ref="blogGrid" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Badge
              v-for="(entry, i) in blogEntries"
              :key="entry.profile.id"
              to="/blog"
              column
              interactive
              class="blog-card gap-3"
            >
              <span class="font-display text-xs uppercase tracking-tight text-fg-subtle">
                {{ pad(i) }} / {{ fullName(entry.profile) }} ({{ entry.profile.username }})
              </span>
              <span class="font-display text-2xl uppercase tracking-tight">
                {{ entry.stats.activeWeeks }}/{{ BLOG_WINDOW_WEEKS }} weeks
              </span>
              <span class="font-sans text-xs tracking-normal text-fg-muted">
                {{ entry.stats.totalPosts }} published {{ entry.stats.totalPosts === 1 ? "post" : "posts" }}
              </span>
            </Badge>
          </div>
        </section>
      </div>

      <GridBar class="mt-24" />
    </div>
  </div>
</template>
