<script setup lang="ts">
import { ref, computed } from 'vue'
import DisplayErrorModal from './DisplayErrorModal.vue'
import englishTranslation from '../../assets/englishTranslation.json'
import polishTranslation from '../../assets/polishTranslation.json'
import germanTranslation from '../../assets/germanTranslation.json'

const props = defineProps({
    isOpen: {
        type: Boolean,
        required: true
    },
    language: {
        type: String,
        required: true
    }
})

const emit = defineEmits(['close', 'processInvoices'])

const useTranslation = computed(() => {
    if (props.language === 'PL') return polishTranslation
    if (props.language === 'DE') return germanTranslation
    return englishTranslation
})

const csvFile = ref<File | null>(null)
const firstInvoiceNumber = ref('')
const globalIssueDate = ref('')
const globalPlaceOfIssue = ref('')
const sellerData = ref('')
const errorMsg = ref('')
const displayError = ref(false)
const isProcessing = ref(false)

// Product name mapping: Polish -> Polish / English
const productNameMapping: Record<string, string> = {
    'Sznurowki': 'Sznurowki / Laces',
    'Sznurówki': 'Sznurówki / Laces',
    'Adapter': 'Adapter / Adapter',
    'Wysyłka': 'Wysyłka / Shipping',
    'Shipping': 'Wysyłka / Shipping',
    'Paczkomat InPost': 'Paczkomat InPost / InPost Parcel Locker'
}

const mapProductName = (name: string): string => {
    const trimmedName = name.trim()
    const lower = trimmedName.toLowerCase()
    // Generic mappings
    if (lower.includes('sznurów') || lower.includes('sznurow') || lower.includes('laces')) {
        return 'Sznurówki / Laces'
    }
    if (lower.includes('kabel adapter przejściówka') || lower.includes('kabel adapter') || lower.includes('adapter')) {
        return 'Adapter / Adapter'
    }
    if (trimmedName.includes(' / ')) {
        return trimmedName
    }
    return productNameMapping[trimmedName] || `${trimmedName} / ${trimmedName}`
}

// Currency code to sign mapping
const currencyMapping: Record<string, string> = {
    'PLN': 'zł',
    'EUR': '€',
    'USD': '$',
    'GBP': '£',
    'CZK': 'CZK',
    'SK': '€' // Slovak Koruna uses EUR
}

const mapCurrency = (currencyCode: string): string => {
    return currencyMapping[currencyCode.toUpperCase()] || currencyCode
}

const parseCSVLine = (line: string): string[] => {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i]
        
        if (char === '"') {
            inQuotes = !inQuotes
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim())
            current = ''
        } else {
            current += char
        }
    }
    result.push(current.trim())
    
    return result
}

