<script setup lang="ts">
import { reactive, ref, watch } from "vue";
import { useRouter } from "vue-router";
import Badge from "../components/ui/Badge.vue";
import GridBar from "../components/ui/GridBar.vue";
import Input from "../components/ui/Input.vue";
import { useAuth } from "../composables/useAuth";
import { useScrollReveal } from "../composables/useScrollReveal";

const router = useRouter();
const { profile, updateProfile, signOut } = useAuth();

const section = ref<HTMLElement | null>(null);
useScrollReveal(section, { selector: ".account-block" });

const form = reactive({
  firstName: "",
  lastName: "",
  githubUsername: "",
  linkedinUrl: "",
  leetcodeUsername: "",
});

watch(
  profile,
  (p) => {
    if (!p) return;
    form.firstName = p.first_name;
    form.lastName = p.last_name;
    form.githubUsername = p.github_username ?? "";
    form.linkedinUrl = p.linkedin_url ?? "";
    form.leetcodeUsername = p.leetcode_username ?? "";
  },
  { immediate: true },
);

type Status = "idle" | "submitting" | "success" | "error";
const status = ref<Status>("idle");
const errorMessage = ref("");

const urlPattern = /^https?:\/\//i;
const handlePattern = /^[a-zA-Z0-9-_]{1,39}$/;

async function handleSave() {
  if (!form.firstName.trim() || !form.lastName.trim()) {
    status.value = "error";
    errorMessage.value = "First and last name are required.";
    return;
  }
  if (form.githubUsername.trim() && !handlePattern.test(form.githubUsername.trim())) {
    status.value = "error";
    errorMessage.value = "Enter a valid GitHub username.";
    return;
  }
  if (form.leetcodeUsername.trim() && !handlePattern.test(form.leetcodeUsername.trim())) {
    status.value = "error";
    errorMessage.value = "Enter a valid LeetCode username.";
    return;
  }
  if (form.linkedinUrl.trim() && !urlPattern.test(form.linkedinUrl.trim())) {
    status.value = "error";
    errorMessage.value = "Enter a valid LinkedIn URL.";
    return;
  }

  status.value = "submitting";
  errorMessage.value = "";
  const { error } = await updateProfile({
    first_name: form.firstName.trim(),
    last_name: form.lastName.trim(),
    github_username: form.githubUsername.trim() || null,
    linkedin_url: form.linkedinUrl.trim() || null,
    leetcode_username: form.leetcodeUsername.trim() || null,
  });

  if (error) {
    status.value = "error";
    errorMessage.value = error;
    return;
  }
  status.value = "success";
}

async function handleSignOut() {
  await signOut();
  router.push("/");
}

const roleLabel: Record<string, string> = {
  core_team: "Core Team",
  member: "Member",
  volunteer: "Volunteer",
};
</script>

<template>
  <div class="px-4 py-28 sm:px-6">
    <div ref="section" class="mx-auto max-w-2xl">
      <div class="account-block mb-12 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 class="mb-2 font-display text-3xl uppercase tracking-tight sm:text-5xl">
            Account
          </h1>
          <p v-if="profile" class="font-sans text-sm text-fg-muted">
            {{ profile.username }} · {{ roleLabel[profile.role] }}
          </p>
        </div>
        <button
          type="button"
          class="cursor-pointer border-none bg-transparent p-0"
          @click="handleSignOut"
        >
          <Badge as="span" size="sm" interactive>Log out</Badge>
        </button>
      </div>

      <div v-if="profile" class="account-block mb-8 flex flex-wrap gap-3">
        <Badge v-if="profile.role === 'core_team'" to="/admin" size="sm" interactive>
          Admin
        </Badge>
        <Badge v-if="profile.role !== 'volunteer'" to="/blog/dashboard" size="sm" interactive>
          My posts
        </Badge>
        <Badge v-if="profile.role !== 'volunteer'" to="/leaderboard" size="sm" interactive>
          Leaderboard
        </Badge>
        <Badge to="/events-attended" size="sm" interactive>
          Events Attended
        </Badge>
      </div>

      <form
        class="account-block glass-surface relative overflow-hidden rounded-3xl px-6 py-8 sm:px-10 sm:py-12"
        novalidate
        @submit.prevent="handleSave"
      >
        <div class="grid gap-6 sm:grid-cols-2">
          <label class="flex flex-col gap-2">
            <span class="font-display text-xs uppercase tracking-tight text-fg-subtle">
              First Name
            </span>
            <Input v-model="form.firstName" autocomplete="given-name" />
          </label>

          <label class="flex flex-col gap-2">
            <span class="font-display text-xs uppercase tracking-tight text-fg-subtle">
              Last Name
            </span>
            <Input v-model="form.lastName" autocomplete="family-name" />
          </label>

          <label class="flex flex-col gap-2">
            <span class="font-display text-xs uppercase tracking-tight text-fg-subtle">
              Registration Number
            </span>
            <Input :model-value="profile?.registration_number ?? ''" readonly />
          </label>

          <label class="flex flex-col gap-2">
            <span class="font-display text-xs uppercase tracking-tight text-fg-subtle">
              Username
            </span>
            <Input :model-value="profile?.username ?? ''" readonly />
          </label>

          <label class="flex flex-col gap-2">
            <span class="font-display text-xs uppercase tracking-tight text-fg-subtle">
              GitHub Username
            </span>
            <Input v-model="form.githubUsername" />
          </label>

          <label class="flex flex-col gap-2">
            <span class="font-display text-xs uppercase tracking-tight text-fg-subtle">
              LeetCode Username
            </span>
            <Input v-model="form.leetcodeUsername" />
          </label>

          <label class="flex flex-col gap-2 sm:col-span-2">
            <span class="font-display text-xs uppercase tracking-tight text-fg-subtle">
              LinkedIn URL
            </span>
            <Input v-model="form.linkedinUrl" type="url" />
          </label>
        </div>

        <p v-if="status === 'error'" class="mt-6 font-sans text-sm text-accent">
          {{ errorMessage }}
        </p>
        <p v-if="status === 'success'" class="mt-6 font-sans text-sm text-fg-muted">
          Saved.
        </p>

        <div class="mt-8 flex justify-end">
          <button
            type="submit"
            :disabled="status === 'submitting'"
            class="cursor-pointer border-none bg-transparent p-0 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Badge as="span" tone="solid" size="lg" interactive arrow>
              {{ status === "submitting" ? "Saving..." : "Save Changes" }}
            </Badge>
          </button>
        </div>
      </form>
    </div>

    <GridBar class="mt-24" />
  </div>
</template>
