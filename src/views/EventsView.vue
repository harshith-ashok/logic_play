<script setup lang="ts">
import { computed, ref } from "vue";
import Badge from "../components/ui/Badge.vue";
import HalftoneMark from "../components/ui/HalftoneMark.vue";
import { useScrollReveal } from "../composables/useScrollReveal";
import { events } from "../data/events";
import { formatDate } from "../utils/date";

const list = ref<HTMLElement | null>(null);
useScrollReveal(list, { selector: ".event-card" });

const now = Date.now();
const upcoming = computed(() =>
  events
    .filter((e) => new Date(e.date).getTime() >= now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
);
const past = computed(() =>
  events
    .filter((e) => new Date(e.date).getTime() < now)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
);
</script>

<template>
  <div class="px-4 py-28 sm:px-6">
    <div class="mx-auto max-w-6xl">
      <h1 class="mb-4 font-display text-3xl uppercase tracking-tight sm:text-5xl">
        Events
      </h1>
      <p class="mb-12 max-w-xl font-sans text-sm text-fg-muted">
        Workshops, hackathons, and drops — upcoming and past.
      </p>

      <div v-if="events.length === 0" ref="list" class="event-card">
        <div
          class="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border-strong px-8 py-20 text-center"
        >
          <HalftoneMark :size="40" :opacity="0.3" />
          <p class="font-display text-lg uppercase tracking-tight text-fg-subtle">
            No events yet &mdash; first drop coming soon.
          </p>
        </div>
      </div>

      <div v-else ref="list" class="flex flex-col gap-16">
        <section v-if="upcoming.length">
          <h2 class="mb-6 font-display text-xl uppercase tracking-tight">
            Upcoming
          </h2>
          <div class="grid gap-4 sm:grid-cols-2">
            <Badge
              v-for="event in upcoming"
              :key="event.id"
              :as="event.link ? 'a' : 'div'"
              :href="event.link"
              column
              interactive
              class="event-card gap-0! overflow-hidden p-0!"
            >
              <img
                v-if="event.image"
                :src="event.image"
                :alt="event.title"
                loading="lazy"
                class="aspect-video w-full object-cover"
              />
              <div class="flex flex-col gap-3 p-6">
                <span class="font-sans text-xs tracking-normal text-fg-subtle">
                  {{ formatDate(event.date) }}
                </span>
                <span class="font-display text-lg uppercase tracking-tight">
                  {{ event.title }}
                </span>
                <span class="font-sans text-sm tracking-normal text-fg-muted">
                  {{ event.description }}
                </span>
              </div>
            </Badge>
          </div>
        </section>

        <section v-if="past.length">
          <h2 class="mb-6 font-display text-xl uppercase tracking-tight">
            Past
          </h2>
          <div class="grid gap-4 sm:grid-cols-2">
            <Badge
              v-for="event in past"
              :key="event.id"
              column
              class="event-card gap-0! overflow-hidden p-0! opacity-60"
            >
              <img
                v-if="event.image"
                :src="event.image"
                :alt="event.title"
                loading="lazy"
                class="aspect-video w-full object-cover grayscale"
              />
              <div class="flex flex-col gap-3 p-6">
                <span class="font-sans text-xs tracking-normal text-fg-subtle">
                  {{ formatDate(event.date) }}
                </span>
                <span class="font-display text-lg uppercase tracking-tight">
                  {{ event.title }}
                </span>
                <span class="font-sans text-sm tracking-normal text-fg-muted">
                  {{ event.description }}
                </span>
              </div>
            </Badge>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>
