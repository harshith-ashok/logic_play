<template>
  <div class="pointer-events-none absolute inset-0 overflow-hidden">
    <div class="grid-layer absolute inset-0" />
    <div class="wash absolute inset-0" />
    <div class="absolute inset-0 bg-gradient-to-b from-transparent to-bg" />
  </div>
</template>

<style scoped>
.grid-layer {
  background-image:
    linear-gradient(to right, var(--border) 1px, transparent 1px),
    linear-gradient(to bottom, var(--border) 1px, transparent 1px);
  background-size: 64px 64px;
  opacity: 0.5;
  mask-image: radial-gradient(ellipse 75% 55% at 50% 0%, black 40%, transparent 100%);
  -webkit-mask-image: radial-gradient(ellipse 75% 55% at 50% 0%, black 40%, transparent 100%);
  animation: drift 44s linear infinite;
}

@keyframes drift {
  from {
    background-position: 0 0;
  }
  to {
    background-position: 64px 64px;
  }
}

.wash {
  background: radial-gradient(
    ellipse 60% 45% at 50% 0%,
    color-mix(in srgb, var(--color-accent-blue) 14%, transparent),
    transparent 70%
  );
}
</style>
