<script setup lang="ts">
import englishTranslation from '../assets/englishTranslation.json'
import polishTranslation from '../assets/polishTranslation.json'
import germanTranslation from '../assets/germanTranslation.json'
import WrapText from './modals/WrapTextModal.vue';
import IconRemovingTick from './icons/IconRemovingTick.vue'
import IconPlusTick from './icons/IconPlusTick.vue'
import DisplayErrorModal from './modals/DisplayErrorModal.vue'
import DownloadPdf from './DownloadPdf.vue'
import { ref, Ref, onMounted, watch, getCurrentInstance, computed } from 'vue'
import CheckboxModal from './modals/CheckboxModal.vue'

const instance = getCurrentInstance()
const useTranslation = ref<typeof englishTranslation | typeof polishTranslation>(englishTranslation)
const dueDateModified = ref(false)

const props = defineProps({
    currency: { type: String, required: true },
    language: { type: String, required: true }
})

const displayError = ref<boolean>(false)
const errorMsg = ref<string>("")

const formatDate = (isoDate: string) => {
    if (!isoDate) return '';
    const [year, month, day] = isoDate.split('-');
    return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
};

const parseDate = (formattedDate: string) => {
    if (!formattedDate) return '';
    const [day, month, year] = formattedDate.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

interface ItemList {
    name: string;
    quantity: number | null;
    unit: string;
    netUnitValue: number | null;
    vatRate: number | string | null;
    netValue: number | null;
    grossValue: number | null;
    [key: string]: string | number | null
}

const itemList: Ref<ItemList[]> = ref([{
    name: "",
    quantity: null,
    unit: "",
    netUnitValue: null,
    vatRate: 23,
    netValue: null,
    grossValue: null,
}])

interface SumOfValues {
    netValue: number;
    vatValue: number;
    grossValue: number;
}

const sumOfValues: Ref<SumOfValues> = ref({
    netValue: 0,
    vatValue: 0,
    grossValue: 0,
})

interface InvoiceSettings {
    number: string
    dueDate: string;
    placeOfIssue: string;
    saleDate: string;
    sellerData: string;
    buyerData: string;
    paymentMethod: string;
    isIssueDateDifferentThanSaleDate: boolean;
    issueDate: string;
    notes: string
}

const invoiceSettings: Ref<InvoiceSettings> = ref({
    number: "",
    dueDate: "",
    placeOfIssue: "",
    saleDate: new Date().toISOString().split('T')[0],
    sellerData: "",
    buyerData: "",
    paymentMethod: "",
    isIssueDateDifferentThanSaleDate: false,
    issueDate: "",
    notes: ""
})

const saleDate = computed({
    get: () => formatDate(invoiceSettings.value.saleDate),
    set: (val) => {
        invoiceSettings.value.saleDate = parseDate(val);
        setDefaultDueDate();
    }
});

const dueDate = computed({
    get: () => formatDate(invoiceSettings.value.dueDate),
    set: (val) => {
        invoiceSettings.value.dueDate = parseDate(val);
        dueDateModified.value = true;
    }
});

const issueDate = computed({
    get: () => formatDate(invoiceSettings.value.issueDate),
    set: (val) => invoiceSettings.value.issueDate = parseDate(val)
});

const setDefaultDueDate = () => {
    if (!dueDateModified.value && invoiceSettings.value.saleDate) {
        const saleDate = new Date(invoiceSettings.value.saleDate)
        const dueDate = new Date(saleDate)
        dueDate.setDate(dueDate.getDate() + 14)
        invoiceSettings.value.dueDate = dueDate.toISOString().split('T')[0]
    }
}

watch(() => invoiceSettings.value.saleDate, (newVal) => {
    if (newVal) setDefaultDueDate()
})

watch(() => invoiceSettings.value.dueDate, (newVal, oldVal) => {
    if (newVal !== oldVal && oldVal !== "") dueDateModified.value = true
})

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
        vatRate: 23,
        netValue: null,
        grossValue: null,
    })
}

