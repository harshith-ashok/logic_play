<script setup lang="ts">
// The official LP mark, sheared at the logo's slant, with the star cut out.
// Takes its colour from `currentColor`, so it works on any slab/theme.
const id = `lp-hole-${Math.random().toString(36).slice(2, 8)}`;
</script>

<template>
  <svg viewBox="80 245 850 600" aria-hidden="true">
    <defs>
      <mask :id="id" maskUnits="userSpaceOnUse" x="0" y="0" width="1000" height="1000">
        <rect width="1000" height="1000" fill="#fff" />
        <path fill="#000" d="M660 360C667 470 688 508 830 515C688 522 667 560 660 670C653 560 632 522 490 515C632 508 653 470 660 360Z" />
      </mask>
    </defs>
    <g :mask="`url(#${id})`">
      <g fill="currentColor" transform="matrix(1 0 -0.2 1 167.6 0)">
        <path d="M90 255H275V652H372V838H90Z" />
        <path d="M383 838V310H690C772.8 310 840 377.2 840 460V540C840 622.8 772.8 690 690 690H560V838Z" />
      </g>
    </g>
  </svg>
</template>
