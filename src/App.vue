<script setup lang="ts">
import { NScrollbar, NLayout, NLayoutSider, NLayoutContent } from "naive-ui"
import PageProvider from "./components/PageProvider.vue"
import SettingForm from "./components/SettingForm.vue"
import LogForm from "./components/LogForm.vue"

import { Command, Child } from "@tauri-apps/api/shell"
import { ref, Ref, onMounted, onUnmounted } from "vue"

let command: Command | undefined
let childProcess: Child | undefined

const connectStatus: Ref<"connected" | "disconnected"> = ref("disconnected")
const logString = ref("")

const config: Ref<EdgeConfiguration> = ref({
  supernodeHost: '',
  supernodePort: 5432,
  community: ''
})

async function handleConnect() {
  handleDisconnect()
  logString.value = ""
  const args: string[] = []
  args.push("-c", config.value.community)
  args.push("-l", `${config.value.supernodeHost}:${config.value.supernodePort}`)
  if (config.value.username) {
    args.push("-I", config.value.username)
  }
  if (config.value.password) {
    args.push("-J", config.value.password)
  }
  if (config.value.serviceKey) {
    args.push("-k", config.value.serviceKey)
  }
  if (config.value.publicKey) {
    args.push("-P", config.value.publicKey)
  }
  if (config.value.cipher) {
    args.push(config.value.cipher)
  }

  command = new Command("edge", args)
  command.stdout.on("data", (line) => (logString.value += line + "\n"))
  command.stderr.on("data", (line) => (logString.value += line + "\n"))
  command.on("error", (error) => {
    logString.value += "[ERROR] " + error + "\n"
    childProcess = undefined
    command = undefined
    connectStatus.value = "disconnected"
  })
  command.on('close', () => {
    logString.value += "edge process is exited"
    childProcess = undefined
    command = undefined
    connectStatus.value = "disconnected"
  })
  childProcess = await command.spawn()
  connectStatus.value = "connected"
}

async function handleDisconnect() {
  if (childProcess) {
    await childProcess.kill()
  }
}

onMounted(() => {
  config.value = {
    ...config.value,
    ...JSON.parse(localStorage.getItem('edge') ?? '{}')
  }
})

onUnmounted(() => {
  handleDisconnect()
})
</script>

<template>
  <PageProvider>
    <NLayout has-sider class="app-root layout">
      <NLayoutSider :width="400">
        <NScrollbar class="scrollable layout">
          <SettingForm
            v-model:config="config"
            :status="connectStatus"
            @connect="handleConnect"
            @disconnect="handleDisconnect"
          />
        </NScrollbar>
      </NLayoutSider>
      <NLayoutContent>
        <NScrollbar class="scrollable layout">
          <LogForm :log="logString" />
        </NScrollbar>
      </NLayoutContent>
    </NLayout>
  </PageProvider>
</template>

<style lang="less">
.app-root {
  min-height: 100vh;
  max-height: 100vh;
  min-width: 100vw;
  max-width: 100vw;
}

.layout {
  padding: 12px;
}

.scrollable {
  max-height: 100vh;
}
</style>
