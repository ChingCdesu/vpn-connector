<script lang="ts" setup>
import {
  NH1,
  NText,
  NLayout,
  NLayoutHeader,
  NLayoutContent,
  NForm,
  NFormItem,
  NButton,
  NInput,
  NInputNumber,
  NSelect,
} from "naive-ui"

import _ from "lodash"

const cipherOptions = [
  {
    label: "Twofish",
    value: "-A2",
  },
  {
    label: "AES",
    value: "-A3",
  },
  {
    label: "ChaCha20",
    value: "-A4",
  },
  {
    label: "Speck-CTR",
    value: "-A5",
  },
]

const props = defineProps<{
  config: EdgeConfiguration
  status: "connected" | "disconnected"
}>()

const emit = defineEmits(["connect", "disconnect", "update:config"])

function handleButtonClick() {
  if (props.status === "connected") {
    emit("disconnect")
  } else {
    emit("connect")
  }
}

function handleConfigUpdate(key: string, value: string | number | null) {
  const origin = { ...props.config }
  const updated = _.set(origin, key, value)
  localStorage.setItem("edge", JSON.stringify(updated))
  emit("update:config", updated)
}
</script>

<template>
  <NLayout>
    <NLayoutHeader>
      <NH1 prefix="bar">
        <NText type="primary">配置</NText>
      </NH1>
    </NLayoutHeader>
    <NLayoutContent>
      <NForm label-align="right" label-placement="left" label-width="auto">
        <NFormItem label="Supernode Host" required>
          <NInput
            :value="props.config.supernodeHost"
            @update:value="
              (value) => handleConfigUpdate('supernodeHost', value)
            "
          />
        </NFormItem>
        <NFormItem label="Supernode Port" required>
          <NInputNumber
            :min="1000"
            :max="65535"
            :value="props.config.supernodePort"
            @update:value="
              (value) => handleConfigUpdate('supernodePort', value)
            "
          />
        </NFormItem>
        <NFormItem label="Community" required>
          <NInput
            :value="props.config.community"
            @update:value="(value) => handleConfigUpdate('community', value)"
          />
        </NFormItem>
        <NFormItem label="Service Key">
          <NInput
            type="password"
            show-password-on="click"
            clearable
            :value="props.config.serviceKey"
            @update:value="(value) => handleConfigUpdate('serviceKey', value)"
          />
        </NFormItem>
        <NFormItem label="Public Key">
          <NInput
            type="password"
            show-password-on="click"
            clearable
            :value="props.config.publicKey"
            @update:value="(value) => handleConfigUpdate('publicKey', value)"
          />
        </NFormItem>
        <NFormItem label="Username">
          <NInput
            clearable
            :value="props.config.username"
            @update:value="(value) => handleConfigUpdate('username', value)"
          />
        </NFormItem>
        <NFormItem label="Password">
          <NInput
            type="password"
            show-password-on="click"
            clearable
            :value="props.config.password"
            @update:value="(value) => handleConfigUpdate('password', value)"
          />
        </NFormItem>
        <NFormItem label="Cipher">
          <NSelect
            :options="cipherOptions"
            clearable
            :value="props.config.cipher"
            @update:value="(value) => handleConfigUpdate('cipher', value)"
          />
        </NFormItem>
        <NFormItem label=" ">
          <NButton
            @click="handleButtonClick"
            :type="props.status === 'connected' ? 'error' : 'primary'"
          >
            {{ props.status === "connected" ? "Disconnect" : "Connect" }}
          </NButton>
        </NFormItem>
      </NForm>
    </NLayoutContent>
  </NLayout>
</template>
