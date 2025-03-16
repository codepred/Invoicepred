<script setup lang="ts">
import CreatorPanel from '../components/CreatorPanel.vue'

const props = defineProps({
    chosenCurrency: {
        type: String,
        required: true
    },
    chosenLanguage: {
        type: String,
        required: true
    }
})

</script>

<template>
    <div style="padding-bottom: 100px;">
        <div style="display: flex; justify-content: center; flex-direction: column; gap: 20px;" datatest-id="creator-panel">
            <CreatorPanel :currency="props.chosenCurrency" :language="props.chosenLanguage" />
        </div>
    </div>
</template>