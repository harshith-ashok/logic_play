import { computed, ref } from "vue";
import type { PostSummary } from "../../shared/blog";
import { getSupabase } from "../lib/supabase";

export interface LeaderboardProfile {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  role: "core_team" | "member" | "volunteer";
  github_username: string | null;
  leetcode_username: string | null;
}

export interface GitHubStats {
  publicRepos: number;
  followers: number;
  following: number;
}

export interface LeetCodeStats {
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
}

export interface BlogStats {
  totalPosts: number;
  /** Distinct weeks, out of the last BLOG_WINDOW_WEEKS, with at least one published post. */
  activeWeeks: number;
}

export const BLOG_WINDOW_WEEKS = 12;

export interface LeaderboardEntry<TStats> {
  profile: LeaderboardProfile;
  stats: TStats;
}

async function fetchGitHub(username: string): Promise<GitHubStats | null> {
  try {
    const res = await fetch(`https://api.github.com/users/${username}`);
    if (!res.ok) return null;
    const data = await res.json();
    return {
      publicRepos: data.public_repos ?? 0,
      followers: data.followers ?? 0,
      following: data.following ?? 0,
    };
  } catch {
    return null;
  }
}

async function fetchLeetCode(username: string): Promise<LeetCodeStats | null> {
  try {
    const res = await fetch(`https://leetcode-stats-api.herokuapp.com/${username}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status !== "success") return null;
    return {
      totalSolved: data.totalSolved ?? 0,
      easySolved: data.easySolved ?? 0,
      mediumSolved: data.mediumSolved ?? 0,
      hardSolved: data.hardSolved ?? 0,
    };
  } catch {
    return null;
  }
}

async function fetchBlogStats(): Promise<Map<string, BlogStats>> {
  const stats = new Map<string, BlogStats>();
  try {
    const res = await fetch("/api/blog/posts");
    if (!res.ok) return stats;
    const posts = (await res.json()) as PostSummary[];
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const weeksByAuthor = new Map<string, Set<number>>();

    for (const post of posts) {
      const entry = stats.get(post.author) ?? { totalPosts: 0, activeWeeks: 0 };
      entry.totalPosts++;
      stats.set(post.author, entry);

      const weeksAgo = Math.floor((now - new Date(post.date).getTime()) / weekMs);
      if (weeksAgo >= 0 && weeksAgo < BLOG_WINDOW_WEEKS) {
        const weeks = weeksByAuthor.get(post.author) ?? new Set<number>();
        weeks.add(weeksAgo);
        weeksByAuthor.set(post.author, weeks);
      }
    }
    for (const [author, weeks] of weeksByAuthor) stats.get(author)!.activeWeeks = weeks.size;
  } catch {
    /* blog section just shows its empty state */
  }
  return stats;
}

export function useLeaderboard() {
  const loading = ref(true);
  const error = ref<string | null>(null);
  const githubEntries = ref<LeaderboardEntry<GitHubStats>[]>([]);
  const leetcodeEntries = ref<LeaderboardEntry<LeetCodeStats>[]>([]);
  const blogEntries = ref<LeaderboardEntry<BlogStats>[]>([]);

  async function load() {
    loading.value = true;
    error.value = null;

    const client = getSupabase();
    if (!client) {
      error.value = "Leaderboard is not available right now.";
      loading.value = false;
      return;
    }

    const { data, error: rpcError } = await client.rpc("get_leaderboard_profiles");
    if (rpcError || !data) {
      error.value = "Could not load leaderboard data.";
      loading.value = false;
      return;
    }
    const profiles = data as LeaderboardProfile[];

    const githubTargets = profiles.filter((p) => p.github_username);
    const leetcodeTargets = profiles.filter((p) => p.leetcode_username);

    const [githubResults, leetcodeResults, blogStats] = await Promise.all([
      Promise.allSettled(githubTargets.map((p) => fetchGitHub(p.github_username as string))),
      Promise.allSettled(leetcodeTargets.map((p) => fetchLeetCode(p.leetcode_username as string))),
      fetchBlogStats(),
    ]);

    const gh: LeaderboardEntry<GitHubStats>[] = [];
    githubResults.forEach((r, i) => {
      if (r.status === "fulfilled" && r.value) {
        gh.push({ profile: githubTargets[i], stats: r.value });
      }
    });
    gh.sort((a, b) => b.stats.publicRepos - a.stats.publicRepos);
    githubEntries.value = gh;

    const lc: LeaderboardEntry<LeetCodeStats>[] = [];
    leetcodeResults.forEach((r, i) => {
      if (r.status === "fulfilled" && r.value) {
        lc.push({ profile: leetcodeTargets[i], stats: r.value });
      }
    });
    lc.sort((a, b) => b.stats.totalSolved - a.stats.totalSolved);
    leetcodeEntries.value = lc;

    blogEntries.value = profiles
      .filter((p) => blogStats.has(p.username))
      .map((p) => ({ profile: p, stats: blogStats.get(p.username)! }))
      .sort((a, b) => b.stats.activeWeeks - a.stats.activeWeeks || b.stats.totalPosts - a.stats.totalPosts);

    loading.value = false;
  }

  load();

  return {
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    githubEntries,
    leetcodeEntries,
    blogEntries,
  };
}
