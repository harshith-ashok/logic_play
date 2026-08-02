<script setup lang="ts">
import { onMounted, ref } from "vue";
import { gsap } from "gsap";
import Badge from "../components/ui/Badge.vue";
import GridBar from "../components/ui/GridBar.vue";
import HalftoneMark from "../components/ui/HalftoneMark.vue";
import { useScrollReveal } from "../composables/useScrollReveal";
import { perks } from "../data/perks";
import { domains } from "../data/domains";
import { team } from "../data/team";
import { announcement } from "../data/announcement";
import smallWhite from "../assets/transparent/small_white.png";

const hero = ref<HTMLElement | null>(null);
const perksSection = ref<HTMLElement | null>(null);
const domainsSection = ref<HTMLElement | null>(null);
const teamSection = ref<HTMLElement | null>(null);
const joinSection = ref<HTMLElement | null>(null);

useScrollReveal(perksSection, { selector: ".perk-card" });
useScrollReveal(domainsSection, { selector: ".domain-tag", stagger: 0.04 });
useScrollReveal(teamSection, { selector: ".team-card" });
useScrollReveal(joinSection);

const pad = (n: number) => String(n).padStart(2, "0");

onMounted(() => {
  if (!hero.value) return;
  gsap.fromTo(
    hero.value.querySelectorAll(".hero-punch"),
    { y: 24, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.7, stagger: 0.1, ease: "power3.out" },
  );
});
</script>

<template>
  <div>
    <!-- Hero -->
    <section
      ref="hero"
      class="bg-grid-lines cursor-glow-bg relative flex min-h-screen flex-col justify-center overflow-hidden px-4 py-32 sm:px-6"
    >
      <div
        class="pointer-events-none absolute left-1/2 top-1/3 h-150 w-150 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-soft opacity-50 blur-[140px]"
      />
      <div
        class="pointer-events-none absolute -left-20 bottom-0 h-80 w-80 rounded-full bg-accent-soft opacity-30 blur-[100px]"
      />
      <div
        class="pointer-events-none absolute right-0 top-0 h-64 w-64 rounded-full bg-accent-soft opacity-25 blur-[90px]"
      />
      <img
        :src="smallWhite"
        alt=""
        aria-hidden="true"
        class="pointer-events-none absolute right-0 top-1/2 h-105 w-auto -translate-y-1/2 translate-x-1/4 opacity-[0.06]"
      />

      <div class="relative mx-auto flex w-full max-w-6xl flex-col gap-8">
        <Badge
          v-if="announcement"
          :as="announcement.link ? 'a' : 'div'"
          :href="announcement.link"
          size="sm"
          interactive
          class="hero-punch w-fit gap-2 border-accent!"
        >
          <span
            class="rounded-full bg-accent px-1.5 py-0.5 font-display text-[10px] uppercase tracking-tight text-bg"
          >
            News
          </span>
          <span>{{ announcement.text }}</span>
          <span v-if="announcement.link" aria-hidden="true">&rarr;</span>
        </Badge>

        <div class="hero-punch flex flex-wrap gap-2">
          <Badge as="div" size="sm" class="w-fit gap-2">
            <img
              :src="smallWhite"
              alt=""
              class="h-4 w-auto"
              aria-hidden="true"
            />
            <span>Student Builders Club</span>
          </Badge>
          <Badge as="div" size="sm" class="w-fit gap-2 border-accent!">
            <span
              class="h-1.5 w-1.5 rounded-full bg-accent"
              aria-hidden="true"
            />
            <span>Hacking Since 2025</span>
          </Badge>
        </div>

        <h1
          class="hero-punch flex flex-col gap-0 font-display font-black uppercase leading-[0.88] tracking-tighter text-fg"
        >
          <span class="text-5xl sm:text-7xl lg:text-9xl">Stop Consuming</span>
          <span
            class="self-end text-5xl text-fg-muted sm:text-7xl lg:text-9xl lg:pl-24"
          >
            Technology.
          </span>
          <span class="text-5xl sm:text-7xl lg:text-9xl"
            >Start Building It.</span
          >
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
          <Badge as="a" href="#join" tone="solid" size="lg" interactive arrow>
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
      class="cursor-glow-bg relative overflow-hidden bg-bg-elevated px-4 py-20 sm:px-6"
    >
      <div class="relative mx-auto max-w-6xl">
        <h2
          class="mb-8 font-display text-3xl uppercase tracking-tight sm:text-4xl"
        >
          Focus Areas
        </h2>
        <div class="flex flex-wrap gap-4">
          <Badge
            v-for="domain in domains"
            :key="domain"
            size="md"
            class="domain-tag normal-case"
          >
            {{ domain }}
          </Badge>
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
          <Badge
            v-for="member in team"
            :key="member.role"
            column
            class="team-card gap-3"
            :class="!member.filled && 'border-dashed border-border-strong'"
          >
            <HalftoneMark
              :size="24"
              :opacity="member.filled ? 0.9 : 0.25"
              :color="member.filled ? 'var(--color-accent)' : 'currentColor'"
            />
            <span
              class="font-display text-lg uppercase tracking-tight"
              :class="!member.filled && 'text-fg-subtle'"
            >
              {{ member.name }}
            </span>
            <span class="font-sans text-sm tracking-normal text-fg-muted">
              {{ member.role }}
            </span>
            <span class="font-sans text-xs tracking-normal text-fg-subtle">
              {{ member.focus }}
            </span>
          </Badge>
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
        class="pointer-events-none absolute left-1/2 top-1/2 h-105 w-105 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-soft opacity-30 blur-[140px]"
      />
      <div class="relative mx-auto flex max-w-2xl flex-col items-center gap-6">
        <h2 class="font-display text-3xl uppercase tracking-tight sm:text-5xl">
          Ready to build?
        </h2>
        <p class="font-sans text-sm text-fg-muted">
          Applications open soon. Drop into the Discord to get pinged the moment
          they do.
        </p>
        <div class="flex flex-wrap justify-center gap-3">
          <Badge as="a" href="#" tone="solid" size="lg" interactive arrow>
            Apply to Join
          </Badge>
          <Badge as="a" href="#" size="lg" interactive>
            Join the Discord
          </Badge>
        </div>
      </div>
    </section>
  </div>
</template>