const parseCSV = (text: string): any[] => {
    const lines = text.split('\n')
    if (lines.length === 0) return []

    // Find all header lines (lines with "Type" column)
    const headerSections: Array<{ index: number, headers: string[] }> = []
    
    for (let i = 0; i < lines.length; i++) {
        const testHeaders = parseCSVLine(lines[i]).map(h => h.replace(/^"|"$/g, '').trim())
        if (testHeaders.some(h => h.toLowerCase() === 'type')) {
            headerSections.push({ index: i, headers: testHeaders })
        }
    }
    
    if (headerSections.length === 0) return []

    // Use first header for order parsing
    const orderHeaders = headerSections[0].headers
    const orderHeaderIndex = headerSections[0].index

    // Find column indices for order type
    const typeIndex = orderHeaders.findIndex(h => h.toLowerCase() === 'type')
    const orderIdIndex = orderHeaders.findIndex(h => h.toLowerCase() === 'orderid')
    const orderDateIndex = orderHeaders.findIndex(h => h.toLowerCase() === 'orderdate')
    const sellerStatusIndex = orderHeaders.findIndex(h => h.toLowerCase() === 'sellerstatus')
    const buyerCompanyIndex = orderHeaders.findIndex(h => h.toLowerCase() === 'buyercompany')
    const buyerNameIndex = orderHeaders.findIndex(h => h.toLowerCase() === 'buyername')
    const buyerPhoneIndex = orderHeaders.findIndex(h => h.toLowerCase() === 'buyerphone')
    const buyerAddressIndex = orderHeaders.findIndex(h => h.toLowerCase() === 'buyeraddress')
    const buyerZipIndex = orderHeaders.findIndex(h => h.toLowerCase() === 'buyerzip')
    const buyerCityIndex = orderHeaders.findIndex(h => h.toLowerCase() === 'buyercity')
    const buyerCountryCodeIndex = orderHeaders.findIndex(h => h.toLowerCase() === 'buyercountrycode')
    const paymentCurrencyIndex = orderHeaders.findIndex(h => h.toLowerCase() === 'paymentcurrency')
    const deliveryAmountIndex = orderHeaders.findIndex(h => h.toLowerCase() === 'deliveryamount')
    const deliveryCurrencyIndex = orderHeaders.findIndex(h => h.toLowerCase() === 'deliverycurrency')
    // Invoice-specific override columns
    const invoiceNameIndex = orderHeaders.findIndex(h => h.toLowerCase() === 'invoicename')
    const invoiceCompanyIndex = orderHeaders.findIndex(h => h.toLowerCase() === 'invoicecompanyname')
    const invoiceStreetIndex = orderHeaders.findIndex(h => h.toLowerCase() === 'invoicestreet')
    const invoiceZipIndex = orderHeaders.findIndex(h => h.toLowerCase() === 'invoicezipcode')
    const invoiceCityIndex = orderHeaders.findIndex(h => h.toLowerCase() === 'invoicecity')
    const invoiceCountryIndex = orderHeaders.findIndex(h => h.toLowerCase() === 'invoicecountry')
    const invoiceTaxIdIndex = orderHeaders.findIndex(h => h.toLowerCase() === 'invoicetaxid')

    // Use second header (if exists) for lineItem parsing
    let lineItemHeaders: string[] = []
    let lineItemHeaderIndex = -1
    if (headerSections.length > 1) {
        lineItemHeaders = headerSections[1].headers
        lineItemHeaderIndex = headerSections[1].index
    }

    // Find column indices for lineItem type
    const lineItemNameIndex = lineItemHeaders.length > 0 ? lineItemHeaders.findIndex(h => h.toLowerCase() === 'name') : -1
    const lineItemQuantityIndex = lineItemHeaders.length > 0 ? lineItemHeaders.findIndex(h => h.toLowerCase() === 'quantity') : -1
    const lineItemPriceIndex = lineItemHeaders.length > 0 ? lineItemHeaders.findIndex(h => h.toLowerCase() === 'price') : -1
    const lineItemCurrencyIndex = lineItemHeaders.length > 0 ? lineItemHeaders.findIndex(h => h.toLowerCase() === 'currency') : -1
    const lineItemTaxRateIndex = lineItemHeaders.length > 0 ? lineItemHeaders.findIndex(h => h.toLowerCase() === 'taxrate') : -1

    const orders: Record<string, any> = {}
    const lineItems: Record<string, any[]> = {}

    // Parse order lines (from first header to second header or end)
    const orderEndIndex = lineItemHeaderIndex > 0 ? lineItemHeaderIndex : lines.length
    for (let i = orderHeaderIndex + 1; i < orderEndIndex; i++) {
        const line = lines[i]
        if (!line.trim()) continue
        
        const values = parseCSVLine(line).map(v => v.replace(/^"|"$/g, '').trim())
        
        if (values.length < orderHeaders.length) continue

        const type = typeIndex >= 0 ? values[typeIndex] : ''
        const orderId = orderIdIndex >= 0 ? values[orderIdIndex] : ''

        if (type === 'order') {
            const sellerStatus = sellerStatusIndex >= 0 ? values[sellerStatusIndex] : ''
            
            // Process SENT and READY_FOR_SHIPMENT statuses, exclude NEW
            const statusUpper = sellerStatus.toUpperCase()
            if (statusUpper === 'NEW') continue
            if (statusUpper !== 'SENT' && statusUpper !== 'READY_FOR_SHIPMENT') continue

            const orderDate = orderDateIndex >= 0 ? values[orderDateIndex] : ''
            const buyerCompany = buyerCompanyIndex >= 0 ? values[buyerCompanyIndex] : ''
            const buyerName = buyerNameIndex >= 0 ? values[buyerNameIndex] : ''
            const buyerPhone = buyerPhoneIndex >= 0 ? values[buyerPhoneIndex] : ''
            const buyerAddress = buyerAddressIndex >= 0 ? values[buyerAddressIndex] : ''
            const buyerZip = buyerZipIndex >= 0 ? values[buyerZipIndex] : ''
            const buyerCity = buyerCityIndex >= 0 ? values[buyerCityIndex] : ''
            const buyerCountryCode = buyerCountryCodeIndex >= 0 ? values[buyerCountryCodeIndex] : ''
            const paymentCurrency = paymentCurrencyIndex >= 0 ? values[paymentCurrencyIndex] : ''
            const deliveryAmount = deliveryAmountIndex >= 0 ? parseFloat(values[deliveryAmountIndex].replace(/[^\d.-]/g, '')) || 0 : 0
            const deliveryCurrency = deliveryCurrencyIndex >= 0 ? values[deliveryCurrencyIndex] : paymentCurrency

            // Convert OrderDate: keep full timestamp for sorting and date-only for invoice
            let saleDate = ''
            let saleDateTs = 0
            if (orderDate) {
                try {
                    const date = new Date(orderDate)
                    if (!isNaN(date.getTime())) {
                        saleDate = date.toISOString().split('T')[0]
                        saleDateTs = date.getTime()
                    }
                } catch (e) {
                    // If parsing fails, try to extract date from string
                    const dateMatch = orderDate.match(/(\d{4}-\d{2}-\d{2})/)
                    if (dateMatch) {
                        saleDate = dateMatch[1]
                        try {
                            saleDateTs = new Date(saleDate).getTime()
                        } catch {}
                    }
                }
            }

            // Prepare buyer data (with Invoice* override if any provided)
            const invName = invoiceNameIndex >= 0 ? values[invoiceNameIndex] : ''
            const invCompany = invoiceCompanyIndex >= 0 ? values[invoiceCompanyIndex] : ''
            const invStreet = invoiceStreetIndex >= 0 ? values[invoiceStreetIndex] : ''
            const invZip = invoiceZipIndex >= 0 ? values[invoiceZipIndex] : ''
            const invCity = invoiceCityIndex >= 0 ? values[invoiceCityIndex] : ''
            const invCountry = invoiceCountryIndex >= 0 ? values[invoiceCountryIndex] : ''
            const invTaxId = invoiceTaxIdIndex >= 0 ? values[invoiceTaxIdIndex] : ''

            const hasInvoiceOverride = !!(invName || invCompany || invStreet || invZip || invCity || invCountry || invTaxId)

            let buyerData = ''
            if (hasInvoiceOverride) {
                if (invCompany) buyerData += invCompany + '\n'
                if (invName) buyerData += invName + '\n'
                if (invStreet) buyerData += invStreet + '\n'
                if (invZip || invCity) buyerData += (invZip ? invZip + ' ' : '') + (invCity || '') + '\n'
                if (invCountry) buyerData += invCountry + '\n'
                if (invTaxId) buyerData += invTaxId
                buyerData = buyerData.trim()
            }
            else {
                if (buyerCompany) buyerData += buyerCompany + '\n'
                if (buyerName) buyerData += buyerName + '\n'
                if (buyerPhone) buyerData += buyerPhone + '\n'
                if (buyerAddress) buyerData += buyerAddress + '\n'
                if (buyerZip || buyerCity) {
                    buyerData += (buyerZip ? buyerZip + ' ' : '') + (buyerCity || '') + '\n'
                }
                if (buyerCountryCode) buyerData += buyerCountryCode
                buyerData = buyerData.trim()
            }

            orders[orderId] = {
                orderId,
                buyerData,
                paymentCurrency: paymentCurrency || 'PLN',
                deliveryAmount,
                deliveryCurrency: deliveryCurrency || paymentCurrency || 'PLN',
                saleDate,
                saleDateTs
            }
        }
    }

    // Parse lineItem lines (from second header to third header or end)
    if (lineItemHeaderIndex > 0) {
        const lineItemEndIndex = headerSections.length > 2 ? headerSections[2].index : lines.length
        for (let i = lineItemHeaderIndex + 1; i < lineItemEndIndex; i++) {
            const line = lines[i]
            if (!line.trim()) continue
            
            const values = parseCSVLine(line).map(v => v.replace(/^"|"$/g, '').trim())
            
            if (values.length < lineItemHeaders.length) continue

            const type = lineItemHeaders.length > 0 && typeIndex >= 0 ? (values[typeIndex] || '') : ''
            const orderId = lineItemHeaders.length > 0 && orderIdIndex >= 0 ? (values[orderIdIndex] || '') : ''

            if (type === 'lineItem' && orderId) {
                if (!lineItems[orderId]) {
                    lineItems[orderId] = []
                }

                const name = lineItemNameIndex >= 0 ? values[lineItemNameIndex] : ''
                const quantity = lineItemQuantityIndex >= 0 ? parseFloat(values[lineItemQuantityIndex].replace(/[^\d.-]/g, '')) || 1 : 1
                const price = lineItemPriceIndex >= 0 ? parseFloat(values[lineItemPriceIndex].replace(/[^\d.-]/g, '')) || 0 : 0
                const currency = lineItemCurrencyIndex >= 0 ? values[lineItemCurrencyIndex] : ''
                const taxRate = lineItemTaxRateIndex >= 0 ? parseFloat(values[lineItemTaxRateIndex].replace(/[^\d.-]/g, '')) || 23 : 23

                if (name) {
                    lineItems[orderId].push({
                        name: mapProductName(name),
                        quantity,
                        price,
                        currency,
                        taxRate
                    })
                }
            }
        }
    }

    // Combine orders with their line items
    const records: any[] = []
    for (const orderId in orders) {
        const order = orders[orderId]
        const items = lineItems[orderId] || []

        // Add delivery as a separate item if delivery amount > 0
        if (order.deliveryAmount > 0) {
            items.push({
                name: 'Wysyłka / Shipping',
                quantity: 1,
                price: order.deliveryAmount,
                currency: order.deliveryCurrency,
                taxRate: 23
            })
        }

        if (items.length > 0) {
            records.push({
                orderId,
                buyerData: order.buyerData,
                paymentCurrency: order.paymentCurrency,
                saleDate: order.saleDate,
                saleDateTs: order.saleDateTs,
                items
            })
        }
    }

    return records
}

