<script setup lang="ts">
import englishTranslation from '../assets/englishTranslation.json'
import polishTranslation from '../assets/polishTranslation.json'
import germanTranslation from '../assets/germanTranslation.json'

import WrapText from './modals/WrapTextModal.vue';
import IconRemovingTick from './icons/IconRemovingTick.vue'
import IconPlusTick from './icons/IconPlusTick.vue'

import DisplayErrorModal from './modals/DisplayErrorModal.vue'
import DownloadPdf from './DownloadPdf.vue'
import RoundFunction from './functions/RoundDigits.ts'

import { ref, Ref, onMounted, watch, getCurrentInstance } from 'vue'
import CheckboxModal from './modals/CheckboxModal.vue'

const instance = getCurrentInstance()

const useTranslation = ref<typeof englishTranslation | typeof polishTranslation>(englishTranslation)

const props = defineProps({
    currency: { type: String, required: true },
    language: { type: String, required: true }
})

const displayError = ref<boolean>(false)
const errorMsg = ref<string>("")

interface ItemList {
    name: string;
    quantity: number | null;
    unit: string;
    netUnitValue: number | null;
    vatRate: number | string | null;
    netValue: number | string | null;
    grossValue: number | string | null;
    [key: string]: string | number | null
}

const itemList: Ref<ItemList[]> = ref([
    {
        name: "",
        quantity: null,
        unit: "",
        netUnitValue: null,
        vatRate: 0,
        netValue: null,
        grossValue: null,
    }
])

interface SumOfValues {
    netValue: number | null;
    vatValue: number | null;
    grossValue: number | null;
    //   [key: string]: boolean
}

const sumOfValues: Ref<SumOfValues> = ref(
    {
        netValue: 0.00,
        vatValue: 0.00,
        grossValue: 0.00,
    }
)

interface InvoiceSettings {
    number: string
    dueDate: Date | string;
    placeOfIssue: string;
    saleDate: Date | string;
    sellerData: string;
    buyerData: string;
    paymentMethod: string;
    isIssueDateDifferentThanSaleDate: boolean;
    issueDate: Date | string;
    notes: string
    //   [key: string]: boolean
}

const invoiceSettings: Ref<InvoiceSettings> = ref(
    {
        number: "",
        dueDate: "",
        placeOfIssue: "",
        saleDate: "",
        sellerData: "",
        buyerData: "",
        paymentMethod: "",
        isIssueDateDifferentThanSaleDate: false,
        issueDate: "",
        notes: ""
    }
)

const removeArrayRow = (index: number) => {
    itemList.value.splice(index, 1)
    sumGlobalValues()
}

const addNewRow = () => {

    if (itemList.value.length >= 15) {
        displayError.value = true
        errorMsg.value = useTranslation.value?.invoiceItems?.limitOfItems
        return
    }

    itemList.value.push({
        name: "",
        quantity: null,
        unit: "",
        netUnitValue: null,
        vatRate: 0,
        netValue: null,
        grossValue: null,
    })
}

const checkIfDataIsValid = (index: number, key: string) => {
    let item = itemList.value[index];

    if (item[key] !== null) {
        const numericValue = parseFloat(item[key] as string);

        if (!isNaN(numericValue)) {
            item[key] = RoundFunction.roundToTwoDigitsIfNeeded(numericValue);
        }
    }
};

const calculateValues = (index: number, key: string) => {

    checkIfDataIsValid(index, key)

    let item = itemList.value[index]

    item.netValue = item?.quantity && item?.netUnitValue ? item.quantity * item.netUnitValue : 0
    item.grossValue = item.vatRate && item.vatRate !== 'vatExempt' ? item?.netValue * (1 + Number(item.vatRate) / 100) : item?.netValue

    item.netValue = (item?.netValue != null && typeof item.netValue === 'number') ? item?.netValue?.toFixed(2) : item?.netValue
    item.grossValue = (item?.grossValue != null && typeof item.grossValue === 'number') ? item?.grossValue?.toFixed(2) : item?.grossValue

    sumGlobalValues()
}

