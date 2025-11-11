<script setup lang="ts">
import CreatorPanel from '../components/CreatorPanel.vue'
import CsvImportModal from '../components/modals/CsvImportModal.vue'
import BatchInvoiceGenerator from '../components/BatchInvoiceGenerator.vue'
import { ref, inject } from 'vue'

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

const csvModal = inject<{ isOpen: { value: boolean }, open: () => void, close: () => void }>('csvModal')
const batchGeneratorRef = ref<InstanceType<typeof BatchInvoiceGenerator> | null>(null)
const isBatchMode = ref(false)

const handleProcessInvoices = (invoiceData: any[]) => {
    if (batchGeneratorRef.value) {
        batchGeneratorRef.value.startBatchGeneration(invoiceData)
    }
    if (csvModal) {
        csvModal.close()
    }
}

</script>

<template>
    <div style="padding-bottom: 100px;">
        <CsvImportModal 
            v-if="csvModal"
            :isOpen="csvModal.isOpen.value" 
            :language="props.chosenLanguage"
            @close="csvModal.close"
            @processInvoices="handleProcessInvoices"
        />
        <BatchInvoiceGenerator 
            ref="batchGeneratorRef"
            :currency="props.chosenCurrency" 
            :language="props.chosenLanguage"
            @batch-mode-changed="isBatchMode = $event"
        />
        <div v-if="!isBatchMode" style="display: flex; justify-content: center; flex-direction: column; gap: 20px;" datatest-id="creator-panel">
            <CreatorPanel :currency="props.chosenCurrency" :language="props.chosenLanguage" />
        </div>
    </div>
</template>