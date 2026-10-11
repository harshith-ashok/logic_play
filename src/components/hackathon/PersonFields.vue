<script setup lang="ts">
import type { PersonInput } from "../../lib/hackathon/types";
import type { PersonErrors } from "../../lib/hackathon/validation";
import FormField from "./FormField.vue";

// The six fields every participant gives. One component for leader + members.
const props = defineProps<{
  modelValue: PersonInput;
  errors: PersonErrors;
  /** Unique per person on the page; prefixes input ids. */
  idPrefix: string;
}>();
const emit = defineEmits<{ "update:modelValue": [PersonInput] }>();

const years = [1, 2, 3, 4, 5].map((y) => ({ value: String(y), label: `Year ${y}` }));

function set(key: keyof PersonInput, value: string) {
  emit("update:modelValue", { ...props.modelValue, [key]: value });
}
</script>

<template>
  <div class="grid gap-5 sm:grid-cols-2">
    <FormField
      :id="`${idPrefix}-name`" label="Full name" autocomplete="off" :model-value="modelValue.full_name"
      :error="errors.full_name" @update:model-value="set('full_name', $event)"
    />
    <FormField
      :id="`${idPrefix}-reg`" label="Registration number" autocomplete="off" placeholder="RA2511000000000"
      :model-value="modelValue.registration_number" :error="errors.registration_number"
      @update:model-value="set('registration_number', $event)"
    />
    <FormField
      :id="`${idPrefix}-year`" label="Year of study" :options="years" :model-value="modelValue.year_of_study"
      :error="errors.year_of_study" @update:model-value="set('year_of_study', $event)"
    />
    <FormField
      :id="`${idPrefix}-phone`" label="Phone" type="tel" inputmode="numeric" autocomplete="off" placeholder="9876543210"
      :model-value="modelValue.phone" :error="errors.phone" @update:model-value="set('phone', $event)"
    />
    <FormField
      :id="`${idPrefix}-dept`" label="Department" autocomplete="off" :model-value="modelValue.department"
      :error="errors.department" @update:model-value="set('department', $event)"
    />
    <FormField
      :id="`${idPrefix}-college`" label="College" autocomplete="off" :model-value="modelValue.college"
      :error="errors.college" @update:model-value="set('college', $event)"
    />
  </div>
</template>
