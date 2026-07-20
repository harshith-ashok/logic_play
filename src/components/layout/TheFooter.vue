<script setup lang="ts">
const links = [
  { label: "About", href: "#about" },
  { label: "Domains", href: "#domains" },
  { label: "Projects", href: "#projects" },
  { label: "Timeline", href: "#timeline" },
  { label: "Team", href: "#team" },
];

const social = [
  { label: "GitHub", href: "#" },
  { label: "LinkedIn", href: "#" },
  { label: "X", href: "#" },
  { label: "Mail", href: "#" },
];
</script>

<template>
  <footer class="border-t border-border px-6 py-16">
    <div class="mx-auto flex max-w-6xl flex-col gap-12 lg:flex-row lg:justify-between">
      <div class="max-w-xs">
        <a href="#" class="text-sm font-medium tracking-tight text-text">
          logic<span class="text-accent-blue">_</span>play
        </a>
        <p class="mt-4 text-sm leading-relaxed text-muted">
          A student-run technical club for people who build, break, learn, and repeat.
        </p>
      </div>

      <div class="grid grid-cols-2 gap-12 sm:grid-cols-3">
        <div>
          <h4 class="text-xs uppercase tracking-[0.15em] text-muted">Sections</h4>
          <ul class="mt-4 flex flex-col gap-3">
            <li v-for="link in links" :key="link.href">
              <a :href="link.href" class="text-sm text-muted transition-colors duration-200 hover:text-text">
                {{ link.label }}
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h4 class="text-xs uppercase tracking-[0.15em] text-muted">Connect</h4>
          <ul class="mt-4 flex flex-col gap-3">
            <li v-for="item in social" :key="item.label">
              <a :href="item.href" class="text-sm text-muted transition-colors duration-200 hover:text-text">
                {{ item.label }}
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <div class="mx-auto mt-16 flex max-w-6xl flex-col gap-4 border-t border-border pt-8 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
      <p>© {{ new Date().getFullYear() }} Logic Play. All rights reserved.</p>
      <p>Built by the club, for the club.</p>
    </div>
  </footer>
</template>
