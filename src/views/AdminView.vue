<script setup lang="ts">
import AccountTabs from "../components/ui/AccountTabs.vue";
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useAuth, type UserRole } from "../composables/useAuth";
import { useAdminUsers } from "../composables/useAdminUsers";
import Badge from "../components/ui/Badge.vue";
import GridBar from "../components/ui/GridBar.vue";
import Input from "../components/ui/Input.vue";
import { useSiteSettings } from "../composables/useSiteSettings";
import { useTeamMembers, type TeamMemberFields } from "../composables/useTeamMembers";
import { useScrollReveal } from "../composables/useScrollReveal";

const section = ref<HTMLElement | null>(null);
useScrollReveal(section, { selector: ".admin-block" });

const { settings, updateSettings } = useSiteSettings();
const { members, addMember, updateMember, deleteMember } = useTeamMembers();

// --- Users ---

const { profile } = useAuth();
const { users, loading: usersLoading, load: loadUsers, setRole, remove: removeUser } = useAdminUsers();
const userQuery = ref("");
const usersError = ref("");
const roles: UserRole[] = ["core_team", "member", "volunteer"];

const filteredUsers = computed(() => {
  const q = userQuery.value.trim().toLowerCase();
  if (!q) return users.value;
  return users.value.filter((u) =>
    `${u.username} ${u.first_name} ${u.last_name} ${u.registration_number}`.toLowerCase().includes(q),
  );
});

onMounted(async () => {
  usersError.value = (await loadUsers()).error ?? "";
});

async function handleRoleChange(id: string, event: Event) {
  const select = event.target as HTMLSelectElement;
  const { error } = await setRole(id, select.value as UserRole);
  usersError.value = error ?? "";
  if (error) await loadUsers(); // resync the select with the real role
}

async function handleDeleteUser(id: string, username: string) {
  if (!confirm(`Permanently delete ${username}'s account? This can't be undone.`)) return;
  usersError.value = (await removeUser(id)).error ?? "";
}

// --- Site settings ---

const settingsForm = reactive({
  announcementText: "",
  announcementLink: "",
  joinLink: "",
});

watch(
  settings,
  (s) => {
    if (!s) return;
    settingsForm.announcementText = s.announcement_text ?? "";
    settingsForm.announcementLink = s.announcement_link ?? "";
    settingsForm.joinLink = s.join_link;
  },
  { immediate: true },
);

type Status = "idle" | "submitting" | "success" | "error";
const settingsStatus = ref<Status>("idle");
const settingsError = ref("");

const urlPattern = /^https?:\/\//i;

async function handleSaveSettings() {
  if (!settingsForm.joinLink.trim() || !urlPattern.test(settingsForm.joinLink.trim())) {
    settingsStatus.value = "error";
    settingsError.value = "Enter a valid Join Club link (starting with http:// or https://).";
    return;
  }
  if (
    settingsForm.announcementLink.trim() &&
    !urlPattern.test(settingsForm.announcementLink.trim())
  ) {
    settingsStatus.value = "error";
    settingsError.value = "Enter a valid announcement link, or leave it blank.";
    return;
  }

  settingsStatus.value = "submitting";
  settingsError.value = "";
  const { error } = await updateSettings({
    announcement_text: settingsForm.announcementText.trim() || null,
    announcement_link: settingsForm.announcementLink.trim() || null,
    join_link: settingsForm.joinLink.trim(),
  });

  if (error) {
    settingsStatus.value = "error";
    settingsError.value = error;
    return;
  }
  settingsStatus.value = "success";
}

// --- Team roster ---

const editRows = reactive<Record<string, TeamMemberFields>>({});

watch(
  members,
  (list) => {
    for (const m of list) {
      editRows[m.id] = { name: m.name, role: m.role, focus: m.focus, filled: m.filled, sort_order: m.sort_order };
    }
  },
  { immediate: true },
);

const rosterStatus = ref<Status>("idle");
const rosterError = ref("");

async function handleSaveMember(id: string) {
  const fields = editRows[id];
  if (!fields.name.trim() || !fields.role.trim() || !fields.focus.trim()) {
    rosterStatus.value = "error";
    rosterError.value = "Name, role, and focus are required.";
    return;
  }
  rosterStatus.value = "submitting";
  rosterError.value = "";
  const { error } = await updateMember(id, fields);
  rosterStatus.value = error ? "error" : "success";
  if (error) rosterError.value = error;
}

