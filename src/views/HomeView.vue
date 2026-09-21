<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import Badge from "../components/ui/Badge.vue";
import Marquee from "../components/ui/Marquee.vue";
import TeamGrid from "../components/ui/TeamGrid.vue";
import { useCountUp } from "../composables/useCountUp";
import { useScrollReveal } from "../composables/useScrollReveal";
import { useSiteSettings } from "../composables/useSiteSettings";
import { useTeamMembers } from "../composables/useTeamMembers";
import { domains, type Domain } from "../data/domains";
import { perks } from "../data/perks";
import { stats } from "../data/stats";

const { members } = useTeamMembers();
const { settings } = useSiteSettings();

const statsEl = ref<HTMLElement | null>(null);
const statValues = useCountUp(statsEl, stats.map((s) => s.value));

const perksSection = ref<HTMLElement | null>(null);
const domainsSection = ref<HTMLElement | null>(null);
const teamSection = ref<HTMLElement | null>(null);
const joinSection = ref<HTMLElement | null>(null);
const heroCopy = ref<HTMLElement | null>(null);

useScrollReveal(perksSection, { selector: ".perk-row", stagger: 0.08 });
useScrollReveal(domainsSection, { selector: ".domain-tag", stagger: 0.04 });
useScrollReveal(teamSection, { selector: ".team-card", stagger: 0.06 });
useScrollReveal(joinSection);
useScrollReveal(heroCopy, { selector: ".hero-fade", stagger: 0.1 });

const letters = ["A", "B", "C", "D", "E", "F"];

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

onMounted(() => document.addEventListener("pointerdown", closeOnOutsidePress, { passive: true }));
onUnmounted(() => document.removeEventListener("pointerdown", closeOnOutsidePress));

// Word-by-word headline rise (CSS keyframes, staggered by inline delay).
const line1 = ["Stop", "consuming", "technology."];
const line2 = ["Start", "building", "it"];
</script>

