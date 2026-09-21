<script setup lang="ts">
withDefaults(
  defineProps<{
    modelValue: string;
    type?: string;
    placeholder?: string;
    autocomplete?: string;
  }>(),
  { type: "text" },
);
defineEmits<{ "update:modelValue": [string] }>();
</script>

<template>
  <!-- 16px on phones so iOS Safari doesn't zoom the page on focus. -->
  <input
    :type="type"
    :value="modelValue"
    :placeholder="placeholder"
    :autocomplete="autocomplete"
    class="w-full border border-border-strong bg-bg px-3.5 py-3 font-sans text-base text-fg outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-fg-subtle read-only:text-fg-muted focus:border-accent focus:shadow-[0_0_0_3px_var(--color-accent-soft)] sm:text-sm"
    @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
  />
</template>