async function handleDeleteMember(id: string, name: string) {
  if (!confirm(`Remove ${name} from the team roster?`)) return;
  const { error } = await deleteMember(id);
  if (error) {
    rosterStatus.value = "error";
    rosterError.value = error;
  }
}

const newMember = reactive<TeamMemberFields>({
  name: "",
  role: "",
  focus: "",
  filled: true,
  sort_order: 0,
});

async function handleAddMember() {
  if (!newMember.name.trim() || !newMember.role.trim() || !newMember.focus.trim()) {
    rosterStatus.value = "error";
    rosterError.value = "Name, role, and focus are required.";
    return;
  }
  rosterStatus.value = "submitting";
  rosterError.value = "";
  const { error } = await addMember({
    ...newMember,
    name: newMember.name.trim(),
    role: newMember.role.trim(),
    focus: newMember.focus.trim(),
    sort_order: members.value.length + 1,
  });
  if (error) {
    rosterStatus.value = "error";
    rosterError.value = error;
    return;
  }
  rosterStatus.value = "success";
  newMember.name = "";
  newMember.role = "";
  newMember.focus = "";
  newMember.filled = true;
}
</script>

<template>
  <div class="wrap py-10 md:py-16">
    <div ref="section" class="mx-auto max-w-4xl">
      <AccountTabs />
      <h1 class="page-title">
        Admin Tools
      </h1>
      <p class="page-sub mb-10">
        Users and roles, the site announcement, the Join link, and the team roster — core team only.
      </p>

      <!-- Users -->
      <section class="admin-block mb-16">
        <h2 class="mb-6 font-display text-xl uppercase tracking-tight">
          Users <span class="text-fg-subtle">({{ users.length }})</span>
        </h2>
        <Input v-model="userQuery" placeholder="Search name, username or reg. number" class="mb-4" />
        <p v-if="usersError" class="mb-4 font-sans text-sm text-accent">{{ usersError }}</p>
        <p v-if="usersLoading" class="font-sans text-sm text-fg-muted">Loading...</p>
        <div v-else class="glass-surface relative divide-y divide-border">
          <div
            v-for="u in filteredUsers"
            :key="u.id"
            class="flex flex-wrap items-center justify-between gap-4 px-6 py-4"
          >
            <div class="min-w-0">
              <p class="truncate font-display text-sm uppercase tracking-tight">
                {{ u.first_name }} {{ u.last_name }}
              </p>
              <p class="truncate font-sans text-xs text-fg-muted">
                @{{ u.username }} · {{ u.registration_number }}
              </p>
            </div>
            <div class="flex items-center gap-2">
              <select
                :value="u.role"
                :disabled="u.id === profile?.id"
                class="border border-border bg-bg px-3 py-2 font-mono text-xs uppercase text-fg disabled:opacity-50"
                :aria-label="`Role for ${u.username}`"
                @change="handleRoleChange(u.id, $event)"
              >
                <option v-for="r in roles" :key="r" :value="r">{{ r.replace('_', ' ') }}</option>
              </select>
              <button
                v-if="u.id !== profile?.id"
                type="button"
                class="cursor-pointer border-none bg-transparent p-0"
                @click="handleDeleteUser(u.id, u.username)"
              >
                <Badge as="span" size="sm" interactive class="border-accent!">Delete</Badge>
              </button>
            </div>
          </div>
          <p v-if="!filteredUsers.length" class="px-6 py-6 font-sans text-sm text-fg-muted">No users found.</p>
        </div>
      </section>

      <!-- Site settings -->
      <section class="admin-block mb-16">
        <h2 class="mb-6 font-display text-xl uppercase tracking-tight">Site Settings</h2>
        <form
          class="glass-surface relative overflow-hidden px-6 py-8 sm:px-10 sm:py-10"
          novalidate
          @submit.prevent="handleSaveSettings"
        >
          <div class="grid gap-6">
            <label class="flex flex-col gap-2">
              <span class="font-display text-xs uppercase tracking-tight text-fg-subtle">
                Announcement Text
                <span class="normal-case text-fg-subtle/70">(blank hides the banner)</span>
              </span>
              <Input v-model="settingsForm.announcementText" placeholder="Recruiting is open..." />
            </label>

            <label class="flex flex-col gap-2">
              <span class="font-display text-xs uppercase tracking-tight text-fg-subtle">
                Announcement Link
                <span class="normal-case text-fg-subtle/70">(optional)</span>
              </span>
              <Input v-model="settingsForm.announcementLink" type="url" placeholder="https://..." />
            </label>

            <label class="flex flex-col gap-2">
              <span class="font-display text-xs uppercase tracking-tight text-fg-subtle">
                Join the Club Link
              </span>
              <Input v-model="settingsForm.joinLink" type="url" placeholder="https://forms.gle/..." />
            </label>
          </div>

          <p v-if="settingsStatus === 'error'" class="mt-6 font-sans text-sm text-accent">
            {{ settingsError }}
          </p>
          <p v-if="settingsStatus === 'success'" class="mt-6 font-sans text-sm text-fg-muted">
            Saved.
          </p>

          <div class="mt-8 flex justify-end">
            <button
              type="submit"
              :disabled="settingsStatus === 'submitting'"
              class="cursor-pointer border-none bg-transparent p-0 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Badge as="span" tone="solid" size="md" interactive arrow>
                {{ settingsStatus === "submitting" ? "Saving..." : "Save Settings" }}
              </Badge>
            </button>
          </div>
        </form>
      </section>

      <!-- Team roster -->
      <section class="admin-block">
        <h2 class="mb-6 font-display text-xl uppercase tracking-tight">Team Roster</h2>

        <p v-if="rosterStatus === 'error'" class="mb-4 font-sans text-sm text-accent">
          {{ rosterError }}
        </p>

        <div class="flex flex-col gap-4">
          <div
            v-for="member in members"
            :key="member.id"
            class="glass-surface relative overflow-hidden px-6 py-6"
          >
            <div v-if="editRows[member.id]" class="grid gap-4 sm:grid-cols-3">
              <label class="flex flex-col gap-2">
                <span class="font-display text-xs uppercase tracking-tight text-fg-subtle">Name</span>
                <Input v-model="editRows[member.id].name" />
              </label>
              <label class="flex flex-col gap-2">
                <span class="font-display text-xs uppercase tracking-tight text-fg-subtle">Role</span>
                <Input v-model="editRows[member.id].role" />
              </label>
              <label class="flex flex-col gap-2">
                <span class="font-display text-xs uppercase tracking-tight text-fg-subtle">Focus</span>
                <Input v-model="editRows[member.id].focus" />
              </label>
            </div>

            <div class="mt-4 flex flex-wrap items-center justify-between gap-4">
              <label v-if="editRows[member.id]" class="flex items-center gap-2 font-sans text-xs text-fg-muted">
                <input type="checkbox" v-model="editRows[member.id].filled" />
                Filled
              </label>
              <div class="ml-auto flex gap-2">
                <button
                  type="button"
                  class="cursor-pointer border-none bg-transparent p-0"
                  @click="handleSaveMember(member.id)"
                >
                  <Badge as="span" size="sm" interactive>Save</Badge>
                </button>
                <button
                  type="button"
                  class="cursor-pointer border-none bg-transparent p-0"
                  @click="handleDeleteMember(member.id, member.name)"
                >
                  <Badge as="span" size="sm" interactive class="border-accent!">Delete</Badge>
                </button>
              </div>
            </div>
          </div>
        </div>

        <form
          class="glass-surface relative mt-6 overflow-hidden px-6 py-6"
          novalidate
          @submit.prevent="handleAddMember"
        >
          <span class="mb-4 block font-display text-xs uppercase tracking-tight text-fg-subtle">
            Add Team Member
          </span>
          <div class="grid gap-4 sm:grid-cols-3">
            <Input v-model="newMember.name" placeholder="Name" />
            <Input v-model="newMember.role" placeholder="Role" />
            <Input v-model="newMember.focus" placeholder="Focus" />
          </div>
          <div class="mt-4 flex items-center justify-between gap-4">
            <label class="flex items-center gap-2 font-sans text-xs text-fg-muted">
              <input type="checkbox" v-model="newMember.filled" />
              Filled
            </label>
            <button
              type="submit"
              :disabled="rosterStatus === 'submitting'"
              class="cursor-pointer border-none bg-transparent p-0 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Badge as="span" tone="solid" size="sm" interactive arrow>Add Member</Badge>
            </button>
          </div>
        </form>
      </section>
    </div>

    <GridBar class="mt-24" />
  </div>
</template>