<template>
  <div>
    <!-- Hero -->
    <section class="relative overflow-hidden pt-14 md:pt-24">
      <div ref="heroCopy" class="wrap">
        <component
          :is="settings?.announcement_link ? 'a' : 'div'"
          v-if="settings?.announcement_text"
          :href="settings.announcement_link ?? undefined"
          class="hero-fade mb-8 inline-flex max-w-full items-center gap-2.5 border border-accent-dim bg-accent-soft px-3.5 py-2.5 font-mono text-xs text-accent md:mb-9"
        >
          <span class="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" style="animation: blink 1.4s steps(1) infinite" />
          <span class="min-w-0 leading-snug">{{ settings.announcement_text }}</span>
          <span v-if="settings.announcement_link" aria-hidden="true">&rarr;</span>
        </component>

        <h1
          class="mb-7 max-w-[15ch] text-[clamp(2.4rem,11vw,5.4rem)] leading-[1.02] font-bold tracking-[-0.02em] md:text-[clamp(3rem,6.6vw,5.4rem)]"
        >
          <template v-for="(w, i) in line1" :key="w">
            <span class="inline-block overflow-hidden align-top" :class="i === 2 && 'headline-fx'">
              <span
                class="inline-block [transform:translate3d(0,115%,0)]"
                :style="{ animation: `wordUp 0.8s var(--ease-spring) ${0.15 + i * 0.07}s forwards` }"
              >{{ w }}</span>
            </span>{{ " " }}
          </template>
          <br />
          <template v-for="(w, i) in line2" :key="w">
            <span class="inline-block overflow-hidden align-top">
              <span
                class="inline-block [transform:translate3d(0,115%,0)]"
                :style="{ animation: `wordUp 0.8s var(--ease-spring) ${0.4 + i * 0.07}s forwards` }"
              >{{ w }}</span>
            </span>{{ " " }}
          </template>
          <span class="inline-block h-[0.85em] w-[0.5ch] translate-y-[0.08em] bg-accent" style="animation: blink 1s steps(1) infinite" aria-hidden="true" />
        </h1>

        <div class="flex flex-col gap-10 pb-12 md:flex-row md:items-end md:gap-16 md:pb-16">
          <div class="hero-fade max-w-115">
            <p class="mb-6 max-w-[42ch] text-[15.5px] text-fg-muted">
              Logic Play is SRM's AI-focused builder's club — real projects, real
              hackathons, real mentors. Not another resume line.
            </p>
            <div class="flex flex-wrap gap-3">
              <Badge :href="settings?.join_link" tone="solid" interactive arrow class="magnetic">Join the Club</Badge>
              <Badge href="#projects" interactive class="magnetic">See what we do</Badge>
            </div>
          </div>

          <div ref="statsEl" class="hero-fade flex w-full justify-between gap-6 md:ml-auto md:w-auto md:justify-start md:gap-10">
            <div v-for="(s, i) in stats" :key="s.label">
              <b class="block font-mono text-[1.6rem] font-bold tabular-nums md:text-[1.9rem]">{{ statValues[i] }}{{ s.suffix }}</b>
              <span class="text-[11.5px] tracking-wide text-fg-subtle uppercase">{{ s.label }}</span>
            </div>
          </div>
        </div>
      </div>

      <Marquee />
    </section>

    <!-- What we do -->
    <section id="projects" ref="perksSection" class="section scroll-mt-16">
      <div class="wrap">
        <div class="mb-9 flex flex-wrap items-end justify-between gap-x-6 gap-y-2 md:mb-11">
          <h2 class="sec-title">What we do</h2>
          <span class="max-w-[36ch] font-mono text-[13px] text-fg-subtle">how members spend their time here</span>
        </div>
        <div class="border-t border-border">
          <div
            v-for="(perk, i) in perks"
            :key="perk.title"
            class="perk-row group relative grid grid-cols-[2rem_1fr] items-baseline gap-x-4 gap-y-1.5 border-b border-border py-6 transition-[background-color,padding] duration-300 hover:bg-fg/[0.02] md:grid-cols-[90px_1fr_1.4fr] md:gap-6 md:py-8 md:hover:pl-3.5"
          >
            <span
              class="absolute inset-y-0 left-0 w-0.5 origin-top scale-y-0 bg-accent transition-transform duration-400 group-hover:scale-y-100"
              aria-hidden="true"
            />
            <span class="font-mono text-[12.5px] text-fg-subtle transition-colors duration-300 group-hover:text-accent">
              {{ letters[i] ?? i + 1 }}
            </span>
            <h3 class="text-lg font-semibold md:text-xl">{{ perk.title }}</h3>
            <p class="col-start-2 max-w-[48ch] text-[14.5px] text-fg-muted md:col-start-auto">{{ perk.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Focus areas -->
    <section ref="domainsSection" class="section relative z-10 bg-bg-elevated/40">
      <div class="wrap">
        <div class="mb-9 flex flex-wrap items-end justify-between gap-x-6 gap-y-2 md:mb-11">
          <h2 class="sec-title">Focus areas</h2>
          <span class="max-w-[36ch] font-mono text-[13px] text-fg-subtle">what you'll actually be working with</span>
        </div>
        <div class="flex flex-wrap gap-2.5">
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
            <button
              type="button"
              class="cursor-pointer border px-3.5 py-2.5 font-mono text-xs uppercase transition-[border-color,color,background-color,translate,rotate] duration-300 hover:-translate-y-1 hover:-rotate-2 hover:border-accent hover:bg-accent hover:text-white"
              :class="
                activeDomain === domain
                  ? 'border-accent bg-accent text-white'
                  : 'border-border text-fg-muted'
              "
              @click="openDomain(domain, $event)"
            >
              {{ domain.name }}
            </button>

            <Transition name="domain-pop">
              <div
                v-if="activeDomain === domain"
                class="absolute top-full z-30 pt-2"
                :style="popoverStyle"
                role="tooltip"
              >
                <div class="flex flex-col gap-4 border border-border-strong bg-bg p-5 text-left shadow-[0_20px_40px_-20px_rgba(0,0,0,0.6)]">
                  <div class="flex flex-col gap-1.5">
                    <span class="font-mono text-xs font-semibold uppercase">{{ domain.name }}</span>
                    <span class="text-xs leading-relaxed text-fg-muted">{{ domain.summary }}</span>
                  </div>
                  <div class="flex flex-col gap-1.5">
                    <span class="label">Roles</span>
                    <ul class="flex flex-col gap-1 text-xs text-fg-muted">
                      <li v-for="role in domain.roles" :key="role">+ {{ role }}</li>
                    </ul>
                  </div>
                  <div class="flex flex-col gap-1.5">
                    <span class="label">Projects</span>
                    <ul class="flex flex-col gap-1 text-xs text-fg-muted">
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

    <!-- Team -->
    <section id="team" ref="teamSection" class="section scroll-mt-16">
      <div class="wrap">
        <div class="mb-9 flex flex-wrap items-end justify-between gap-4 md:mb-11">
          <h2 class="sec-title">Team</h2>
          <Badge to="/team" interactive arrow>Full team</Badge>
        </div>
        <TeamGrid :members="members" />
      </div>
    </section>

    <!-- Join CTA -->
    <section id="join" ref="joinSection" class="section relative overflow-hidden text-center scroll-mt-16">
      <span
        v-for="n in 3"
        :key="n"
        class="pointer-events-none absolute top-1/2 left-1/2 h-225 w-225 rounded-full border border-border"
        :style="{ animation: `ringExpand 6s ease-out ${(n - 1) * 2}s infinite`, opacity: 0 }"
        aria-hidden="true"
      />
      <div class="wrap relative">
        <h2 class="mb-3 text-[clamp(1.8rem,5vw,2.8rem)] leading-tight font-bold tracking-[-0.01em]">Ready to build?</h2>
        <p class="mb-8 text-fg-muted">Tell us what you build. Applications are reviewed on a rolling basis.</p>
        <Badge :href="settings?.join_link" tone="solid" size="lg" interactive arrow class="magnetic">Apply to join</Badge>
      </div>
    </section>
  </div>
</template>

<style scoped>
.headline-fx {
  color: transparent;
  -webkit-text-stroke: 1.5px var(--color-fg-subtle);
  cursor: default;
}
.headline-fx:hover {
  animation: glitch 0.5s steps(2) 1;
}
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