const calculateValues = (index: number, key: string) => {
    const item = itemList.value[index]
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

    sumGlobalValues()
}

const sumGlobalValues = () => {
    sumOfValues.value = itemList.value.reduce((acc, item) => {
        const net = Number(item.netValue) || 0
        const gross = Number(item.grossValue) || 0
        return {
            netValue: acc.netValue + net,
            grossValue: acc.grossValue + gross,
            vatValue: acc.vatValue + (gross - net)
        }
    }, { netValue: 0, grossValue: 0, vatValue: 0 })
}

const handleInput = (index: number, field: keyof ItemList, value: string) => {
    const numericValue = parseFloat(value) || 0
    itemList.value[index][field] = numericValue
    calculateValues(index, field)
}

const setLangauge = () => {
    if (props.language === 'PL') useTranslation.value = polishTranslation
    else if (props.language === 'DE') useTranslation.value = germanTranslation
    else useTranslation.value = englishTranslation
}

watch(props, () => setLangauge())

onMounted(async () => {
    instance?.emit('update:isPageBeingLoaded', false)
    setLangauge()
    setDefaultDueDate()
})
</script>

<template>
    <div class="main-panel display-desktop" style="flex-direction: column;">
        <div class="main-panel-splitted">
            <div>
                <span class="placeholder-text" v-if="invoiceSettings.number?.toString().length !== 0">
                    <WrapText :msg="useTranslation?.invoiceTerms?.number" />
                </span>
                <input class="input-class" :placeholder="useTranslation?.invoiceTerms?.number" maxlength="30"
                    v-bind:class="{ 'span-bottom': invoiceSettings.number?.toString().length !== 0 }"
                    v-model="invoiceSettings.number">
            </div>
            <div>
                <span class="placeholder-text">
                    <WrapText :msg="useTranslation?.invoiceTerms?.saleDate" />
                </span>
                <input class="input-class span-bottom" v-model="saleDate"
                    pattern="\d{2}/\d{2}/\d{4}" title="DD/MM/YYYY format"
                    :placeholder="useTranslation?.invoiceTerms?.saleDate">
            </div>
            <div>
                <span class="placeholder-text" v-if="invoiceSettings.placeOfIssue?.toString().length !== 0">
                    <WrapText :msg="useTranslation?.invoiceTerms?.placeOfIssue" />
                </span>
                <input class="input-class" :placeholder="useTranslation?.invoiceTerms?.placeOfIssue" maxlength="30"
                    v-bind:class="{ 'span-bottom': invoiceSettings.placeOfIssue?.toString().length !== 0 }"
                    v-model="invoiceSettings.placeOfIssue">
            </div>
            <div>
                <span class="placeholder-text">
                    <WrapText :msg="useTranslation?.invoiceTerms?.dueDate" />
                </span>
                <input class="input-class span-bottom" v-model="dueDate"
                    pattern="\d{2}/\d{2}/\d{4}" title="DD/MM/YYYY format"
                    :placeholder="useTranslation?.invoiceTerms?.dueDate">
            </div>
            <div>
                <span class="placeholder-text" v-if="invoiceSettings.paymentMethod?.toString().length !== 0">
                    <WrapText :msg="useTranslation?.invoiceTerms?.paymentMethod" />
                </span>
                <input class="input-class" :placeholder="useTranslation?.invoiceTerms?.paymentMethod" maxlength="30"
                    v-bind:class="{ 'span-bottom': invoiceSettings.paymentMethod?.toString().length !== 0 }"
                    v-model="invoiceSettings.paymentMethod">
            </div>
        </div>
        <div v-if="invoiceSettings.isIssueDateDifferentThanSaleDate" style="width: 20%;">
            <span class="placeholder-text">
                <WrapText :msg="useTranslation?.invoiceTerms?.issueDate" />
            </span>
            <input class="input-class span-bottom" v-model="issueDate"
                pattern="\d{2}/\d{2}/\d{4}" title="DD/MM/YYYY format"
                style="width: calc(100% - 10px);"
                :placeholder="useTranslation?.invoiceTerms?.issueDate">
        </div>
        <div style="margin-top: 10px;">
            <CheckboxModal :msg="useTranslation?.invoiceTerms?.differentIssueDate"
                @update:booleanVariable="invoiceSettings.isIssueDateDifferentThanSaleDate = $event" />
        </div>
    </div>

    <div class="main-panel display-mobile" style="flex-direction: column;">
        <div style="display: flex; flex-direction: column; gap: 10px;">
            <div style="display: flex; gap: 10px;">
                <div style="width: 100%;">
                    <span class="placeholder-text" v-if="invoiceSettings.number?.toString().length !== 0">
                        <WrapText :msg="useTranslation?.invoiceTerms?.number" />
                    </span>
                    <input class="input-class" :placeholder="useTranslation?.invoiceTerms?.number" maxlength="30"
                        v-bind:class="{ 'span-bottom': invoiceSettings.number?.toString().length !== 0 }"
                        v-model="invoiceSettings.number">
                </div>
                <div style="width: 100%;">
                    <span class="placeholder-text">
                        <WrapText :msg="useTranslation?.invoiceTerms?.saleDate" />
                    </span>
                    <input class="input-class span-bottom" v-model="saleDate"
                        pattern="\d{2}/\d{2}/\d{4}" title="DD/MM/YYYY format"
                        :placeholder="useTranslation?.invoiceTerms?.saleDate">
                </div>
            </div>
            <div style="display: flex; gap: 10px;">
                <div style="width: 100%;">
                    <span class="placeholder-text" v-if="invoiceSettings.placeOfIssue?.toString().length !== 0">
                        <WrapText :msg="useTranslation?.invoiceTerms?.placeOfIssue" />
                    </span>
                    <input class="input-class" :placeholder="useTranslation?.invoiceTerms?.placeOfIssue" maxlength="30"
                        v-bind:class="{ 'span-bottom': invoiceSettings.placeOfIssue?.toString().length !== 0 }"
                        v-model="invoiceSettings.placeOfIssue">
                </div>
                <div style="width: 100%;">
                    <span class="placeholder-text">
                        <WrapText :msg="useTranslation?.invoiceTerms?.dueDate" />
                    </span>
                    <input class="input-class span-bottom" v-model="dueDate"
                        pattern="\d{2}/\d{2}/\d{4}" title="DD/MM/YYYY format"
                        :placeholder="useTranslation?.invoiceTerms?.dueDate">
                </div>
            </div>
            <div>
                <span class="placeholder-text" v-if="invoiceSettings.paymentMethod?.toString().length !== 0">
                    <WrapText :msg="useTranslation?.invoiceTerms?.paymentMethod" />
                </span>
                <input class="input-class" :placeholder="useTranslation?.invoiceTerms?.paymentMethod" maxlength="30"
                    v-bind:class="{ 'span-bottom': invoiceSettings.paymentMethod?.toString().length !== 0 }"
                    v-model="invoiceSettings.paymentMethod">
            </div>
        </div>
        <div v-if="invoiceSettings.isIssueDateDifferentThanSaleDate" style="width: 50%;">
            <span class="placeholder-text">
                <WrapText :msg="useTranslation?.invoiceTerms?.issueDate" />
            </span>
            <input class="input-class span-bottom" v-model="issueDate"
                pattern="\d{2}/\d{2}/\d{4}" title="DD/MM/YYYY format"
                style="width: calc(100% - 10px);"
                :placeholder="useTranslation?.invoiceTerms?.issueDate">
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
                    <th></th>
                </thead>
                <tbody>
                    <tr v-for="(item, index) in itemList" :key="index">
                        <td><input class="input-class" v-model="item.name" :placeholder="useTranslation?.invoiceItems?.itemName"></td>
                        <td><input class="input-class" :value="item.quantity" type="number" @input="handleInput(index, 'quantity', $event.target.value)" :placeholder="useTranslation?.invoiceItems?.quantity"></td>
                        <td><input class="input-class" v-model="item.unit" :placeholder="useTranslation?.invoiceItems?.unit"></td>
                        <td><input class="input-class" :value="item.netUnitValue?.toFixed(2)" @input="handleInput(index, 'netUnitValue', $event.target.value)" :placeholder="useTranslation?.invoiceItems?.priceUnitNetto"></td>
                        <td>
                            <select class="input-class" v-model="item.vatRate" @change="calculateValues(index, 'vatRate')">
                                <option v-for="rate in useTranslation?.vatRateList" :value="rate.value">{{ rate.name }}</option>
                            </select>
                        </td>
                        <td><input class="input-class" :value="item.netValue?.toFixed(2)" readonly :placeholder="useTranslation?.invoiceItems?.priceNetto"></td>
                        <td><input class="input-class" :value="item.grossValue?.toFixed(2)" @input="handleInput(index, 'grossValue', $event.target.value)" :placeholder="useTranslation?.invoiceItems?.priceBrutto"></td>
                        <td style="width: 40px; height: 24px;"><IconRemovingTick @click="removeArrayRow(index)" v-if="index !== 0" /></td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div v-for="(item, index) in itemList" :key="index" class="display-mobile" style="display: flex; flex-direction: column; gap: 10px;">
            <div style="display: flex; gap: 15px; align-items: center;">
                <div style="width: 100%;">
                    <span class="placeholder-text" v-if="item.name.toString().length !== 0">
                        <WrapText :msg="useTranslation?.invoiceItems?.itemName" />
                    </span>
                    <input class="input-class" v-model="item.name" :class="{ 'span-bottom': item.name.toString().length !== 0 }" :placeholder="useTranslation?.invoiceItems?.itemName">
                </div>
                <div style="width: 24px; height: 100%; display: flex; justify-content: center;" v-if="index !== 0">
                    <IconRemovingTick @click="removeArrayRow(index)" />
                </div>
            </div>
            <div style="display: flex; gap: 10px;">
                <div style="width: 100%;">
                    <span class="placeholder-text" v-if="item.quantity?.toString().length !== 0">
                        <WrapText :msg="useTranslation?.invoiceItems?.quantity" />
                    </span>
                    <input class="input-class" :value="item.quantity" type="number" @input="handleInput(index, 'quantity', $event.target.value)" :class="{ 'span-bottom': item.quantity?.toString().length !== 0 }" :placeholder="useTranslation?.invoiceItems?.quantity">
                </div>
                <div style="width: 100%;">
                    <span class="placeholder-text" v-if="item.unit?.toString().length !== 0">
                        <WrapText :msg="useTranslation?.invoiceItems?.unit" />
                    </span>
                    <input class="input-class" v-model="item.unit" :class="{ 'span-bottom': item.unit?.toString().length !== 0 }" :placeholder="useTranslation?.invoiceItems?.unit">
                </div>
            </div>
            <div style="display: flex; gap: 10px;">
                <div style="width: 100%;">
                    <span class="placeholder-text" v-if="item.netUnitValue?.toString().length !== 0">
                        <WrapText :msg="useTranslation?.invoiceItems?.priceUnitNetto" />
                    </span>
                    <input class="input-class" :value="item.netUnitValue?.toFixed(2)" @input="handleInput(index, 'netUnitValue', $event.target.value)" :class="{ 'span-bottom': item.netUnitValue?.toString().length !== 0 }" :placeholder="useTranslation?.invoiceItems?.priceUnitNetto">
                </div>
                <div style="width: 100%;">
                    <span class="placeholder-text" v-if="item.vatRate?.toString().length !== 0">
                        <WrapText :msg="useTranslation?.invoiceItems?.vat" />
                    </span>
                    <select class="input-class" v-model="item.vatRate" @change="calculateValues(index, 'vatRate')" :class="{ 'span-bottom': item.vatRate?.toString().length !== 0 }">
                        <option v-for="rate in useTranslation?.vatRateList" :value="rate.value">{{ rate.name }}</option>
                    </select>
                </div>
            </div>
            <div style="display: flex; gap: 10px;">
                <div style="width: 100%;">
                    <span class="placeholder-text" v-if="item.netValue?.toString().length !== 0">
                        <WrapText :msg="useTranslation?.invoiceItems?.priceNetto" />
                    </span>
                    <input class="input-class" :value="item.netValue?.toFixed(2)" readonly :class="{ 'span-bottom': item.netValue?.toString().length !== 0 }" :placeholder="useTranslation?.invoiceItems?.priceNetto">
                </div>
                <div style="width: 100%;">
                    <span class="placeholder-text" v-if="item.grossValue?.toString().length !== 0">
                        <WrapText :msg="useTranslation?.invoiceItems?.priceBrutto" />
                    </span>
                    <input class="input-class" :value="item.grossValue?.toFixed(2)" @input="handleInput(index, 'grossValue', $event.target.value)" :class="{ 'span-bottom': item.grossValue?.toString().length !== 0 }" :placeholder="useTranslation?.invoiceItems?.priceBrutto">
                </div>
            </div>
        </div>

        <div style="display: flex; gap: 12px; margin-top: 20px; padding-left: 20px; width: fit-content; cursor: pointer;" class="decrease-padding underline-text" @click="addNewRow()">
            <IconPlusTick style="height: 16px; width: 16px;" />
            <span style="font-size: 14px;">{{ useTranslation?.invoiceItems?.addNewItem }}</span>
        </div>

        <div v-if="displayError" style="margin-top: 20px; padding-left: 10px;">
            <DisplayErrorModal :msg="errorMsg" />
        </div>

        <div style="text-align: right; width: 100%; height: fit-content; display: flex; gap: 20px; justify-content: flex-end; padding-right: 50px;" class="decrease-padding">
            <div style="flex-direction: column; display: flex; text-align: left; gap: 10px; font-size: 14px;">
                <div>{{ useTranslation?.paymentValues?.nettoValue }}</div>
                <div>{{ useTranslation?.paymentValues?.vatValue }}</div>
                <div>{{ useTranslation?.paymentValues?.grossValue }}</div>
            </div>
            <div style="flex-direction: column; display: flex; gap: 10px; font-size: 14px;">
                <div><span style="font-weight: 700">{{ sumOfValues.netValue.toFixed(2) }} {{ props.currency }}</span></div>
                <div><span style="font-weight: 700">{{ sumOfValues.vatValue.toFixed(2) }} {{ props.currency }}</span></div>
                <div><span style="font-weight: 700">{{ sumOfValues.grossValue.toFixed(2) }} {{ props.currency }}</span></div>
            </div>
        </div>

        <div style="width: 30%; min-width: 300px; display: flex; gap: 15px; flex-direction: column;">
            <div class="title-text">{{ useTranslation.invoiceTerms.notes }}</div>
            <textarea class="input-class" style="height: 100px;" :placeholder="useTranslation.invoiceTerms.notes" v-model="invoiceSettings.notes" />
        </div>
    </div>

    <div style="justify-content: center; display: flex;">
        <DownloadPdf :invoiceSettings="invoiceSettings" :itemList="itemList" :sumOfValues="sumOfValues" :currency="props.currency" :useTranslation="useTranslation" />
    </div>
</template>

<style scoped>
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
    .display-mobile {
        display: flex !important;
    }
    .main-panel-splitted {
        flex-direction: column;
    }
    table {
        display: none;
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

.underline-text:hover {
    text-decoration: underline;
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