<script setup lang="ts">
import { reactive, ref } from "vue";
import Badge from "../components/ui/Badge.vue";
import GridBar from "../components/ui/GridBar.vue";
import HalftoneMark from "../components/ui/HalftoneMark.vue";
import { useScrollReveal } from "../composables/useScrollReveal";
import { joinDomains } from "../data/joinDomains";
import { supabase, getSupabase } from "../lib/supabase";

const section = ref<HTMLElement | null>(null);
useScrollReveal(section, { selector: ".join-block" });

const form = reactive({
  name: "",
  registration_number: "",
  phone_number: "",
  year: "",
  domain: "",
  contribution: "",
  linkedin_url: "",
  project_link: "",
  github_url: "",
  portfolio_url: "",
});

type Status = "idle" | "submitting" | "success" | "error";
const status = ref<Status>("idle");
const errorMessage = ref("");

const urlPattern = /^https?:\/\//i;
const phonePattern = /^[6-9]\d{9}$/;

const fieldClass =
  "glass-surface w-full rounded-xl border-none! bg-transparent px-4 py-3 font-sans text-sm text-fg placeholder:text-fg-subtle outline-none transition-colors duration-200 focus:border-accent!";

function validate(): string | null {
  if (!form.name.trim()) return "Enter your name.";
  if (!form.registration_number.trim())
    return "Enter your registration number.";
  if (!phonePattern.test(form.phone_number.trim()))
    return "Enter a valid 10-digit phone number.";
  if (!form.year) return "Select your year.";
  if (!form.domain) return "Select a domain.";
  if (!form.contribution.trim()) return "Tell us how you'd contribute.";
  if (!urlPattern.test(form.linkedin_url.trim()))
    return "Enter a valid LinkedIn URL (starting with http:// or https://).";

  const optionalUrls: [string, string][] = [
    [form.project_link, "project link"],
    [form.github_url, "GitHub URL"],
    [form.portfolio_url, "portfolio URL"],
  ];
  for (const [value, label] of optionalUrls) {
    if (value.trim() && !urlPattern.test(value.trim()))
      return `Enter a valid ${label} (starting with http:// or https://).`;
  }
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
  const client = getSupabase();
  if (!client) {
    status.value = "error";
    errorMessage.value =
      "Server configuration error: missing Supabase environment variables. Please contact the site administrator.";
    return;
  }

  const { error } = await client.from("club_recruitments").insert({
    name: form.name.trim(),
    registration_number: form.registration_number.trim(),
    phone_number: form.phone_number.trim(),
    year: Number(form.year),
    domain: form.domain,
    contribution: form.contribution.trim(),
    linkedin_url: form.linkedin_url.trim(),
    project_link: form.project_link.trim() || null,
    github_url: form.github_url.trim() || null,
    portfolio_url: form.portfolio_url.trim() || null,
  });

  if (error) {
    status.value = "error";
    errorMessage.value =
      error.code === "23505"
        ? "That registration number has already applied."
        : "Something went wrong on our end. Please try again.";
    return;
  }

  status.value = "success";
}
</script>

