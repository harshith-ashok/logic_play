<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { vSettle } from "../../lib/landing/settle";
import { domains, type Domain } from "../../data/domains";

// Hovering (or focusing/tapping) a pill opens its popover, clamped to the
// viewport gutter so it never runs off a phone screen.
const active = ref<Domain | null>(null);
const popStyle = ref<Record<string, string>>({});
const GUTTER = 16;

function open(domain: Domain, event: Event) {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  const width = Math.min(352, window.innerWidth - GUTTER * 2);
  const left = Math.min(Math.max(rect.left, GUTTER), window.innerWidth - width - GUTTER);
  popStyle.value = { width: `${width}px`, left: `${left - rect.left}px` };
  active.value = domain;
}

// Touch has no hover-out, so tapping anywhere else closes it.
function closeOutside(e: PointerEvent) {
  if (!(e.target as HTMLElement).closest(".domain-tag")) active.value = null;
}
onMounted(() => document.addEventListener("pointerdown", closeOutside, { passive: true }));
onBeforeUnmount(() => document.removeEventListener("pointerdown", closeOutside));
</script>

<template>
  <section id="focus" class="section-pad paper relative z-10">
    <div class="lp-wrap">
      <div class="sec-head">
        <div>
          <p class="eyebrow">Focus areas</p>
          <h2 v-settle class="display settle">What you'll actually work with.</h2>
        </div>
        <span class="mono" style="max-width: 30ch">Hover or tap a tag for roles and projects</span>
      </div>
      <div class="flex flex-wrap gap-3">
        <div
          v-for="d in domains" :key="d.name" class="domain-tag relative" :class="active === d && 'z-30'"
          @mouseenter="open(d, $event)" @mouseleave="active = null" @focusin="open(d, $event)" @focusout="active = null"
        >
          <button type="button" class="domain-btn" :class="active === d && 'active'" @click="open(d, $event)">
            {{ d.name }}
          </button>
          <Transition name="domain-pop">
            <div v-if="active === d" class="absolute top-full z-30 pt-3" :style="popStyle" role="tooltip">
              <div class="domain-pop flex flex-col gap-4 p-5 text-left">
                <div class="flex flex-col gap-1.5">
                  <span class="mono">{{ d.name }}</span>
                  <span class="text-[13px] leading-relaxed" style="color: var(--dim)">{{ d.summary }}</span>
                </div>
                <div class="flex flex-col gap-1.5">
                  <span class="mono" style="color: var(--mute)">Roles</span>
                  <ul class="flex flex-col gap-1 text-[13px]" style="color: var(--dim)">
                    <li v-for="r in d.roles" :key="r">+ {{ r }}</li>
                  </ul>
                </div>
                <div class="flex flex-col gap-1.5">
                  <span class="mono" style="color: var(--mute)">Projects</span>
                  <ul class="flex flex-col gap-1 text-[13px]" style="color: var(--dim)">
                    <li v-for="p in d.projects" :key="p">+ {{ p }}</li>
                  </ul>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.domain-pop-enter-active,
.domain-pop-leave-active {
  transition: opacity 0.15s var(--ease-mechanical), transform 0.15s var(--ease-mechanical);
}
.domain-pop-enter-from,
.domain-pop-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
