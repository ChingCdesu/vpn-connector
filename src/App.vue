<script setup lang="ts">
import {
  NScrollbar,
  NLayout,
  NLayoutSider,
  NLayoutContent,
  NModal,
  NCard,
  NInput,
  NSpace,
  NButton,
} from "naive-ui";
import SettingForm from "./components/SettingForm.vue";
import LogForm from "./components/LogForm.vue";

import { ref, Ref, onMounted, onBeforeUnmount } from "vue";

const connectStatus: Ref<"connected" | "disconnected"> = ref("disconnected");
const logString = ref("");
const showPasswordModal = ref(false);
const password = ref("");

const config: Ref<EdgeConfiguration> = ref({
  edgePath: "edge",
  supernodeHost: "",
  supernodePort: 5432,
  community: "",
});

async function connect() {
  logString.value = "";
  const args: string[] = [];
  args.push("-c", config.value.community);
  args.push(
    "-l",
    `${config.value.supernodeHost}:${config.value.supernodePort}`
  );
  if (config.value.username) {
    args.push("-I", config.value.username);
  }
  if (config.value.password) {
    args.push("-J", config.value.password);
  }
  if (config.value.serviceKey) {
    args.push("-k", config.value.serviceKey);
  }
  if (config.value.publicKey) {
    args.push("-P", config.value.publicKey);
  }
  if (config.value.cipher) {
    args.push(config.value.cipher);
  }

  window.ipcRenderer.invoke("connect-supernode", config.value.edgePath, args);
}

async function disconnect() {
  await window.ipcRenderer.invoke("disconnect-supernode");
}

function handleLog(event: Event, line: string) {
  logString.value += line + "\n";
}

function handleConnectEvent() {
  connectStatus.value = "connected";
}

function handleDisconnectEvent() {
  connectStatus.value = "disconnected";
}

function handleNotElevated() {
  showPasswordModal.value = true;
}

function handlePasswordSet() {
  window.ipcRenderer.invoke('set-sudo-password', password.value);
  showPasswordModal.value = false;
}

function handlePasswordInputKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    handlePasswordSet()
  }
}

onMounted(() => {
  window.ipcRenderer.invoke("did-window-loaded");
  window.ipcRenderer.on("show-not-elevated", handleNotElevated);
  window.ipcRenderer.on("connected", handleConnectEvent);
  window.ipcRenderer.on("disconnected", handleDisconnectEvent);
  window.ipcRenderer.on("log", handleLog);
  config.value = {
    ...config.value,
    ...JSON.parse(localStorage.getItem("edge") ?? "{}"),
  };
});

onBeforeUnmount(async () => {
  await disconnect();
  window.ipcRenderer.off("connected", handleConnectEvent);
  window.ipcRenderer.off("disconnected", handleDisconnectEvent);
  window.ipcRenderer.off("log", handleLog);
});
</script>

<template>
  <NLayout has-sider class="app-root layout">
    <NLayoutSider width="38%" :native-scrollbar="false">
      <NScrollbar class="scrollable layout">
        <SettingForm
          v-model:config="config"
          :status="connectStatus"
          @connect="connect"
          @disconnect="disconnect"
        />
      </NScrollbar>
    </NLayoutSider>
    <NLayoutContent :native-scrollbar="false">
      <NScrollbar class="scrollable layout">
        <LogForm :log="logString" />
      </NScrollbar>
    </NLayoutContent>
  </NLayout>
  <NModal :show="showPasswordModal" :mask-closable="false" :close-on-esc="false" :style="{maxWidth: '50%'}">
    <NCard title="输入sudo密码">
      <NInput type="password" v-model:value="password" @keydown="handlePasswordInputKeydown" show-password-on="click"/>
      <template #footer>
        <NSpace justify="end" align="center">
          <NButton type="primary" @click="handlePasswordSet">确定</NButton>
        </NSpace>
      </template>
    </NCard>
  </NModal>
</template>

<style lang="less">
.app-root {
  min-height: 100vh;
  max-height: 100vh;
  min-width: 100vw;
  max-width: 100vw;
}

.layout {
  padding: 0 12px;
}

.scrollable {
  max-height: 100vh;
  padding: 12px;
}
</style>
