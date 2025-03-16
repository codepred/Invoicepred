<script setup lang="ts">
import TopHeader from './components/TopHeader.vue';
import FooterHeader from './components/FooterHeader.vue';

import englishTranslation from './assets/englishTranslation.json'
import polishTranslation from './assets/polishTranslation.json'
import { ref, onMounted, watch } from 'vue'
// import SpinnerModal from './components/modals/SpinnerModal.vue';

const useTranslation = ref<typeof englishTranslation | typeof polishTranslation>(englishTranslation)

const chosenCurrency = ref<string | null>("€")
const chosenLanguage = ref<string | null>("EN")

const getLocalStorageData = (action: string) => {
  if (action === 'updated') {

  }
  else {
    chosenCurrency.value = localStorage.getItem('invoice-currency') || "€"
    chosenLanguage.value = localStorage.getItem('invoice-language') || "EN"
  }

  if (window) {
    if (chosenLanguage.value) {
      window.PICKED_LANGUAGE = chosenLanguage.value || ""
    }
    else {
      window.PICKED_LANGUAGE = 'EN'
    }

    if (chosenCurrency.value) {
      window.PICKED_CURRENCY = chosenCurrency.value || ""
    }
    else {
      if (window.PICKED_LANGUAGE === 'EN') {
        window.PICKED_CURRENCY = "€"
      }
      else {
        window.PICKED_CURRENCY = "zł"
      }
    }
    localStorage.removeItem('invoice-currency')
    localStorage.removeItem('invoice-language')

    localStorage.setItem('invoice-currency', window.PICKED_CURRENCY)
    localStorage.setItem('invoice-language', window.PICKED_LANGUAGE)


  }
}

const isPageBeingLoaded = ref<boolean>(true)

watch(chosenCurrency, () => {
  getLocalStorageData('updated')
})

watch(chosenLanguage, () => {
  getLocalStorageData('updated')
})

onMounted(() => {
  getLocalStorageData('initial')
})

</script>

<template>
  <TopHeader :currencyList="useTranslation?.currencyList" :languageList="useTranslation?.languageList"
    @update:chosenCurrency="chosenCurrency = $event" @update:chosenLanguage="chosenLanguage = $event" />
  <div
    style="top: 48px; padding: 40px 48px 0px 48px; background-color: #FAFAFA; min-height: calc(100vh - 48px); width: 100%; display: flex; justify-content: center;"
    class="remove-padding">
    <div class="main-container" style="width: 100%;">
      <!-- {{ isPageBeingLoaded }}
      <SpinnerModal v-if="isPageBeingLoaded" /> -->
      <RouterView :chosenCurrency="chosenCurrency" :chosenLanguage="chosenLanguage"
        @update:isPageBeingLoaded="isPageBeingLoaded = $event" />
    </div>
  </div>
  <FooterHeader />
</template>

<style scoped>
@media (max-width: 900px) {
    .remove-padding {
        padding: 0px !important;
    }
}
</style>
