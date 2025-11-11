<script setup lang="ts">
import { ref, computed, watch, getCurrentInstance } from 'vue'
import DownloadPdf from './DownloadPdf.vue'
import englishTranslation from '../assets/englishTranslation.json'
import polishTranslation from '../assets/polishTranslation.json'
import germanTranslation from '../assets/germanTranslation.json'

const props = defineProps({
    currency: {
        type: String,
        required: true
    },
    language: {
        type: String,
        required: true
    }
})

interface InvoiceData {
    invoiceSettings: any
    itemList: any[]
    sumOfValues: any
    currency: string
}

const invoices = ref<InvoiceData[]>([])
const currentInvoiceIndex = ref(0)
const isBatchMode = ref(false)

const instance = getCurrentInstance()

const useTranslation = computed(() => {
    if (props.language === 'PL') return polishTranslation
    if (props.language === 'DE') return germanTranslation
    return englishTranslation
})

const currentInvoice = computed(() => {
    if (invoices.value.length === 0) return null
    return invoices.value[currentInvoiceIndex.value]
})

const hasNextInvoice = computed(() => {
    return currentInvoiceIndex.value < invoices.value.length - 1
})

const hasPreviousInvoice = computed(() => {
    return currentInvoiceIndex.value > 0
})

const startBatchGeneration = (invoiceData: InvoiceData[]) => {
    if (invoiceData && invoiceData.length > 0) {
        invoices.value = invoiceData
        currentInvoiceIndex.value = 0
        isBatchMode.value = true
    }
}

const nextInvoice = () => {
    if (hasNextInvoice.value) {
        currentInvoiceIndex.value++
    }
}

const previousInvoice = () => {
    if (hasPreviousInvoice.value) {
        currentInvoiceIndex.value--
    }
}

const finishBatch = () => {
    invoices.value = []
    currentInvoiceIndex.value = 0
    isBatchMode.value = false
}

// Notify parent when batch mode changes so it can hide the blank template
watch(isBatchMode, () => {
    instance?.emit('batch-mode-changed', isBatchMode.value)
})

// Recalculate invoice sums when items change
const sumGlobalValues = (invoice: InvoiceData) => {
    const totals = invoice.itemList.reduce((acc: any, item: any) => {
        const net = Number(item.netValue) || 0
        const gross = Number(item.grossValue) || 0
        return {
            netValue: acc.netValue + net,
            grossValue: acc.grossValue + gross,
            vatValue: acc.vatValue + (gross - net)
        }
    }, { netValue: 0, grossValue: 0, vatValue: 0 })
    invoice.sumOfValues = totals
}

const calculateValues = (index: number, key: 'quantity' | 'netUnitValue' | 'vatRate' | 'grossValue') => {
    const invoice = currentInvoice.value as InvoiceData
    const item = invoice.itemList[index]
    const quantity = Number(item.quantity) || 0
    const netUnitValue = Number(item.netUnitValue) || 0
    const vatRate = item.vatRate === 'vatExempt' ? 0 : Number(item.vatRate) || 0

    if (key === 'grossValue') {
        const grossValue = Number(item.grossValue) || 0
        item.netValue = vatRate ? grossValue / (1 + vatRate/100) : grossValue
        item.netUnitValue = quantity ? item.netValue / quantity : 0
    } else {
        item.netValue = quantity * netUnitValue
        item.grossValue = item.netValue * (1 + vatRate/100)
    }

    sumGlobalValues(invoice)
}

const handleInput = (index: number, field: 'quantity' | 'netUnitValue' | 'grossValue', value: string) => {
    const invoice = currentInvoice.value as InvoiceData
    const numericValue = parseFloat(value) || 0
    invoice.itemList[index][field] = numericValue
    calculateValues(index, field)
}

const addNewRow = () => {
    const invoice = currentInvoice.value as InvoiceData
    if (!invoice) return
    invoice.itemList.push({
        name: '',
        quantity: 1,
        unit: '',
        netUnitValue: 0,
        vatRate: 23,
        netValue: 0,
        grossValue: 0
    })
    sumGlobalValues(invoice)
}

