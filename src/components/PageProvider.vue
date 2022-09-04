<script setup lang="ts">
import {
  NNotificationProvider,
  NMessageProvider,
  NConfigProvider,
  NLoadingBarProvider,
  NDialogProvider,
} from "naive-ui"
</script>

<template>
  <NConfigProvider>
    <NLoadingBarProvider>
      <NNotificationProvider>
        <NMessageProvider>
          <NDialogProvider>
            <slot />
          </NDialogProvider>
        </NMessageProvider>
      </NNotificationProvider>
    </NLoadingBarProvider>
  </NConfigProvider>
</template>
