<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { gsap } from "gsap";
import Badge from "../components/ui/Badge.vue";
import GridBar from "../components/ui/GridBar.vue";
import HalftoneMark from "../components/ui/HalftoneMark.vue";
import TeamCard from "../components/ui/TeamCard.vue";
import { useScrollReveal } from "../composables/useScrollReveal";
import { useTeamMembers } from "../composables/useTeamMembers";
import { useSiteSettings } from "../composables/useSiteSettings";
import { perks } from "../data/perks";
import { domains, type Domain } from "../data/domains";
import smallWhite from "../assets/transparent/small_white.png";

const { members } = useTeamMembers();
const { settings } = useSiteSettings();

const hero = ref<HTMLElement | null>(null);
const perksSection = ref<HTMLElement | null>(null);
const domainsSection = ref<HTMLElement | null>(null);
const teamSection = ref<HTMLElement | null>(null);
const joinSection = ref<HTMLElement | null>(null);

useScrollReveal(perksSection, { selector: ".perk-card" });
useScrollReveal(teamSection, { selector: ".team-card" });
useScrollReveal(joinSection);
useScrollReveal(domainsSection, { selector: ".domain-tag", stagger: 0.04 });

const pad = (n: number) => String(n).padStart(2, "0");
// Hovering (or focusing/tapping) a focus-area pill opens its popover. It is
// positioned so it always stays inside the viewport gutter, which matters on
// narrow phone screens where a fixed-width popover would run off the edge.
const activeDomain = ref<Domain | null>(null);
const popoverStyle = ref<Record<string, string>>({});
const GUTTER = 16;

function openDomain(domain: Domain, event: Event) {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  const width = Math.min(352, window.innerWidth - GUTTER * 2);
  const left = Math.min(Math.max(rect.left, GUTTER), window.innerWidth - width - GUTTER);
  popoverStyle.value = { width: `${width}px`, left: `${left - rect.left}px` };
  activeDomain.value = domain;
}

// Touch has no hover-out and iOS doesn't focus tapped buttons, so tapping
// anywhere outside the pills closes the popover.
function closeOnOutsidePress(event: PointerEvent) {
  if (!(event.target as HTMLElement).closest(".domain-tag")) activeDomain.value = null;
}

onMounted(() => {
  document.addEventListener("pointerdown", closeOnOutsidePress, { passive: true });

  if (hero.value && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    // Shorter travel and tighter stagger on phones so the entrance feels quick.
    const mobile = window.matchMedia("(max-width: 639px)").matches;
    gsap.fromTo(
      hero.value.querySelectorAll(".hero-punch"),
      { y: mobile ? 14 : 24, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: mobile ? 0.5 : 0.7,
        stagger: mobile ? 0.06 : 0.1,
        ease: "power3.out",
        force3D: true,
        clearProps: "transform,opacity",
      },
    );
  }
});

onUnmounted(() => document.removeEventListener("pointerdown", closeOnOutsidePress));
</script>

