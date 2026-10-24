<script setup lang="ts">
import { ref } from "vue";
import { vSettle } from "../../lib/landing/settle";
import { useCountUp } from "../../composables/useCountUp";
import { stats } from "../../data/stats";

const props = defineProps<{ joinLink?: string }>();

const statsEl = ref<HTMLElement | null>(null);
const values = useCountUp(statsEl, stats.map((s) => s.value));
const external = () => !!props.joinLink && /^https?:/.test(props.joinLink);
</script>

<template>
  <section id="join" class="join ink">
    <div class="lp-wrap">
      <div ref="statsEl" class="mono" style="display: flex; flex-wrap: wrap; gap: 14px 48px; margin-bottom: clamp(48px, 8vh, 90px)">
        <span v-for="(s, i) in stats" :key="s.label" style="display: grid; gap: 6px">
          <b style="font-family: var(--f-display); font-style: italic; font-stretch: 125%; font-weight: 900; font-size: clamp(36px, 4vw, 60px); line-height: 0.9; letter-spacing: 0">{{ values[i] }}{{ s.suffix }}</b>
          <span style="color: var(--mute)">{{ s.label }}</span>
        </span>
      </div>
      <div class="join-grid">
        <div>
          <span class="ready mono"><i />1P ready</span>
          <h2 v-settle class="display join-title settle">Press <em>start.</em></h2>
        </div>
        <div class="join-copy">
          <p>Tell us what you build. Applications are reviewed on a rolling basis, and every one gets a real answer.</p>
          <a v-if="external()" class="btn" :href="joinLink" target="_blank" rel="noopener noreferrer"><span>Apply to join <span class="spark" /></span></a>
          <router-link v-else class="btn" :to="joinLink || '/join'"><span>Apply to join <span class="spark" /></span></router-link>
        </div>
      </div>
    </div>
  </section>
</template>
