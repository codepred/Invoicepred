<script setup lang="ts">
import IconLogo from './icons/IconLogo.vue';
import { ref, watch, getCurrentInstance } from 'vue'

const instance = getCurrentInstance()

const props = defineProps({
  currencyList: {
    type: Object,
    required: true
  },
  languageList: {
    type: Object,
    required: true
  }
})

const chosenCurrency = ref<string | null>(localStorage.getItem('invoice-currency') || '€')
const chosenLanguage = ref<string | null>(localStorage.getItem('invoice-language') || 'EN')

watch(chosenCurrency, () => {
  window.PICKED_CURRENCY = chosenCurrency.value || '€'
  instance?.emit('update:chosenCurrency', chosenCurrency.value)
})

watch(chosenLanguage, () => {
  window.PICKED_LANGUAGE = chosenLanguage.value || 'EN'
  instance?.emit('update:chosenLanguage', chosenLanguage.value)
})

</script>

<template>
  <header class="desktop-header" style="display: flex; justify-content: center;">
    <div style=" width: 100%; max-width: 1230px; display: flex; margin: 0 auto; height: 100%; display: flex; margin: auto 0; padding: 0px 25px; justify-content: space-between;">
      <div style="display: flex; justify-content: center; align-items: center;">
        <IconLogo />
      </div>
      <div style="display: flex; gap: 15px;">
        <div style="display: flex; gap: 20px; align-items: center; width: fit-content;">
          <select class="input-class" v-model="chosenLanguage" style="height: 40px; padding: 0px 12px;" data-testid="select-language" >
            <option v-for="language in props.languageList" :value="language?.value">
              {{ language?.name }}
            </option>
          </select>
        </div>
        <div style="display: flex; gap: 20px; align-items: center; width: fit-content;">
          <select class="input-class" v-model="chosenCurrency" style="height: 40px; padding: 0px 12px;" data-testid="select-currency" > 
            <option v-for="currency in props.currencyList" :value="currency?.sign">
              {{ currency?.name }}
            </option>
          </select>
        </div>
      </div>

    </div>
  </header>
</template>

<style scoped>
header.desktop-header {
  top: 0px;
  position: fixed;
  z-index: 10;
  width: 100%;
  height: 68px;
  background-color: #383A4C;
}
</style>