const handleFileSelect = (event: Event) => {
    const target = event.target as HTMLInputElement
    if (target.files && target.files.length > 0) {
        csvFile.value = target.files[0]
        errorMsg.value = ''
        displayError.value = false
    }
}

const validateInputs = (): boolean => {
    if (!csvFile.value) {
        errorMsg.value = 'Please select a CSV file'
        displayError.value = true
        return false
    }
    if (!firstInvoiceNumber.value) {
        errorMsg.value = 'Please enter the first invoice number'
        displayError.value = true
        return false
    }
    if (!globalIssueDate.value) {
        errorMsg.value = 'Please enter the issue date'
        displayError.value = true
        return false
    }
    if (!sellerData.value) {
        errorMsg.value = 'Please enter seller data'
        displayError.value = true
        return false
    }
    return true
}

const processCSV = async () => {
    if (!validateInputs()) return

    if (!csvFile.value) return

    isProcessing.value = true
    errorMsg.value = ''
    displayError.value = false

    try {
        const text = await csvFile.value.text()
        const records = parseCSV(text)

        if (records.length === 0) {
            errorMsg.value = 'No valid records found with SENT or READY_FOR_SHIPMENT status'
            displayError.value = true
            isProcessing.value = false
            return
        }

        // Parse first invoice number to extract the number part
        const invoiceNumberMatch = firstInvoiceNumber.value.match(/^(\d+)\/(\d+)\/(\d+)$/)
        if (!invoiceNumberMatch) {
            errorMsg.value = 'Invalid invoice number format. Expected format: number/month/year (e.g., 2/10/2025)'
            displayError.value = true
            isProcessing.value = false
            return
        }

        const startNumber = parseInt(invoiceNumberMatch[1])
        const month = invoiceNumberMatch[2]
        const year = invoiceNumberMatch[3]

        // Sort records by saleDate (oldest first) for correct numbering and order
        const sortedRecords = [...records].sort((a: any, b: any) => {
            const ad = typeof a?.saleDateTs === 'number' ? a.saleDateTs : (a?.saleDate ? new Date(a.saleDate).getTime() : 0)
            const bd = typeof b?.saleDateTs === 'number' ? b.saleDateTs : (b?.saleDate ? new Date(b.saleDate).getTime() : 0)
            return ad - bd
        })

        // Prepare invoice data for each record in sorted order
        const invoiceData = sortedRecords.map((record, index) => {
            const invoiceNum = `${startNumber + index}/${month}/${year}`
            
            // Get currency from record and map to sign
            const currencyCode = record.paymentCurrency || 'PLN'
            const currency = mapCurrency(currencyCode)
            
            // Calculate totals for items - handle VAT calculation
            const items = record.items.map((item: any) => {
                // Calculate gross value from price * quantity
                const grossValue = item.price * item.quantity
                const vatRate = item.taxRate || 23
                const netValue = vatRate > 0 ? grossValue / (1 + vatRate / 100) : grossValue
                const netUnitValue = item.quantity > 0 ? netValue / item.quantity : 0

                return {
                    name: item.name,
                    quantity: item.quantity,
                    unit: 'szt. / pcs',
                    netUnitValue: netUnitValue,
                    vatRate: vatRate === 0 ? 0 : vatRate,
                    netValue: netValue,
                    grossValue: grossValue
                }
            })

            // Calculate sum of values
            const sumOfValues = items.reduce((acc: any, item: any) => {
                return {
                    netValue: acc.netValue + (item.netValue || 0),
                    grossValue: acc.grossValue + (item.grossValue || 0),
                    vatValue: acc.vatValue + ((item.grossValue || 0) - (item.netValue || 0))
                }
            }, { netValue: 0, grossValue: 0, vatValue: 0 })

            return {
                invoiceSettings: {
                    number: invoiceNum,
                    dueDate: globalIssueDate.value,
                    placeOfIssue: globalPlaceOfIssue.value,
                    saleDate: record.saleDate || globalIssueDate.value,
                    sellerData: sellerData.value,
                    buyerData: record.buyerData,
                    paymentMethod: 'Transfer',
                    isIssueDateDifferentThanSaleDate: true,
                    issueDate: globalIssueDate.value,
                    notes: ''
                },
                itemList: items,
                sumOfValues: sumOfValues,
                currency: currency
            }
        })

        emit('processInvoices', invoiceData)
        closeModal()
    } catch (error) {
        errorMsg.value = 'Error processing CSV file: ' + (error instanceof Error ? error.message : 'Unknown error')
        displayError.value = true
    } finally {
        isProcessing.value = false
    }
}

