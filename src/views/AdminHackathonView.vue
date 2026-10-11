<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import AccountTabs from "../components/ui/AccountTabs.vue";
import Badge from "../components/ui/Badge.vue";
import GridBar from "../components/ui/GridBar.vue";
import DrawPanel from "../components/hackathon/DrawPanel.vue";
import OptionsPanel from "../components/hackathon/OptionsPanel.vue";
import OverviewCards from "../components/hackathon/OverviewCards.vue";
import SettingsPanel from "../components/hackathon/SettingsPanel.vue";
import TeamsPanel from "../components/hackathon/TeamsPanel.vue";
import { useHackathonAdmin } from "../composables/useHackathonAdmin";
import { useAuth } from "../composables/useAuth";

const route = useRoute();
const router = useRouter();
const slug = String(route.params.slug);
const admin = useHackathonAdmin(slug);
const { profile } = useAuth();

// UX only: RLS is what actually stops non-admins from reading anything.
const allowed = computed(() => profile.value?.role === "core_team");
const registerPath = `/hackathon/${slug}/register`;

onMounted(admin.load);
</script>

<template>
  <div class="wrap py-10 md:py-16">
    <div class="mx-auto max-w-5xl">
      <AccountTabs />

      <div v-if="!allowed" class="glass-surface px-6 py-12 text-center">
        <h1 class="font-display text-xl uppercase tracking-tight">Not allowed</h1>
        <p class="mt-2 font-sans text-sm text-fg-muted">This page is for the core team.</p>
      </div>

      <p v-else-if="admin.loading.value" class="font-sans text-sm text-fg-muted" role="status">Loading…</p>

      <div v-else-if="admin.error.value" class="glass-surface px-6 py-10 text-center">
        <p class="font-sans text-sm text-accent" role="alert">{{ admin.error.value }}</p>
        <button type="button" class="mt-4 cursor-pointer border-none bg-transparent p-0" @click="admin.load">
          <Badge as="span" size="sm" interactive>Retry</Badge>
        </button>
      </div>

      <div v-else-if="!admin.hackathon.value" class="glass-surface px-6 py-12 text-center">
        <h1 class="font-display text-xl uppercase tracking-tight">Hackathon not found</h1>
        <Badge to="/admin/hackathons" size="sm" interactive class="mt-6">All hackathons</Badge>
      </div>

      <template v-else>
        <router-link to="/admin/hackathons" class="mb-4 inline-block font-mono text-xs uppercase text-fg-muted hover:text-fg">
          ← All hackathons
        </router-link>
        <h1 class="page-title">{{ admin.hackathon.value.name }}</h1>
        <p class="page-sub mb-10">
          Public form:
          <router-link :to="registerPath" class="underline">{{ registerPath }}</router-link>
          · {{ admin.hackathon.value.registration_open ? "registration open" : "registration closed" }}
        </p>

        <OverviewCards :stats="admin.stats.value" class="mb-12" />

        <section class="mb-12">
          <h2 class="mb-4 font-display text-xl uppercase tracking-tight">Draw</h2>
          <DrawPanel :admin="admin" />
        </section>

        <section class="mb-12">
          <h2 class="mb-4 font-display text-xl uppercase tracking-tight">Teams</h2>
          <TeamsPanel :admin="admin" />
        </section>

        <section class="mb-12">
          <h2 class="mb-4 font-display text-xl uppercase tracking-tight">Settings</h2>
          <SettingsPanel :admin="admin" @deleted="router.push('/admin/hackathons')" />
        </section>

        <section>
          <h2 class="mb-4 font-display text-xl uppercase tracking-tight">Options &amp; problems</h2>
          <OptionsPanel :admin="admin" />
        </section>
      </template>
    </div>
    <GridBar class="mt-24" />
  </div>
</template>
