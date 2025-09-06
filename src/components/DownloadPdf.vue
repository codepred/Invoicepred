<script setup lang="ts" allowJs="true">
import IconDownload from './icons/IconDownload.vue'
import { ref } from 'vue'

const props = defineProps({
    invoiceSettings: {
        type: Object
    },
    itemList: {
        type: Object
    },
    sumOfValues: {
        type: Object
    },
    useTranslation: {
        type: Object
    },
    currency: {
        type: String
    }
})

const buttonText = ref<string>(props.useTranslation?.downloadPaymentButton)

props.invoiceSettings?.notes.replace(/\\n/g, '\n')
props.invoiceSettings?.sellerData.replace(/\\n/g, '\n')
props.invoiceSettings?.buyerData.replace(/\\n/g, '\n')

console.log(props.invoiceSettings)

</script>

<script lang="ts">
import Vue3Html2pdf from 'vue3-html2pdf'


export default {
    methods: {
        generateReport() {
            const temp: unknown = this.$refs.html2Pdf;
            (temp as { generatePdf?: () => unknown })?.generatePdf?.();

        },
        hasStartedGeneration() {

        },
        onProgress() {

        },
        hasGenerated() {

        }
    },
    components: {
        Vue3Html2pdf
    }
}

</script>

<template>
    <div>
        <button class="main-button" style="min-width: 170px; gap: 10px; background-color: #383A4C;" data-testid="download-pdf"
            @click="generateReport()">
            <IconDownload />
            {{ buttonText }}
        </button>
        <!-- eslint-disable-next-line @typescript-eslint/ban-ts-comment -->
        <!-- @ts-ignore -->
        <!-- @vue-ignore -->
        <Vue3Html2pdf :show-layout="false" :float-layout="true" :enable-download="true" :preview-modal="false"
            id="data-loaded" :paginate-elements-by-height="1400"
            :filename="props.useTranslation?.invoiceTerms?.invoice + '_' + props.invoiceSettings?.number || props.useTranslation?.invoiceTerms?.invoice"
            :pdf-quality="2" :manual-pagination="false" pdf-format="a4" pdf-orientation="portrait" pdf-content-width="800px"
            @progress="onProgress()" @startPagination="hasStartedGeneration()" @hasDownloaded="hasGenerated()"
            ref="html2Pdf">
            <template v-slot:pdf-content>
                <div style="padding: 60px 48px; width: 100%;">
                    <div style="display: flex; flex-direction: row; gap: 5px; margin-bottom: 10px;">
                        <div class="title-text" style="font-size: 30px; display: flex; gap: 5px;">
                            {{ props.useTranslation?.invoiceTerms?.invoice }} {{ props.invoiceSettings?.number }}
                        </div>
                    </div>
                    <div
                        style="margin-top: 50px; text-align: right; width: 100%; height: fit-content; display: flex; gap: 20px; justify-content: flex-start;">
                        <div style="flex-direction: column; display: flex; text-align: left; gap: 10px">
                            <div>
                                {{ props.useTranslation?.invoiceTerms?.issueDate }}:
                            </div>
                            <div>
                                {{ props.useTranslation?.invoiceTerms.saleDate }}:
                            </div>
                            <div>
                                {{ props.useTranslation?.invoiceTerms.dueDate }}:
                            </div>
                            <div>
                                {{ props.useTranslation?.invoiceTerms?.paymentMethod }}:
                            </div>
                        </div>
                        <div style="flex-direction: column; display: flex; gap: 10px; text-align: right;">
                            <div v-if="invoiceSettings?.isIssueDateDifferentThanSaleDate">
                                {{ props.invoiceSettings?.issueDate }}
                            </div>
                            <div v-if="!invoiceSettings?.isIssueDateDifferentThanSaleDate">
                                {{ props.invoiceSettings?.saleDate }}
                            </div>
                            <div>
                                {{ props.invoiceSettings?.saleDate }}
                            </div>
                            <div>
                                {{ props.invoiceSettings?.dueDate }}
                            </div>
                            <div>
                                {{ props.invoiceSettings?.paymentMethod }}
                            </div>
                        </div>
                    </div>
                    <div style="display: flex; gap: 10%; margin-top: 50px">
                        <div style="width: 50%">
                            <div class="title-text" style="font-weight: 600; font-size: 16px; margin-bottom: 15px; ">
                                {{ props.useTranslation?.invoiceTerms.sellerTitle }}
                            </div>
                            <div style="white-space: pre-line;">
                                {{ props.invoiceSettings?.sellerData }}
                            </div>
                        </div>
                        <div style="width: 50%">
                            <div class="title-text" style="font-weight: 600; font-size: 16px; margin-bottom: 15px; ">
                                {{ props.useTranslation?.invoiceTerms.buyerTitle }}
                            </div>
                            <div style="white-space: pre-line;">
                                {{ props.invoiceSettings?.buyerData }}
                            </div>
                        </div>
                    </div>
                    <div style="width: 100%; display: flex; justify-content: center; margin-top: 50px;">
                        <table style="width: 100%;">
                            <thead style="font-size: 12px;">
                                <th style="width: 10px; font-size: 12px;">
                                    Nr
                                </th>
                                <th style="width: 25%; font-size: 12px;">
                                    {{ props.useTranslation?.invoiceItems?.itemName }}
                                </th>
                                <th style="width: 10%; font-size: 12px;">
                                    {{ props.useTranslation?.invoiceItems?.quantity }}
                                </th>
                                <th style="width: 15%; font-size: 12px;">
                                    {{ props.useTranslation?.invoiceItems?.unit }}
                                </th>
                                <th style="width: 15%; font-size: 12px;">
                                    {{ props.useTranslation?.invoiceItems?.priceUnitNetto }}
                                </th>
                                <th style="width: 10%; font-size: 12px;">
                                    {{ props.useTranslation?.invoiceItems?.vat }}
                                </th>
                                <th style="width: 15%; font-size: 12px;">
                                    {{ props.useTranslation?.invoiceItems?.priceNetto }}
                                </th>
                                <th style="width: 15%; font-size: 12px;">
                                    {{ props.useTranslation?.invoiceItems?.priceBrutto }}
                                </th>
                            </thead>
                            <tbody>
                                <tr v-for="(item, index) in itemList" :key="index" style="gap: 10px;">
                                    <td style="width: 10px;">
                                        {{ index + 1 }}
                                    </td>
                                    <td style="text-align: center;">
                                        {{ item.name }}
                                    </td>
                                    <td>
                                        {{ item.quantity }}
                                    </td>
                                    <td>
                                        {{ item.unit }}
                                    </td>
                                    <td>
                                        {{ (item.netUnitValue || 0).toFixed(2) }}
                                    </td>
                                    <td v-if="item.vatRate === 'vatExempt'">
                                        {{ props.useTranslation?.vatExemptTranslation }}
                                    </td>
                                    <td v-else>
                                        {{ item.vatRate }}
                                    </td>
                                    <td>
                                        {{ (item.netValue || 0).toFixed(2) }}
                                    </td>
                                    <td>
                                        {{ (item.grossValue || 0).toFixed(2) }}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div
                        style="margin-top: 50px; text-align: right; width: 100%; height: fit-content; display: flex; gap: 20px; justify-content: flex-end; padding-right: 50px;">
                        <div style="flex-direction: column; display: flex; text-align: left; gap: 10px">
                            <div>
                                {{ props.useTranslation?.paymentValues?.nettoValue }}
                            </div>
                            <div>
                                {{ props.useTranslation?.paymentValues?.vatValue }}
                            </div>
                            <div>
                                {{ props.useTranslation?.paymentValues?.grossValue }}
                            </div>
                        </div>
                        <div style="flex-direction: column; display: flex; gap: 10px;">
                            <div>
                                <span style="font-weight: 700">
                                    {{ props.sumOfValues?.netValue?.toFixed(2) }} {{ props?.currency }}
                                </span>
                            </div>
                            <div>
                                <span style="font-weight: 700">
                                    {{ props.sumOfValues?.vatValue?.toFixed(2) }} {{ props?.currency }}
                                </span>
                            </div>
                            <div>
                                <span style="font-weight: 700">
                                    {{ props.sumOfValues?.grossValue?.toFixed(2) }} {{ props?.currency }}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 15px; margin-top: 30px;"
                        v-if="props.invoiceSettings?.notes">
                        <div class="title-text">
                            {{ props.useTranslation?.invoiceTerms?.notes }}
                        </div>
                        <div style="white-space: pre-line;">
                            {{ props.invoiceSettings?.notes }}
                        </div>
                    </div>
                </div>
            </template>
        </Vue3Html2pdf>
    </div>
</template>

<style scoped>
th,
td {
    text-align: center;
}
</style>