// Expose isBatchMode and startBatchGeneration for parent component
defineExpose({
    isBatchMode,
    startBatchGeneration
})

</script>

<template>
    <div v-if="isBatchMode && currentInvoice" class="batch-invoice-wrapper">
        <div class="batch-invoice-container">
            <div class="batch-header">
                <div class="batch-info">
                    <h3>Batch Invoice Generation</h3>
                    <p>Invoice {{ currentInvoiceIndex + 1 }} of {{ invoices.length }}</p>
                </div>
                <div class="batch-controls">
                    <button 
                        class="nav-button" 
                        @click="previousInvoice" 
                        :disabled="!hasPreviousInvoice"
                    >
                        ← Previous
                    </button>
                    <button 
                        class="nav-button" 
                        @click="nextInvoice" 
                        :disabled="!hasNextInvoice"
                    >
                        Next →
                    </button>
                    <button class="finish-button" @click="finishBatch">
                        Finish
                    </button>
                </div>
            </div>
            
            <div class="invoice-preview">
                <div class="invoice-info">
                    <h4>Invoice Number: {{ currentInvoice.invoiceSettings.number }}</h4>
                </div>
                
                <!-- Invoice Preview (editable) -->
                <div class="preview-container">
                    <div class="main-panel display-desktop" style="flex-direction: column;">
                        <div class="main-panel-splitted">
                            <div>
                                <span class="placeholder-text" v-if="currentInvoice.invoiceSettings.number?.toString().length !== 0">
                                    {{ useTranslation?.invoiceTerms?.number }}
                                </span>
                                <input class="input-class" v-model="currentInvoice.invoiceSettings.number"
                                    v-bind:class="{ 'span-bottom': currentInvoice.invoiceSettings.number?.toString().length !== 0 }">
                            </div>
                            <div>
                                <span class="placeholder-text">
                                    {{ useTranslation?.invoiceTerms?.saleDate }}
                                </span>
                                <input class="input-class span-bottom" v-model="currentInvoice.invoiceSettings.saleDate" type="date">
                            </div>
                            <div>
                                <span class="placeholder-text" v-if="currentInvoice.invoiceSettings.placeOfIssue?.toString().length !== 0">
                                    {{ useTranslation?.invoiceTerms?.placeOfIssue }}
                                </span>
                                <input class="input-class" v-model="currentInvoice.invoiceSettings.placeOfIssue"
                                    v-bind:class="{ 'span-bottom': currentInvoice.invoiceSettings.placeOfIssue?.toString().length !== 0 }">
                            </div>
                            <div>
                                <span class="placeholder-text">
                                    {{ useTranslation?.invoiceTerms?.dueDate }}
                                </span>
                                <input class="input-class span-bottom" v-model="currentInvoice.invoiceSettings.dueDate" type="date">
                            </div>
                            <div>
                                <span class="placeholder-text" v-if="currentInvoice.invoiceSettings.paymentMethod?.toString().length !== 0">
                                    {{ useTranslation?.invoiceTerms?.paymentMethod }}
                                </span>
                                <input class="input-class" v-model="currentInvoice.invoiceSettings.paymentMethod"
                                    v-bind:class="{ 'span-bottom': currentInvoice.invoiceSettings.paymentMethod?.toString().length !== 0 }">
                            </div>
                        </div>
                    </div>
                    <div v-if="currentInvoice.invoiceSettings.isIssueDateDifferentThanSaleDate" style="width: 20%; margin-top: 10px;">
                        <span class="placeholder-text">
                            {{ useTranslation?.invoiceTerms?.issueDate }}
                        </span>
                        <input class="input-class span-bottom" v-model="currentInvoice.invoiceSettings.issueDate"
                            pattern="\d{2}/\d{2}/\d{4}" title="DD/MM/YYYY format"
                            style="width: calc(100% - 10px);" type="date"
                            :placeholder="useTranslation?.invoiceTerms?.issueDate">
                    </div>

                    <div class="main-panel display-column" style="justify-content: space-between; margin-top: 20px;">
                        <div style="display: flex; width: 45%; flex-direction: column; gap: 15px; justify-content: left;">
                            <div class="title-text">
                                {{ useTranslation?.invoiceTerms?.sellerTitle }}
                            </div>
                            <div>
                                <textarea class="input-class" v-model="currentInvoice.invoiceSettings.sellerData" style="height: 150px;" />
                            </div>
                        </div>
                        <div style="display: flex; width: 45%; flex-direction: column; gap: 15px; justify-content: right;">
                            <div class="title-text">
                                {{ useTranslation?.invoiceTerms?.buyerTitle }}
                            </div>
                            <div>
                                <textarea class="input-class" v-model="currentInvoice.invoiceSettings.buyerData" style="height: 150px;" />
                            </div>
                        </div>
                    </div>

                    <div class="main-panel" style="justify-content: space-between; flex-direction: column; gap: 40px; margin-top: 20px;">
                        <div class="title-text">
                            {{ useTranslation?.invoiceItems?.title }}
                        </div>
                        <div class="display-desktop">
                            <table style="width: 100%;">
                                <thead>
                                    <th>{{ useTranslation?.invoiceItems?.itemName }}</th>
                                    <th style="width: 10%;">{{ useTranslation?.invoiceItems?.quantity }}</th>
                                    <th style="width: 15%;">{{ useTranslation?.invoiceItems?.unit }}</th>
                                    <th style="width: 10%;">{{ useTranslation?.invoiceItems?.priceUnitNetto }}</th>
                                    <th style="width: 10%;">{{ useTranslation?.invoiceItems?.vat }}</th>
                                    <th style="width: 10%;">{{ useTranslation?.invoiceItems?.priceNetto }}</th>
                                    <th style="width: 10%;">{{ useTranslation?.invoiceItems?.priceBrutto }}</th>
                                </thead>
                                <tbody>
                                    <tr v-for="(item, index) in currentInvoice.itemList" :key="index">
                                        <td><input class="input-class" v-model="item.name"></td>
                                        <td><input class="input-class" :value="item.quantity" type="number" @input="handleInput(index, 'quantity', ($event.target as HTMLInputElement).value)"></td>
                                        <td><input class="input-class" v-model="item.unit"></td>
                                        <td><input class="input-class" :value="item.netUnitValue?.toFixed(2)" @input="handleInput(index, 'netUnitValue', ($event.target as HTMLInputElement).value)"></td>
                                        <td>
                                            <select class="input-class" v-model="item.vatRate" @change="calculateValues(index, 'vatRate')">
                                                <option v-for="rate in useTranslation?.vatRateList" :value="rate.value">{{ rate.name }}</option>
                                            </select>
                                        </td>
                                        <td><input class="input-class" :value="item.netValue?.toFixed(2)" readonly></td>
                                        <td><input class="input-class" :value="item.grossValue?.toFixed(2)" @input="handleInput(index, 'grossValue', ($event.target as HTMLInputElement).value)"></td>
                                    </tr>
                                </tbody>
                            </table>
                            <div style="display: flex; gap: 12px; margin-top: 12px; padding-left: 0; width: fit-content; cursor: pointer;" class="decrease-padding underline-text" @click="addNewRow">
                                <span style="font-size: 14px; color: #383A4C;">+ Add item</span>
                            </div>
                        </div>

                        <div style="text-align: right; width: 100%; height: fit-content; display: flex; gap: 20px; justify-content: flex-end; padding-right: 50px;" class="decrease-padding">
                            <div style="flex-direction: column; display: flex; text-align: left; gap: 10px; font-size: 14px;">
                                <div>{{ useTranslation?.paymentValues?.nettoValue }}</div>
                                <div>{{ useTranslation?.paymentValues?.vatValue }}</div>
                                <div>{{ useTranslation?.paymentValues?.grossValue }}</div>
                            </div>
                            <div style="flex-direction: column; display: flex; gap: 10px; font-size: 14px;">
                                <div><span style="font-weight: 700">{{ currentInvoice.sumOfValues.netValue.toFixed(2) }} {{ currentInvoice.currency || props.currency }}</span></div>
                                <div><span style="font-weight: 700">{{ currentInvoice.sumOfValues.vatValue.toFixed(2) }} {{ currentInvoice.currency || props.currency }}</span></div>
                                <div><span style="font-weight: 700">{{ currentInvoice.sumOfValues.grossValue.toFixed(2) }} {{ currentInvoice.currency || props.currency }}</span></div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div style="display: flex; justify-content: center; margin-top: 20px;">
                    <DownloadPdf 
                        :invoiceSettings="currentInvoice.invoiceSettings"
                        :itemList="currentInvoice.itemList"
                        :sumOfValues="currentInvoice.sumOfValues"
                        :currency="currentInvoice.currency || props.currency"
                        :useTranslation="useTranslation"
                    />
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.batch-invoice-wrapper {
    width: 100%;
    padding: 20px;
    background-color: #FAFAFA;
    min-height: calc(100vh - 68px);
}

