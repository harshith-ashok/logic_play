<script setup lang="ts">
import { reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import Badge from "../components/ui/Badge.vue";
import GridBar from "../components/ui/GridBar.vue";
import Input from "../components/ui/Input.vue";
import { useAuth } from "../composables/useAuth";

const route = useRoute();
const router = useRouter();
const { signIn } = useAuth();

const form = reactive({ username: "", password: "" });

type Status = "idle" | "submitting" | "error";
const status = ref<Status>("idle");
const errorMessage = ref("");

async function handleSubmit() {
  if (!form.username.trim() || !form.password) {
    status.value = "error";
    errorMessage.value = "Enter your username and password.";
    return;
  }

  status.value = "submitting";
  errorMessage.value = "";

  const { error } = await signIn(form.username.trim().toLowerCase(), form.password);
  if (error) {
    status.value = "error";
    errorMessage.value = error;
    return;
  }

  const redirect = typeof route.query.redirect === "string" ? route.query.redirect : "/account";
  router.push(redirect);
}
</script>

<template>
  <div class="wrap py-10 md:py-16">
    <div class="mx-auto max-w-md">
      <h1 class="page-title">
        Log In
      </h1>
      <p class="page-sub mb-10">
        Welcome back. Sign in to access your account.
      </p>

      <form
        class="glass-surface relative overflow-hidden px-6 py-8 sm:px-10 sm:py-12"
        novalidate
        @submit.prevent="handleSubmit"
      >
        <div class="grid gap-6">
          <label class="flex flex-col gap-2">
            <span class="font-display text-xs uppercase tracking-tight text-fg-subtle">
              Username
            </span>
            <Input v-model="form.username" autocomplete="username" placeholder="jane_doe" />
          </label>

          <label class="flex flex-col gap-2">
            <span class="font-display text-xs uppercase tracking-tight text-fg-subtle">
              Password
            </span>
            <Input v-model="form.password" type="password" autocomplete="current-password" placeholder="••••••••" />
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
              {{ status === "submitting" ? "Signing in..." : "Log In" }}
            </Badge>
          </button>
        </div>
      </form>

      <p class="mt-6 text-center font-sans text-sm text-fg-muted">
        New here?
        <Badge to="/signup" size="sm" interactive class="ml-2 inline-flex">
          Create an account
        </Badge>
      </p>
    </div>

    <GridBar class="mt-24" />
  </div>
</template>
