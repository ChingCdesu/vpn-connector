<script lang="ts" setup>
import {
  NCode,
  NH1,
  NText,
  NLayout,
  NLayoutHeader,
  NLayoutContent,
} from "naive-ui"

const props = defineProps<{
  log: string
}>()
</script>

<template>
  <NLayout>
    <NLayoutHeader>
      <NH1 prefix="bar">
        <NText type="primary">日志</NText>
      </NH1>
    </NLayoutHeader>
    <NLayoutContent>
      <NCode :code="props.log" word-wrap />
    </NLayoutContent>
  </NLayout>
</template>