.batch-invoice-container {
    width: 100%;
    max-width: 1200px;
    margin: auto;
}

.batch-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding: 15px;
    background: white;
    border: 1px solid #DEDEEC;
    border-radius: 8px;
}

.batch-info h3 {
    margin: 0 0 5px 0;
    font-size: 20px;
    font-weight: 600;
}

.batch-info p {
    margin: 0;
    color: #666;
    font-size: 14px;
}

.batch-controls {
    display: flex;
    gap: 10px;
}

.nav-button,
.finish-button {
    padding: 10px 20px;
    border: none;
    border-radius: 4px;
    font-size: 14px;
    cursor: pointer;
    font-weight: 500;
}

.nav-button {
    background-color: #383A4C;
    color: white;
}

.nav-button:hover:not(:disabled) {
    background-color: #2a2c3a;
}

.nav-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.finish-button {
    background-color: #28a745;
    color: white;
}

.finish-button:hover {
    background-color: #218838;
}

.invoice-preview {
    background: white;
    border: 1px solid #DEDEEC;
    border-radius: 8px;
    padding: 20px;
}

.invoice-info {
    margin-bottom: 20px;
    padding-bottom: 15px;
    border-bottom: 1px solid #DEDEEC;
}

.invoice-info h4 {
    margin: 0 0 10px 0;
    font-size: 18px;
    font-weight: 600;
}

.invoice-info p {
    margin: 0;
    color: #666;
    font-size: 14px;
}

.preview-container {
    margin-top: 20px;
}

.main-panel {
    width: 100%;
    max-width: 1200px;
    margin: auto;
    height: fit-content;
    padding: clamp(15px, 5%, 30px);
    background: #FFFFFF;
    border: 1px solid #DEDEEC;
    border-radius: 8px;
    display: flex;
    gap: 10px;
}

.main-panel-splitted {
    width: 100%;
    display: flex;
    gap: 10px;
}

.input-class {
    width: 100%;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
    background-color: #fff;
}

.title-text {
    font-weight: 600;
    font-size: 22px;
}

th {
    text-align: left;
    padding-left: 16px;
}

@media (max-width: 900px) {
    .display-desktop {
        display: none !important;
    }
}

@media (min-width: 901px) {
    .display-mobile {
        display: none !important;
    }
}

.span-bottom {
    padding: 18px 0 0 15px !important;
}

.decrease-padding {
    padding: 8px 0;
}

.placeholder-text {
    width: 80%;
    position: absolute;
    z-index: 2;
    font-size: 12px;
    pointer-events: none;
    padding: 8px 0 0 16px;
}
</style>