<template>
  <div class="px-4 py-28 sm:px-6">
    <div ref="section" class="mx-auto max-w-2xl">
      <h1
        class="join-block mb-4 font-display text-3xl uppercase tracking-tight sm:text-5xl"
      >
        Join the Club
      </h1>
      <p class="join-block mb-12 max-w-xl font-sans text-sm text-fg-muted">
        No resume padding, no fluff. Tell us what you build and where you want
        to take it — applications are reviewed on a rolling basis.
      </p>

      <div
        v-if="status === 'success'"
        class="join-block glass-surface relative flex flex-col items-center gap-4 overflow-hidden rounded-3xl px-6 py-16 text-center sm:px-10"
      >
        <HalftoneMark :size="40" color="var(--color-accent)" />
        <h2 class="font-display text-xl uppercase tracking-tight sm:text-2xl">
          Application received
        </h2>
        <p class="max-w-sm font-sans text-sm text-fg-muted">
          We'll review it and get back to you over WhatsApp or your registered
          email. Welcome to the underdog builders.
        </p>
        <Badge to="/" size="sm" interactive arrow class="mt-2">
          Back home
        </Badge>
      </div>

      <form
        v-else
        class="join-block glass-surface relative overflow-hidden rounded-3xl px-6 py-8 sm:px-10 sm:py-12"
        novalidate
        @submit.prevent="handleSubmit"
      >
        <div class="grid gap-6 sm:grid-cols-2">
          <label class="flex flex-col gap-2">
            <span
              class="font-display text-xs uppercase tracking-tight text-fg-subtle"
            >
              01 / Full Name
            </span>
            <input
              v-model="form.name"
              type="text"
              autocomplete="name"
              placeholder="Jane Doe"
              :class="fieldClass"
            />
          </label>

          <label class="flex flex-col gap-2">
            <span
              class="font-display text-xs uppercase tracking-tight text-fg-subtle"
            >
              02 / Registration Number
            </span>
            <input
              v-model="form.registration_number"
              type="text"
              placeholder="RA2211000000000"
              :class="fieldClass"
            />
          </label>

          <label class="flex flex-col gap-2">
            <span
              class="font-display text-xs uppercase tracking-tight text-fg-subtle"
            >
              03 / Phone Number
            </span>
            <input
              v-model="form.phone_number"
              type="tel"
              inputmode="numeric"
              maxlength="10"
              autocomplete="tel"
              placeholder="9876543210"
              :class="fieldClass"
            />
          </label>

          <label class="flex flex-col gap-2">
            <span
              class="font-display text-xs uppercase tracking-tight text-fg-subtle"
            >
              04 / Year
            </span>
            <select v-model="form.year" :class="[fieldClass, 'cursor-pointer']">
              <option value="" disabled>Select year</option>
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
            </select>
          </label>

          <label class="flex flex-col gap-2 sm:col-span-2">
            <span
              class="font-display text-xs uppercase tracking-tight text-fg-subtle"
            >
              05 / Domain
            </span>
            <select
              v-model="form.domain"
              :class="[fieldClass, 'cursor-pointer']"
            >
              <option value="" disabled>Select domain</option>
              <option v-for="d in joinDomains" :key="d" :value="d">
                {{ d }}
              </option>
            </select>
          </label>

          <label class="flex flex-col gap-2 sm:col-span-2">
            <span
              class="font-display text-xs uppercase tracking-tight text-fg-subtle"
            >
              06 / How Would You Contribute
            </span>
            <textarea
              v-model="form.contribution"
              rows="4"
              placeholder="What would you build, lead, or bring to the club?"
              :class="[fieldClass, 'resize-none']"
            />
          </label>

          <label class="flex flex-col gap-2 sm:col-span-2">
            <span
              class="font-display text-xs uppercase tracking-tight text-fg-subtle"
            >
              07 / LinkedIn URL
            </span>
            <input
              v-model="form.linkedin_url"
              type="url"
              placeholder="https://linkedin.com/in/..."
              :class="fieldClass"
            />
          </label>

          <label class="flex flex-col gap-2 sm:col-span-2">
            <span
              class="font-display text-xs uppercase tracking-tight text-fg-subtle"
            >
              08 / Project or Research Link
              <span class="normal-case text-fg-subtle/70">(optional)</span>
            </span>
            <input
              v-model="form.project_link"
              type="url"
              placeholder="https://..."
              :class="fieldClass"
            />
          </label>

          <label class="flex flex-col gap-2">
            <span
              class="font-display text-xs uppercase tracking-tight text-fg-subtle"
            >
              09 / GitHub
              <span class="normal-case text-fg-subtle/70">(optional)</span>
            </span>
            <input
              v-model="form.github_url"
              type="url"
              placeholder="https://github.com/..."
              :class="fieldClass"
            />
          </label>

          <label class="flex flex-col gap-2">
            <span
              class="font-display text-xs uppercase tracking-tight text-fg-subtle"
            >
              10 / Portfolio
              <span class="normal-case text-fg-subtle/70">(optional)</span>
            </span>
            <input
              v-model="form.portfolio_url"
              type="url"
              placeholder="https://..."
              :class="fieldClass"
            />
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
              {{
                status === "submitting" ? "Submitting..." : "Submit Application"
              }}
            </Badge>
          </button>
        </div>
      </form>
    </div>

    <GridBar class="mt-24" />
  </div>
</template>
