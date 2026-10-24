<script setup lang="ts">
import { vSettle } from "../../lib/landing/settle";
import TeamGrid from "../ui/TeamGrid.vue";
import { useTeamMembers } from "../../composables/useTeamMembers";

const { members } = useTeamMembers();
</script>

<template>
  <section id="team" class="section-pad paper">
    <div class="lp-wrap">
      <div class="sec-head">
        <div>
          <p class="eyebrow">Team</p>
          <h2 v-settle class="display settle">The people shipping it.</h2>
        </div>
        <router-link to="/team" class="btn btn--ghost"><span>Full team <span aria-hidden="true">&rarr;</span></span></router-link>
      </div>
      <TeamGrid :members="members" />
    </div>
  </section>
</template>
