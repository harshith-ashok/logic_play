<script setup lang="ts">
import FooterMark from "./FooterMark.vue";

const explore = [
  { to: "/", label: "Home" },
  { to: "/gallery", label: "Gallery" },
  { to: "/events", label: "Events" },
  { to: "/blog", label: "Blog" },
  { to: "/team", label: "Team" },
];
const more = [
  { to: "/join", label: "Join the club" },
  { to: "/stack-roulette", label: "Stack Roulette" },
  { to: "/press", label: "Press kit" },
];

// TBA: swap in real handles once socials exist.
const socials = [{ label: "Instagram", href: "https://instagram.com/logic_play/" }];

function toTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}
</script>

<template>
  <footer class="ink relative z-10 border-t border-border py-10">
    <div class="wrap">
      <FooterMark />
      <div class="grid gap-10 border-t border-border pt-7 md:grid-cols-[1.3fr_1fr_1fr_auto]">
        <div>
          <span class="font-display mb-2.5 block text-[22px]">Logic Play</span>
          <p class="max-w-[30ch] text-[15px] text-fg-muted">
            An AI-focused innovation club at SRM. Real projects, real research, real mentors.
          </p>
        </div>
        <div>
          <h4 class="mono mb-3 text-fg-subtle">Explore</h4>
          <ul class="grid gap-2">
            <li v-for="l in explore" :key="l.to">
              <router-link :to="l.to" class="text-[15px] text-fg transition-colors duration-300 hover:text-accent">{{ l.label }}</router-link>
            </li>
          </ul>
        </div>
        <div>
          <h4 class="mono mb-3 text-fg-subtle">Club</h4>
          <ul class="grid gap-2">
            <li v-for="l in more" :key="l.to">
              <router-link :to="l.to" class="text-[15px] text-fg transition-colors duration-300 hover:text-accent">{{ l.label }}</router-link>
            </li>
            <li v-for="s in socials" :key="s.label">
              <a :href="s.href" target="_blank" rel="noopener" class="text-[15px] text-fg transition-colors duration-300 hover:text-accent">{{ s.label }}</a>
            </li>
          </ul>
        </div>
        <div class="md:justify-self-end">
          <button type="button" class="btn btn--ghost magnetic" @click="toTop"><span>Back to top ↑</span></button>
        </div>
      </div>
      <div class="mono mt-11 flex flex-col gap-2 text-fg-subtle sm:flex-row sm:justify-between">
        <span>&copy; {{ new Date().getFullYear() }} Logic Play</span>
        <span>
          Built by people who ship. Site by
          <a href="https://github.com/harshith-ashok" target="_blank" rel="noopener noreferrer" class="text-fg underline underline-offset-4 transition-colors duration-300 hover:text-accent">Harshith Ashok</a>
        </span>
      </div>
    </div>
  </footer>
</template>
