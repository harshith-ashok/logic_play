<script setup lang="ts">
import { computed } from "vue";

// Labelled input/select with an error tied to it via aria-describedby.
const props = defineProps<{
  id: string;
  label: string;
  modelValue: string;
  error?: string;
  type?: string;
  inputmode?: "text" | "numeric" | "tel" | "email";
  autocomplete?: string;
  maxlength?: number;
  placeholder?: string;
  hint?: string;
  /** Render a <select> instead of an <input>. */
  options?: { value: string; label: string }[];
}>();
const emit = defineEmits<{ "update:modelValue": [string] }>();

const describedBy = computed(() => (props.error ? `${props.id}-error` : props.hint ? `${props.id}-hint` : undefined));
const control =
  "w-full border bg-bg px-3.5 py-3 font-sans text-base text-fg outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-fg-subtle focus:border-accent focus:shadow-[0_0_0_3px_var(--color-accent-soft)] sm:text-sm";
</script>

<template>
  <div class="flex flex-col gap-2">
    <label :for="id" class="font-display text-xs uppercase tracking-tight text-fg-subtle">{{ label }}</label>
    <select
      v-if="options"
      :id="id"
      :value="modelValue"
      :aria-invalid="!!error"
      :aria-describedby="describedBy"
      :class="[control, 'cursor-pointer', error ? 'border-accent' : 'border-border-strong']"
      @change="emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
    >
      <option value="" disabled>Select</option>
      <option v-for="o in options" :key="o.value" :value="o.value">{{ o.label }}</option>
    </select>
    <input
      v-else
      :id="id"
      :type="type ?? 'text'"
      :value="modelValue"
      :inputmode="inputmode"
      :autocomplete="autocomplete"
      :maxlength="maxlength"
      :placeholder="placeholder"
      :aria-invalid="!!error"
      :aria-describedby="describedBy"
      :class="[control, error ? 'border-accent' : 'border-border-strong']"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
    <p v-if="error" :id="`${id}-error`" class="font-sans text-xs text-accent" role="alert">{{ error }}</p>
    <p v-else-if="hint" :id="`${id}-hint`" class="font-sans text-xs text-fg-subtle">{{ hint }}</p>
  </div>
</template>