const sumGlobalValues = () => {

    sumOfValues.value.netValue = 0
    sumOfValues.value.vatValue = 0
    sumOfValues.value.grossValue = 0

    for (let item of itemList.value) {
        sumOfValues.value.netValue += Number(item?.netUnitValue) * Number(item?.quantity)
        sumOfValues.value.grossValue += item?.vatRate && item?.vatRate !== 'vatExempt' ? Number(item?.netUnitValue) * Number(item?.quantity) + Number(item.vatRate) / 100 * Number(item?.netUnitValue) * Number(item?.quantity) : Number(item?.netUnitValue) * Number(item?.quantity)
    }

    sumOfValues.value.vatValue += Number(sumOfValues.value.grossValue) - Number(sumOfValues.value.netValue)
}

const setLangauge = () => {

    if (props.language === 'PL') {
        useTranslation.value = polishTranslation
    }
    else if (props.language === 'DE') {
        useTranslation.value = germanTranslation
    }
    else {
        useTranslation.value = englishTranslation
    }
}

watch(props, () => {
    setLangauge()
})

onMounted(async () => {
    instance?.emit('update:isPageBeingLoaded', false)
    setLangauge()
})

</script>

<template>
    <!-- desktop version -->
    <div class="main-panel display-desktop" style="flex-direction: column;" >
        <div class="main-panel-splitted">
            <div>
                <span class="placeholder-text" style=" width: 80%;" v-if="invoiceSettings.number?.toString().length !== 0">
                    <WrapText :msg="useTranslation?.invoiceTerms?.number" />
                </span>
                <input class="input-class" :placeholder="useTranslation?.invoiceTerms?.number" maxlength="30"
                    v-bind:class="{ 'span-bottom': invoiceSettings.number?.toString().length !== 0 }"
                    v-model="invoiceSettings.number">
            </div>
            <div>
                <span class="placeholder-text" style=" width: 80%;">
                    <WrapText :msg="useTranslation?.invoiceTerms?.saleDate" />
                </span>
                <input class="input-class span-bottom" :placeholder="useTranslation?.invoiceTerms?.saleDate"
                    v-model="invoiceSettings.saleDate" type="date">
            </div>
            <div>
                <span class="placeholder-text" style=" width: 80%;"
                    v-if="invoiceSettings.placeOfIssue?.toString().length !== 0">
                    <WrapText :msg="useTranslation?.invoiceTerms?.placeOfIssue" />
                </span>
                <input class="input-class" :placeholder="useTranslation?.invoiceTerms?.placeOfIssue" maxlength="30"
                    v-bind:class="{ 'span-bottom': invoiceSettings.placeOfIssue?.toString().length !== 0 }"
                    v-model="invoiceSettings.placeOfIssue">
            </div>
            <div>
                <span class="placeholder-text" style=" width: 80%;">
                    <WrapText :msg="useTranslation?.invoiceTerms?.dueDate" />
                </span>
                <input class="input-class span-bottom" :placeholder="useTranslation?.invoiceTerms?.dueDate" type="date"
                    v-model="invoiceSettings.dueDate">
            </div>
            <div>
                <span class="placeholder-text" style=" width: 80%;"
                    v-if="invoiceSettings.paymentMethod?.toString().length !== 0">
                    <WrapText :msg="useTranslation?.invoiceTerms?.paymentMethod" />
                </span>
                <input class="input-class" :placeholder="useTranslation?.invoiceTerms?.paymentMethod" maxlength="30"
                    v-bind:class="{ 'span-bottom': invoiceSettings.paymentMethod?.toString().length !== 0 }"
                    v-model="invoiceSettings.paymentMethod">
            </div>
        </div>
        <div v-if="invoiceSettings.isIssueDateDifferentThanSaleDate" style="width: 20%;">
            <span class="placeholder-text" style=" width: 80%;">
                <WrapText :msg="useTranslation?.invoiceTerms?.issueDate" />
            </span>
            <input class="input-class span-bottom" :placeholder="useTranslation?.invoiceTerms?.issueDate"
                style="width: calc(100% - 10px);" type="date" v-model="invoiceSettings.issueDate">
        </div>
        <div style="margin-top: 10px;">
            <CheckboxModal :msg="useTranslation?.invoiceTerms?.differentIssueDate"
                @update:booleanVariable="invoiceSettings.isIssueDateDifferentThanSaleDate = $event" />
        </div>
    </div>
    <!-- mobile version -->
    <div class="main-panel display-mobile" style="flex-direction: column;">
        <div style="display: flex; flex-direction: column; gap: 10px;">
            <div style="display: flex; gap: 10px;">
                <div style="width: 100%;">
                    <span class="placeholder-text" style=" width: 80%;"
                        v-if="invoiceSettings.number?.toString().length !== 0">
                        <WrapText :msg="useTranslation?.invoiceTerms?.number" />
                    </span>
                    <input class="input-class" :placeholder="useTranslation?.invoiceTerms?.number" maxlength="30"
                        v-bind:class="{ 'span-bottom': invoiceSettings.number?.toString().length !== 0 }"
                        v-model="invoiceSettings.number">
                </div>
                <div style="width: 100%;">
                    <span class="placeholder-text" style=" width: 80%;">
                        <WrapText :msg="useTranslation?.invoiceTerms?.saleDate" />
                    </span>
                    <input class="input-class span-bottom" :placeholder="useTranslation?.invoiceTerms?.saleDate"
                        v-model="invoiceSettings.saleDate" type="date">
                </div>
            </div>
            <div style="display: flex; gap: 10px;">
                <div style="width: 100%;">
                    <span class="placeholder-text" style=" width: 80%;"
                        v-if="invoiceSettings.placeOfIssue?.toString().length !== 0">
                        <WrapText :msg="useTranslation?.invoiceTerms?.placeOfIssue" />
                    </span>
                    <input class="input-class" :placeholder="useTranslation?.invoiceTerms?.placeOfIssue" maxlength="30"
                        v-bind:class="{ 'span-bottom': invoiceSettings.placeOfIssue?.toString().length !== 0 }"
                        v-model="invoiceSettings.placeOfIssue">
                </div>
                <div style="width: 100%;">
                    <span class="placeholder-text" style=" width: 80%;">
                        <WrapText :msg="useTranslation?.invoiceTerms?.dueDate" />
                    </span>
                    <input class="input-class span-bottom" :placeholder="useTranslation?.invoiceTerms?.dueDate" type="date"
                        v-model="invoiceSettings.dueDate">
                </div>
            </div>
            <div>
                <span class="placeholder-text" style=" width: 80%;"
                    v-if="invoiceSettings.paymentMethod?.toString().length !== 0">
                    <WrapText :msg="useTranslation?.invoiceTerms?.paymentMethod" />
                </span>
                <input class="input-class" :placeholder="useTranslation?.invoiceTerms?.paymentMethod" maxlength="30"
                    v-bind:class="{ 'span-bottom': invoiceSettings.paymentMethod?.toString().length !== 0 }"
                    v-model="invoiceSettings.paymentMethod">
            </div>
        </div>
        <div v-if="invoiceSettings.isIssueDateDifferentThanSaleDate" style="width: 50%;">
            <span class="placeholder-text" style=" width: 80%;">
                <WrapText :msg="useTranslation?.invoiceTerms?.issueDate" />
            </span>
            <input class="input-class span-bottom" :placeholder="useTranslation?.invoiceTerms?.issueDate"
                style="width: calc(100% - 10px);" type="date" v-model="invoiceSettings.issueDate">

        </div>
        <div style="margin-top: 10px;">
            <CheckboxModal :msg="useTranslation?.invoiceTerms?.differentIssueDate"
                @update:booleanVariable="invoiceSettings.isIssueDateDifferentThanSaleDate = $event" />
        </div>
    </div>

    <div class="main-panel display-column" style="justify-content: space-between;">
        <div style="display: flex; width: 45%; flex-direction: column; gap: 15px; justify-content: left;">
            <div class="title-text">
                {{ useTranslation?.invoiceTerms?.sellerTitle }}
            </div>
            <div>
                <textarea class="input-class" :placeholder="useTranslation?.invoiceTerms?.sellerData"
                    v-model="invoiceSettings.sellerData" style="height: 150px;" />
            </div>
            <!-- <div>
                <input class="input-class" :placeholder="useTranslation?.invoiceTerms?.sellerBank">
            </div>
            <div>
                <input class="input-class" :placeholder="useTranslation?.invoiceTerms?.sellerAccountNumber">
            </div> -->
        </div>
        <div style="display: flex; width: 45%; flex-direction: column; gap: 15px; justify-content: right;">
            <div class="title-text">
                {{ useTranslation?.invoiceTerms?.buyerTitle }}
            </div>
            <div>
                <textarea class="input-class" style="height: 150px;" v-model="invoiceSettings.buyerData"
                    :placeholder="useTranslation?.invoiceTerms?.buyerData" />
            </div>
        </div>
    </div>
    <div class="main-panel" style="justify-content: space-between; flex-direction: column; gap: 40px">
        <div class="title-text">
            {{ useTranslation?.invoiceItems?.title }}
        </div>
        <!-- desktop version -->
        <div class="display-desktop">
            <table style="width: 100%;">
                <thead>
                    <th>
                        {{ useTranslation?.invoiceItems?.itemName }}
                    </th>
                    <th style="width: 10%;">
                        {{ useTranslation?.invoiceItems?.quantity }}
                    </th>
                    <th style="width: 15%;">
                        {{ useTranslation?.invoiceItems?.unit }}
                    </th>
                    <th style="width: 10%;">
                        {{ useTranslation?.invoiceItems?.priceUnitNetto }}
                    </th>
                    <th style="width: 10%;">
                        {{ useTranslation?.invoiceItems?.vat }}
                    </th>
                    <th style="width: 10%;">
                        {{ useTranslation?.invoiceItems?.priceNetto }}
                    </th>
                    <th style="width: 10%;">
                        {{ useTranslation?.invoiceItems?.priceBrutto }}
                    </th>
                    <th>

                    </th>
                </thead>
                <tbody>
                    <tr v-for="(item, index) in itemList" :key="index" style="">
                        <td>
                            <input class="input-class" v-model="item.name"
                                :placeholder="useTranslation?.invoiceItems?.itemName">
                        </td>
                        <td>
                            <input class="input-class" v-model="item.quantity" type="number"
                                @keyup="calculateValues(index, 'quantity')"
                                :placeholder="useTranslation?.invoiceItems?.quantity">
                        </td>
                        <td>
                            <input class="input-class" v-model="item.unit"
                                :placeholder="useTranslation?.invoiceItems?.unit">
                        </td>
                        <td>
                            <input class="input-class" v-model="item.netUnitValue" type="number"
                                @keyup="calculateValues(index, 'netUnitValue')"
                                :placeholder="useTranslation?.invoiceItems?.priceUnitNetto">
                        </td>
                        <td>
                            <select class="input-class" v-model="item.vatRate" @change="calculateValues(index, 'vatRate')"
                                :placeholder="useTranslation?.invoiceItems?.vat">
                                <option v-for="rate in useTranslation?.vatRateList" :value="rate.value">
                                    {{ rate.name }}
                                </option>
                            </select>
                        </td>
                        <td>
                            <input class="input-class" v-model="item.netValue"
                                :placeholder="useTranslation?.invoiceItems?.priceNetto" disabled>
                        </td>
                        <td>
                            <input class="input-class" v-model="item.grossValue"
                                :placeholder="useTranslation?.invoiceItems?.priceBrutto" disabled>
                        </td>
                        <td style="width: 40px; height: 24px;">
                            <IconRemovingTick @click="removeArrayRow(index)" v-if="index !== 0" />
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
        <!-- mobile version -->
        <div v-for="(item, index) in itemList" :key="index" style="display: flex; flex-direction: column; gap: 10px;"
            class="display-mobile">
            <div style="display: flex; gap: 15px; align-items: center;">
                <div style="width: 100%;">
                    <span class="placeholder-text" style=" width: 80%;" v-if="item.name.toString().length !== 0">
                        <WrapText :msg="useTranslation?.invoiceItems?.itemName" />
                    </span>
                    <input class="input-class" v-model="item.name"
                        v-bind:class="{ 'span-bottom': item.name.toString().length !== 0 }"
                        :placeholder="useTranslation?.invoiceItems?.itemName">
                </div>
                <div style="width: 24px; height: 100%; display: flex; justify-content: center;" v-if="index !== 0">
                    <IconRemovingTick @click="removeArrayRow(index)" />
                </div>
            </div>
            <div style="display: flex; gap: 10px;">
                <div style="width: 100%;">
                    <span class="placeholder-text" style=" width: 80%;"
                        v-if="item.quantity && item.quantity?.toString().length !== 0">
                        <WrapText :msg="useTranslation?.invoiceItems?.quantity" />
                    </span>
                    <input class="input-class" v-model="item.quantity" type="number"
                        v-bind:class="{ 'span-bottom': item.quantity && item.quantity?.toString().length !== 0 }"
                        @keyup="calculateValues(index, 'quantity')" :placeholder="useTranslation?.invoiceItems?.quantity">
                </div>
                <div style="width: 100%;">
                    <span class="placeholder-text" style=" width: 80%;" v-if="item.unit?.toString().length !== 0">
                        <WrapText :msg="useTranslation?.invoiceItems?.unit" />
                    </span>
                    <input class="input-class" v-model="item.unit"
                        v-bind:class="{ 'span-bottom': item.unit?.toString().length !== 0 }"
                        :placeholder="useTranslation?.invoiceItems?.unit">
                </div>
                <div style="width: 100%;">
                    <span class="placeholder-text" style=" width: 80%;"
                        v-if="item.netUnitValue && item.netUnitValue?.toString().length !== 0">
                        <WrapText :msg="useTranslation?.invoiceItems?.priceUnitNetto" />
                    </span>
                    <input class="input-class" v-model="item.netUnitValue" type="number"
                        @keyup="calculateValues(index, 'netUnitValue')"
                        v-bind:class="{ 'span-bottom': item.netUnitValue && item.netUnitValue?.toString().length !== 0 }"
                        :placeholder="useTranslation?.invoiceItems?.priceUnitNetto">
                </div>
            </div>
            <div style="display: flex; gap: 10px;">
                <div style="width: 100%;">
                    <span class="placeholder-text" style=" width: 80%;"
                        v-if="(item.vatRate || item.vatRate === 0) && item.vatRate?.toString().length !== 0">
                        <WrapText :msg="useTranslation?.invoiceItems?.vat" />
                    </span>
                    <select class="input-class" v-model="item.vatRate" @change="calculateValues(index, 'vatRate')"
                        :placeholder="useTranslation?.invoiceItems?.vat"
                        v-bind:class="{ 'span-bottom': (item.vatRate || item.vatRate === 0) && item.vatRate?.toString().length !== 0 }">
                        <option v-for="rate in useTranslation?.vatRateList" :value="rate.value">
                            {{ rate.name }}
                        </option>
                    </select>
                </div>
                <div style="width: 100%;">
                    <span class="placeholder-text" style=" width: 80%;"
                        v-if="item.netValue && item.netValue?.toString().length !== 0">
                        <WrapText :msg="useTranslation?.invoiceItems?.priceNetto" />
                    </span>
                    <input class="input-class" v-model="item.netValue"
                        v-bind:class="{ 'span-bottom': item.netValue && item.netValue?.toString().length !== 0 }"
                        :placeholder="useTranslation?.invoiceItems?.priceNetto" disabled>
                </div>
                <div style="width: 100%;">
                    <span class="placeholder-text" style=" width: 80%;"
                        v-if="item.grossValue && item.grossValue?.toString().length !== 0">
                        <WrapText :msg="useTranslation?.invoiceItems?.priceBrutto" />
                    </span>
                    <input class="input-class" v-model="item.grossValue"
                        v-bind:class="{ 'span-bottom': item.grossValue && item.grossValue?.toString().length !== 0 }"
                        :placeholder="useTranslation?.invoiceItems?.priceBrutto" disabled>
                </div>
            </div>
        </div>
        <div style="display: flex; gap: 12px; margin-top: 20px; padding-left: 20px; width: fit-content; cursor: pointer;"
            class="decrease-padding underline-text" @click="addNewRow()">
            <IconPlusTick style="height: 16px; width: 16px;" />
            <span style="font-size: 14px;">
                {{ useTranslation?.invoiceItems?.addNewItem }}
            </span>
        </div>
        <div v-if="displayError" style="margin-top: 20px; padding-left: 10px;">
            <DisplayErrorModal :msg="errorMsg" />
        </div>
        <div style="text-align: right; width: 100%; height: fit-content; display: flex; gap: 20px; justify-content: flex-end; padding-right: 50px;"
            class="decrease-padding">
            <div style="flex-direction: column; display: flex; text-align: left; gap: 10px; font-size: 14px;">
                <div>
                    {{ useTranslation?.paymentValues?.nettoValue }}
                </div>
                <div>
                    {{ useTranslation?.paymentValues?.vatValue }}
                </div>
                <div>
                    {{ useTranslation?.paymentValues?.grossValue }}
                </div>
            </div>
            <div style="flex-direction: column; display: flex; gap: 10px; font-size: 14px;">
                <div>
                    <span style="font-weight: 700">
                        {{ sumOfValues.netValue?.toFixed(2) }} {{ props?.currency }}
                    </span>
                </div>
                <div>
                    <span style="font-weight: 700">
                        {{ sumOfValues.vatValue?.toFixed(2) }} {{ props?.currency }}
                    </span>
                </div>
                <div>
                    <span style="font-weight: 700">
                        {{ sumOfValues.grossValue?.toFixed(2) }} {{ props?.currency }}
                    </span>
                </div>
            </div>
        </div>

        <div style="width: 30%; min-width: 300px; display: flex; gap: 15px; flex-direction: column;">
            <div class="title-text">
                {{ useTranslation.invoiceTerms.notes }}
            </div>
            <textarea class="input-class" style="height: 100px;" :placeholder="useTranslation.invoiceTerms.notes"
                v-model="invoiceSettings.notes" />
        </div>
    </div>
    <div style="justify-content: center; display: flex;">
        <DownloadPdf :invoiceSettings="invoiceSettings" :itemList="itemList" :sumOfValues="sumOfValues"
            :currency="props.currency" :useTranslation="useTranslation" />
    </div>
</template>

<style scoped>
.main-panel {
    width: 100%;
    max-width: 1200px;
    height: fit-content;
    padding-top: clamp(15px, 5%, 30px);
    padding-right: clamp(10px, 5%, 50px);
    padding-left: clamp(10px, 5%, 50px);
    padding-bottom: clamp(15px, 5%, 30px);
    background: #FFFFFF;
    border: 1px solid #DEDEEC;
    border-radius: 8px;
    display: flex;
    gap: 10px;
}

.main-panel-splitted {
    width: 100%;
    max-width: 1200px;
    height: fit-content;
    display: flex;
    flex-direction: row;
    gap: 10px;
}

.main-panel>div {
    width: 100%;
}

.main-panel-splitted>div {
    width: 100%;
}

th {
    text-align: left;
    padding-left: 16px;
}

@media (max-width: 700px) {
    .display-column {
        flex-direction: column !important;
        gap: 15px !important;
    }

    .display-column>div {
        width: 100% !important;
    }
}
</style>