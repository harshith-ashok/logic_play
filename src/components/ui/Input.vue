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
  <input
    :type="type"
    :value="modelValue"
    :placeholder="placeholder"
    :autocomplete="autocomplete"
    class="glass-surface w-full rounded-xl border-none! bg-transparent px-4 py-3 font-sans text-sm text-fg placeholder:text-fg-subtle outline-none transition-colors duration-200 focus:border-accent!"
    @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
  />
</template>