<template>
  <div>
    <!-- Hero -->
    <section
      ref="hero"
      class="bg-grid-lines cursor-glow-bg relative flex min-h-svh flex-col justify-center overflow-hidden px-4 pb-16 pt-28 sm:px-6 sm:py-32"
    >
      <div
        class="pointer-events-none absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-soft opacity-50 blur-[90px] sm:h-150 sm:w-150 sm:blur-[140px]"
      />
      <div
        class="pointer-events-none absolute -left-20 bottom-0 h-56 w-56 rounded-full bg-accent-soft opacity-30 blur-[70px] sm:h-80 sm:w-80 sm:blur-[100px]"
      />
      <div
        class="pointer-events-none absolute right-0 top-0 h-48 w-48 rounded-full bg-accent-soft opacity-25 blur-[60px] sm:h-64 sm:w-64 sm:blur-[90px]"
      />
      <img
        :src="smallWhite"
        alt=""
        aria-hidden="true"
        class="brand-mark pointer-events-none absolute right-0 top-1/2 h-56 w-auto -translate-y-1/2 translate-x-1/4 opacity-[0.06] sm:h-105"
      />

      <div class="relative mx-auto flex w-full max-w-6xl flex-col gap-6 sm:gap-8">
        <Badge
          v-if="settings?.announcement_text"
          :as="settings.announcement_link ? 'a' : 'div'"
          :href="settings.announcement_link ?? undefined"
          interactive
          class="hero-punch w-full max-w-3xl justify-between! gap-3 border-accent! px-4! py-5! text-left sm:gap-4 sm:px-8! sm:py-7!"
        >
          <span class="flex min-w-0 items-center gap-3 sm:gap-4">
            <span
              class="shrink-0 bg-accent px-2 py-1 font-display text-[10px] uppercase tracking-tight text-bg"
            >
              News
            </span>
            <span class="min-w-0 text-xs leading-snug tracking-normal sm:text-sm">
              {{ settings.announcement_text }}
            </span>
          </span>
          <span v-if="settings.announcement_link" class="shrink-0 text-lg" aria-hidden="true">&rarr;</span>
        </Badge>

        <!-- Sized in vw so the longest line (18 mono chars) fits from 320px phones up. -->
        <h1
          class="hero-punch flex flex-col font-display text-[clamp(1.5rem,8.4vw,6.5rem)] font-black uppercase leading-[0.92] tracking-tighter text-fg"
        >
          <span class="whitespace-nowrap">Stop Consuming</span>
          <span class="self-end whitespace-nowrap text-fg-muted">Technology.</span>
          <span class="whitespace-nowrap">Start Building It.</span>
        </h1>

        <p
          class="hero-punch max-w-md font-sans text-sm leading-relaxed text-fg-muted"
        >
          Logic Play is SRM's AI-focused builder's club — real projects, real
          hackathons, real mentors. Not another resume line.
        </p>

        <div class="hero-punch flex flex-wrap gap-2">
          <Badge
            v-for="(perk, i) in perks.slice(0, 3)"
            :key="perk.title"
            size="sm"
          >
            {{ pad(i + 1) }} / {{ perk.title }}
          </Badge>
        </div>

        <div class="hero-punch">
          <Badge
            :href="settings?.join_link"
            tone="solid"
            size="lg"
            interactive
            arrow
            class="w-full sm:w-auto"
          >
            Join the Club
          </Badge>
        </div>
      </div>
    </section>

    <GridBar />

    <!-- What we do -->
    <section ref="perksSection" class="py-20">
      <div class="mx-auto max-w-6xl px-4 sm:px-6">
        <h2
          class="mb-12 font-display text-3xl text-center uppercase tracking-tight sm:text-4xl"
        >
          What We Do
        </h2>
      </div>
      <div
        class="glass-surface relative grid grid-cols-1 divide-y divide-border sm:grid-cols-2 sm:divide-x"
      >
        <div
          v-for="(perk, i) in perks"
          :key="perk.title"
          class="perk-card relative flex flex-col gap-3 overflow-hidden p-8 sm:p-10 lg:p-14"
          :class="
            perks.length % 2 === 1 && i === perks.length - 1 && 'sm:col-span-2'
          "
        >
          <HalftoneMark
            :size="64"
            :opacity="0.08"
            color="var(--color-accent)"
            class="pointer-events-none absolute -right-3 -top-3"
          />
          <span class="font-display text-xs tracking-widest text-fg-subtle">
            {{ pad(i + 1) }} /
          </span>
          <span class="font-display text-lg uppercase tracking-tight">
            {{ perk.title }}
          </span>
          <span class="font-sans text-sm tracking-normal text-fg-muted">
            {{ perk.description }}
          </span>
        </div>
      </div>
    </section>

    <GridBar />

    <!-- Focus areas (from club brief) -->
    <section
      ref="domainsSection"
      class="cursor-glow-bg relative z-10 bg-bg-elevated px-4 py-14 sm:px-6 sm:py-20"
    >
      <div class="relative mx-auto max-w-6xl">
        <h2 class="mb-8 font-display text-3xl uppercase tracking-tight sm:text-4xl">
          Focus Areas
        </h2>
        <div class="flex flex-wrap gap-2 sm:gap-4">
          <div
            v-for="domain in domains"
            :key="domain.name"
            class="domain-tag relative"
            :class="activeDomain === domain && 'z-30'"
            @mouseenter="openDomain(domain, $event)"
            @mouseleave="activeDomain = null"
            @focusin="openDomain(domain, $event)"
            @focusout="activeDomain = null"
          >
            <Badge
              as="button"
              type="button"
              size="md"
              interactive
              class="px-4! py-2.5! text-xs! normal-case sm:px-5! sm:text-sm!"
              :class="activeDomain === domain && 'border-accent!'"
              @click="openDomain(domain, $event)"
            >
              {{ domain.name }}
            </Badge>

            <Transition name="domain-pop">
              <div
                v-if="activeDomain === domain"
                class="absolute top-full z-30 pt-2"
                :style="popoverStyle"
                role="tooltip"
              >
                <div class="flex flex-col gap-4 border border-border-strong bg-bg p-5 text-left">
                  <div class="flex flex-col gap-1.5">
                    <span class="font-display text-sm uppercase tracking-tight">{{ domain.name }}</span>
                    <span class="font-sans text-xs leading-relaxed text-fg-muted">{{ domain.summary }}</span>
                  </div>
                  <div class="flex flex-col gap-1.5">
                    <span class="font-display text-[10px] uppercase tracking-widest text-fg-subtle">Roles</span>
                    <ul class="flex flex-col gap-1 font-sans text-xs text-fg-muted">
                      <li v-for="role in domain.roles" :key="role">+ {{ role }}</li>
                    </ul>
                  </div>
                  <div class="flex flex-col gap-1.5">
                    <span class="font-display text-[10px] uppercase tracking-widest text-fg-subtle">Projects</span>
                    <ul class="flex flex-col gap-1 font-sans text-xs text-fg-muted">
                      <li v-for="project in domain.projects" :key="project">+ {{ project }}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </div>
    </section>

    <GridBar />

    <!-- Team -->
    <section ref="teamSection" class="px-4 py-20 sm:px-6">
      <div class="mx-auto max-w-6xl">
        <div class="mb-12 flex flex-wrap items-end justify-between gap-4">
          <h2
            class="font-display text-3xl uppercase tracking-tight sm:text-4xl"
          >
            Team
          </h2>
          <Badge to="/team" size="sm" interactive arrow>Full Team</Badge>
        </div>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <TeamCard v-for="member in members" :key="member.id" :member="member" />
        </div>
      </div>
    </section>

    <GridBar />

    <!-- Join CTA -->
    <section
      id="join"
      ref="joinSection"
      class="relative overflow-hidden px-4 py-24 text-center sm:px-6"
    >
      <div
        class="pointer-events-none absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-soft opacity-30 blur-[90px] sm:h-105 sm:w-105 sm:blur-[140px]"
      />
      <div class="relative mx-auto flex max-w-2xl flex-col items-center gap-6">
        <h2 class="font-display text-3xl uppercase tracking-tight sm:text-5xl">
          Ready to build?
        </h2>
        <p class="font-sans text-sm text-fg-muted">
          Tell us what you build. Applications are reviewed on a rolling basis.
        </p>
        <div class="flex flex-wrap justify-center gap-3">
          <Badge
            :href="settings?.join_link"
            tone="solid"
            size="lg"
            interactive
            arrow
          >
            Apply to Join
          </Badge>
          <!-- <Badge as="a" href="#" size="lg" interactive>
            Join the Discord
          </Badge> -->
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.domain-pop-enter-active,
.domain-pop-leave-active {
  transition:
    opacity 0.15s var(--ease-mechanical),
    transform 0.15s var(--ease-mechanical);
}
.domain-pop-enter-from,
.domain-pop-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