const closeModal = () => {
    csvFile.value = null
    firstInvoiceNumber.value = ''
    globalIssueDate.value = ''
    globalPlaceOfIssue.value = ''
    sellerData.value = ''
    errorMsg.value = ''
    displayError.value = false
    emit('close')
}

const handleOverlayClick = (event: MouseEvent) => {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
        closeModal()
    }
}
</script>

<template>
    <div v-if="isOpen" class="modal-overlay" @click="handleOverlayClick">
        <div class="modal-content" @click.stop>
            <div class="modal-header">
                <h2>Import CSV from Allegro</h2>
                <button class="close-button" @click="closeModal">×</button>
            </div>
            
            <div class="modal-body">
                <div class="form-group">
                    <label>CSV File</label>
                    <input type="file" accept=".csv" @change="handleFileSelect" />
                    <span v-if="csvFile" class="file-name">{{ csvFile.name }}</span>
                </div>

                <div class="form-group">
                    <label>First Invoice Number (e.g., 2/10/2025)</label>
                    <input 
                        type="text" 
                        v-model="firstInvoiceNumber" 
                        placeholder="2/10/2025"
                        maxlength="30"
                    />
                </div>

                <div class="form-group">
                    <label>Global Issue Date</label>
                    <input 
                        type="date" 
                        v-model="globalIssueDate"
                    />
                </div>

                <div class="form-group">
                    <label>Global Place of Issue</label>
                    <input 
                        type="text" 
                        v-model="globalPlaceOfIssue"
                        placeholder="Enter place of issue"
                        maxlength="30"
                    />
                </div>

                <div class="form-group">
                    <label>Seller Data</label>
                    <textarea 
                        v-model="sellerData" 
                        placeholder="Enter seller information"
                        style="height: 150px;"
                    />
                </div>

                <div v-if="displayError" class="error-container">
                    <DisplayErrorModal :msg="errorMsg" />
                </div>

                <div class="modal-footer">
                    <button class="cancel-button" @click="closeModal" :disabled="isProcessing">
                        Cancel
                    </button>
                    <button class="submit-button" @click="processCSV" :disabled="isProcessing">
                        {{ isProcessing ? 'Processing...' : 'Process CSV' }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.modal-content {
    background: white;
    border-radius: 8px;
    width: 90%;
    max-width: 600px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    border-bottom: 1px solid #DEDEEC;
}

.modal-header h2 {
    margin: 0;
    font-size: 22px;
    font-weight: 600;
}

.close-button {
    background: none;
    border: none;
    font-size: 32px;
    cursor: pointer;
    color: #666;
    line-height: 1;
    padding: 0;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.close-button:hover {
    color: #000;
}

.modal-body {
    padding: 20px;
}

.form-group {
    margin-bottom: 20px;
}

.form-group label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
    font-size: 14px;
}

.form-group input[type="file"] {
    width: 100%;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
}

.form-group input[type="text"],
.form-group input[type="date"] {
    width: 100%;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
    box-sizing: border-box;
}

.form-group textarea {
    width: 100%;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
    box-sizing: border-box;
    resize: vertical;
}

.file-name {
    display: block;
    margin-top: 5px;
    font-size: 12px;
    color: #666;
}

.error-container {
    margin-bottom: 20px;
}

.modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid #DEDEEC;
}

.cancel-button,
.submit-button {
    padding: 10px 20px;
    border: none;
    border-radius: 4px;
    font-size: 14px;
    cursor: pointer;
    font-weight: 500;
}

.cancel-button {
    background-color: #f5f5f5;
    color: #333;
}

.cancel-button:hover:not(:disabled) {
    background-color: #e0e0e0;
}

.submit-button {
    background-color: #383A4C;
    color: white;
}

.submit-button:hover:not(:disabled) {
    background-color: #2a2c3a;
}

.cancel-button:disabled,
.submit-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}
</style>

