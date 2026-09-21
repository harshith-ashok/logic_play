<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { useRouter } from "vue-router";
import Badge from "../components/ui/Badge.vue";
import GridBar from "../components/ui/GridBar.vue";
import AccountTabs from "../components/ui/AccountTabs.vue";
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

const initials = computed(() =>
  `${profile.value?.first_name?.[0] ?? ""}${profile.value?.last_name?.[0] ?? ""}`.toUpperCase() || "LP",
);

const roleLabel: Record<string, string> = {
  core_team: "Core Team",
  member: "Member",
  volunteer: "Volunteer",
};
</script>

<template>
  <div class="wrap py-10 md:py-16">
    <div ref="section" class="mx-auto max-w-3xl">
      <div class="account-block mb-8 flex flex-wrap items-start justify-between gap-5">
        <div class="flex items-center gap-4 sm:gap-5">
          <div
            class="grid h-16 w-16 shrink-0 place-items-center rounded-full border border-border-strong bg-linear-to-br from-accent-dim to-bg-elevated font-mono text-xl font-bold sm:h-19 sm:w-19"
            aria-hidden="true"
          >
            {{ initials }}
          </div>
          <div class="min-w-0">
            <h1 class="page-title mb-1.5">Account</h1>
            <p v-if="profile" class="truncate font-mono text-[13px] text-fg-subtle">
              <b class="font-medium text-fg-muted">{{ profile.username }}</b> · {{ roleLabel[profile.role] }}
            </p>
          </div>
        </div>
        <button type="button" class="cursor-pointer border-none bg-transparent p-0" @click="handleSignOut">
          <Badge as="span" interactive>Log out</Badge>
        </button>
      </div>

      <AccountTabs class="account-block" />

      <form
        class="account-block card px-5 py-7 sm:px-10 sm:py-10"
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
