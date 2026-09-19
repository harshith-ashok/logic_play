<script setup lang="ts">
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import Badge from "../components/ui/Badge.vue";
import GridBar from "../components/ui/GridBar.vue";
import Input from "../components/ui/Input.vue";
import { useAuth } from "../composables/useAuth";

const router = useRouter();
const { signUp } = useAuth();

const form = reactive({
  username: "",
  password: "",
  confirmPassword: "",
  firstName: "",
  lastName: "",
  registrationNumber: "",
  githubUsername: "",
  linkedinUrl: "",
  leetcodeUsername: "",
});

type Status = "idle" | "submitting" | "error";
const status = ref<Status>("idle");
const errorMessage = ref("");

const usernamePattern = /^[a-z0-9_]{3,20}$/;
const handlePattern = /^[a-zA-Z0-9-_]{1,39}$/;
const urlPattern = /^https?:\/\//i;

function validate(): string | null {
  if (!usernamePattern.test(form.username.trim()))
    return "Username must be 3-20 characters: lowercase letters, numbers, underscores only.";
  if (form.password.length < 6) return "Password must be at least 6 characters.";
  if (form.password !== form.confirmPassword) return "Passwords do not match.";
  if (!form.firstName.trim()) return "Enter your first name.";
  if (!form.lastName.trim()) return "Enter your last name.";
  if (!form.registrationNumber.trim()) return "Enter your registration number.";
  if (form.githubUsername.trim() && !handlePattern.test(form.githubUsername.trim()))
    return "Enter a valid GitHub username.";
  if (form.leetcodeUsername.trim() && !handlePattern.test(form.leetcodeUsername.trim()))
    return "Enter a valid LeetCode username.";
  if (form.linkedinUrl.trim() && !urlPattern.test(form.linkedinUrl.trim()))
    return "Enter a valid LinkedIn URL (starting with http:// or https://).";
  return null;
}

async function handleSubmit() {
  const validationError = validate();
  if (validationError) {
    status.value = "error";
    errorMessage.value = validationError;
    return;
  }

  status.value = "submitting";
  errorMessage.value = "";

  const { error } = await signUp({
    password: form.password,
    username: form.username.trim(),
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    registrationNumber: form.registrationNumber.trim(),
    githubUsername: form.githubUsername.trim() || undefined,
    linkedinUrl: form.linkedinUrl.trim() || undefined,
    leetcodeUsername: form.leetcodeUsername.trim() || undefined,
  });

  if (error) {
    status.value = "error";
    errorMessage.value = error;
    return;
  }

  router.push("/account");
}
</script>

<template>
  <div class="px-4 py-28 sm:px-6">
    <div class="mx-auto max-w-2xl">
      <h1 class="mb-4 font-display text-3xl uppercase tracking-tight sm:text-5xl">
        Create an Account
      </h1>
      <p class="mb-12 max-w-xl font-sans text-sm text-fg-muted">
        Join to track your progress, access member resources, and pitch in.
      </p>

      <form
        class="glass-surface relative overflow-hidden rounded-3xl px-6 py-8 sm:px-10 sm:py-12"
        novalidate
        @submit.prevent="handleSubmit"
      >
        <div class="grid gap-6 sm:grid-cols-2">
          <label class="flex flex-col gap-2">
            <span class="font-display text-xs uppercase tracking-tight text-fg-subtle">
              01 / Username
            </span>
            <Input v-model="form.username" placeholder="jane_doe" autocomplete="username" />
          </label>

          <label class="flex flex-col gap-2">
            <span class="font-display text-xs uppercase tracking-tight text-fg-subtle">
              02 / Password
            </span>
            <Input v-model="form.password" type="password" placeholder="••••••••" autocomplete="new-password" />
          </label>

          <label class="flex flex-col gap-2">
            <span class="font-display text-xs uppercase tracking-tight text-fg-subtle">
              03 / Confirm Password
            </span>
            <Input v-model="form.confirmPassword" type="password" placeholder="••••••••" autocomplete="new-password" />
          </label>

          <label class="flex flex-col gap-2">
            <span class="font-display text-xs uppercase tracking-tight text-fg-subtle">
              04 / First Name
            </span>
            <Input v-model="form.firstName" placeholder="Jane" autocomplete="given-name" />
          </label>

          <label class="flex flex-col gap-2">
            <span class="font-display text-xs uppercase tracking-tight text-fg-subtle">
              05 / Last Name
            </span>
            <Input v-model="form.lastName" placeholder="Doe" autocomplete="family-name" />
          </label>

          <label class="flex flex-col gap-2">
            <span class="font-display text-xs uppercase tracking-tight text-fg-subtle">
              06 / Registration Number
            </span>
            <Input v-model="form.registrationNumber" placeholder="RA2211000000000" />
          </label>

          <label class="flex flex-col gap-2">
            <span class="font-display text-xs uppercase tracking-tight text-fg-subtle">
              07 / GitHub Username
              <span class="normal-case text-fg-subtle/70">(optional)</span>
            </span>
            <Input v-model="form.githubUsername" placeholder="janedoe" />
          </label>

          <label class="flex flex-col gap-2">
            <span class="font-display text-xs uppercase tracking-tight text-fg-subtle">
              08 / LeetCode Username
              <span class="normal-case text-fg-subtle/70">(optional)</span>
            </span>
            <Input v-model="form.leetcodeUsername" placeholder="janedoe" />
          </label>

          <label class="flex flex-col gap-2 sm:col-span-2">
            <span class="font-display text-xs uppercase tracking-tight text-fg-subtle">
              09 / LinkedIn URL
              <span class="normal-case text-fg-subtle/70">(optional)</span>
            </span>
            <Input v-model="form.linkedinUrl" type="url" placeholder="https://linkedin.com/in/..." />
          </label>
        </div>

        <p v-if="status === 'error'" class="mt-6 font-sans text-sm text-accent">
          {{ errorMessage }}
        </p>

        <div class="mt-8 flex justify-end">
          <button
            type="submit"
            :disabled="status === 'submitting'"
            class="cursor-pointer border-none bg-transparent p-0 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Badge as="span" tone="solid" size="lg" interactive arrow>
              {{ status === "submitting" ? "Creating account..." : "Create Account" }}
            </Badge>
          </button>
        </div>
      </form>

      <p class="mt-6 text-center font-sans text-sm text-fg-muted">
        Already have an account?
        <Badge to="/login" size="sm" interactive class="ml-2 inline-flex">
          Log in
        </Badge>
      </p>
    </div>

    <GridBar class="mt-24" />
  </div>
</template>
