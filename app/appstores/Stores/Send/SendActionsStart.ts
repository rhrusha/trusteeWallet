/**
 * @version 0.41
 */
import NavStore from '@app/components/navigation/NavStore'

import AsyncStorage from '@react-native-community/async-storage'

import BlocksoftPrettyNumbers from '@crypto/common/BlocksoftPrettyNumbers'
import { BlocksoftBlockchainTypes } from '../../blockchains/BlocksoftBlockchainTypes'
import { BlocksoftTransferUtils } from '@crypto/actions/BlocksoftTransfer/BlocksoftTransferUtils'
import { SendActionsBlockchainWrapper } from '@app/appstores/Stores/Send/SendActionsBlockchainWrapper'

import store from '@app/store'

const { dispatch } = store

let CACHE_SEND_INPUT_TYPE = 'none'

const findWalletPlus = function(currencyCode: string): { wallet: any, cryptoCurrency: any, account: any } {

    const { selectedWallet } = store.getState().mainStore
    const { cryptoCurrencies } = store.getState().currencyStore
    const { accountList } = store.getState().accountStore

    let cryptoCurrency = { currencyCode: false }
    let account = false
    // @ts-ignore
    for (const tmp of cryptoCurrencies) {
        if (tmp.currencyCode === currencyCode) {
            cryptoCurrency = tmp
        }
    }
    if (cryptoCurrency.currencyCode) {
        // @ts-ignore
        account = accountList[selectedWallet.walletHash][cryptoCurrency.currencyCode]
    }
    return { wallet: selectedWallet, cryptoCurrency, account }
}

const formatDict = function(cryptoCurrency : any, account : any) {
    return {
        inputType : '',
        decimals : cryptoCurrency.decimals,
        extendsProcessor : cryptoCurrency.extendsProcessor,
        addressUiChecker : cryptoCurrency.addressUiChecker,
        network : cryptoCurrency.network,
        currencySymbol : cryptoCurrency.currencySymbol,
        currencyName : cryptoCurrency.currencyName,
        walletHash : account.walletHash,
        accountId : account.accountId,
        addressFrom : account.address,
        currencyCode : account.currencyCode,
        balanceRaw : account.balanceRaw,
        balanceTotalPretty : account.balanceTotalPretty,
        basicCurrencyBalanceTotal : account.basicCurrencyBalanceTotal,
        basicCurrencySymbol : account.basicCurrencySymbol,
        basicCurrencyCode : account.basicCurrencyCode,
        basicCurrencyRate : account.basicCurrencyRate,
        feesBasicCurrencyRate : account.feeRates.basicCurrencyRate,
        feesBasicCurrencySymbol : account.feeRates.basicCurrencySymbol,
        feesCurrencyCode : account.feesCurrencyCode,
        feesCurrencySymbol : account.feesCurrencySymbol
    }
}

export namespace SendActionsStart {

    export const setBasicInputType = async (inputType : string) => {
        CACHE_SEND_INPUT_TYPE = inputType
        AsyncStorage.setItem('sendInputType', inputType)
    }

    export const startFromAccountScreen = async (cryptoCurrency : any, account : any, uiType = 'ACCOUNT_SCREEN') => {
        if (CACHE_SEND_INPUT_TYPE === 'none') {
            CACHE_SEND_INPUT_TYPE = (await AsyncStorage.getItem('sendInputType') !== 'CRYPTO') ? 'FIAT' : 'CRYPTO'
        }
        const dict = formatDict(cryptoCurrency, account)
        dict.inputType = CACHE_SEND_INPUT_TYPE
        SendActionsBlockchainWrapper.beforeRender(cryptoCurrency, account)
        dispatch({
            type: 'RESET_DATA',
            ui: {
                uiType,
            },
            dict
        })
        NavStore.goNext('SendScreen')
    }


    export const startFromHomeScreen = async (cryptoCurrency : any, account : any)  => {
        return startFromAccountScreen(cryptoCurrency, account, 'HOME_SCREEN')
    }

    export const getTransferAllBalanceFromBSE = async (data : {
        currencyCode : BlocksoftBlockchainTypes.Code,
        address : string
    }) => {
        const addressToForTransferAll = BlocksoftTransferUtils.getAddressToForTransferAll(data)
        const { cryptoCurrency, account } = findWalletPlus(data.currencyCode)
        const dict = formatDict(cryptoCurrency, account)
        SendActionsBlockchainWrapper.beforeRender(cryptoCurrency, account, {
            addressTo : addressToForTransferAll,
            amount :  '0',
        })
        const ui = {
            uiType : 'TRADE_SEND',
            addressTo : addressToForTransferAll,
            cryptoValue : '0',
            isTransferAll : true
        }
        dispatch({
            type: 'RESET_DATA',
            ui,
            dict
        })
        return await SendActionsBlockchainWrapper.getTransferAllBalance()
    }

    export const startFromBSE = async (data : {
        amount : string,
        addressTo : string,
        memo : string,
        comment : string,
        currencyCode : string,
        isTransferAll : boolean
    }, bse : {
        bseProviderType : any,
        bseOrderId: any,
        bseMinCrypto : any,
        bseTrusteeFee : any,
        bseOrderData : any
    }) => {
        const { cryptoCurrency, account } = findWalletPlus(data.currencyCode)
        const dict = formatDict(cryptoCurrency, account)
        SendActionsBlockchainWrapper.beforeRender(cryptoCurrency, account, {
            addressTo : data.addressTo,
            amount :  data.amount,
            memo : data.memo
        })
        const ui = {
            uiType : 'TRADE_SEND',
            addressTo : data.addressTo,
            memo : data.memo,
            comment : data.comment,
            cryptoValue : data.amount,
            isTransferAll : data.isTransferAll,
            bse
        }
        dispatch({
            type: 'RESET_DATA',
            ui,
            dict
        })
        await SendActionsBlockchainWrapper.getFeeRate(ui)
        NavStore.goNext('ReceiptScreen')
    }



    export const startFromDeepLinking = async (data :{
        needToDisable?: boolean,
        address: string,
        amount: string | number,
        currencyCode: string,
        label: string
    }, uiType = 'DEEP_LINKING') => {
        const { cryptoCurrency, account } = findWalletPlus(data.currencyCode)
        const dict = formatDict(cryptoCurrency, account)
        const addressTo = data.address ? data.address : ''
        const amount = data.amount ? data.amount.toString() : '0'
        const amountRaw = BlocksoftPrettyNumbers.setCurrencyCode(data.currencyCode).makeUnPretty(amount)

        SendActionsBlockchainWrapper.beforeRender(cryptoCurrency, account, {
            addressTo : addressTo,
            amount :  amountRaw,
        })
        const ui = {
            uiType,
            uiInputType: amount !== '0' ? 'CRYPTO' : 'any',
            addressTo : addressTo,
            comment : data.label || '',
            cryptoValue : amountRaw
        }
        dispatch({
            type: 'RESET_DATA',
            ui,
            dict
        })

        if (typeof data.needToDisable !== 'undefined' && data.needToDisable
            && addressTo && addressTo !== ''
            && amount && amount !== '' && amount !== '0'
        ) {
            await SendActionsBlockchainWrapper.getFeeRate(ui)
            NavStore.goNext('ReceiptScreen')
        } else {
            NavStore.goNext('SendScreen')
        }
    }

    export const startFromQRCodeScanner = async (data : any, uiType = 'MAIN_SCANNER') => {
        return startFromDeepLinking(data, uiType)
    }

    export const startFromFioRequest = async (currencyCode : any,
        fioRequestDetails :  {
            // eslint-disable-next-line camelcase
            content: {amount: string, memo: string, payee_public_address: string},
            // eslint-disable-next-line camelcase
            fio_request_id: number,
            // eslint-disable-next-line camelcase
            payee_fio_address: string,
            // eslint-disable-next-line camelcase
            payee_fio_public_key: string,
            // eslint-disable-next-line camelcase
            payer_fio_address: string,
            // eslint-disable-next-line camelcase
            payer_fio_public_key: string,
            // eslint-disable-next-line camelcase
            time_stamp: string
        }) => {
        const { cryptoCurrency, account } = findWalletPlus(currencyCode)
        const dict = formatDict(cryptoCurrency, account)

        const amount = fioRequestDetails.content.amount
        const amountRaw = BlocksoftPrettyNumbers.setCurrencyCode(currencyCode).makeUnPretty(amount)

        SendActionsBlockchainWrapper.beforeRender(cryptoCurrency, account, {
            addressTo: fioRequestDetails.content.payee_public_address,
            amount: amountRaw,
        })
        const ui = {
            uiType: 'FIO_REQUEST',
            addressTo: fioRequestDetails.content.payee_public_address,
            addressName:  fioRequestDetails.payee_fio_address,
            comment: fioRequestDetails.content.memo,
            cryptoValue: amountRaw,
            fioRequestDetails
        }
        dispatch({
            type: 'RESET_DATA',
            ui,
            dict
        })

        await SendActionsBlockchainWrapper.getFeeRate(ui)
        NavStore.goNext('ReceiptScreen')
    }

    export const startFromTransactionScreenRemove = async (account : any, transaction : any) => {
        /*
                    await SendActions.cleanData()
            SendActions.setUiType({
                ui: {
                    uiType : 'TRANSACTION_SCREEN_REMOVE'
                },
                addData: {
                    gotoReceipt: true,
                }
            })
            await SendActions.startSend({
                addressTo : account.address,
                amountRaw : transaction.addressAmount,
                transactionRemoveByFee : transaction.transactionHash,
                transactionBoost : transaction
            })
         */
    }

    export const startFromTransactionScreenBoost = async (account : any, transaction : any) => {
        /*

                    const params = {
                amountRaw : transaction.addressAmount,
                transactionBoost : transaction
            }
            if (transaction.transactionDirection === 'income') {
                params.transactionSpeedUp = transaction.transactionHash
                params.addressTo = account.address
            } else {
                params.transactionReplaceByFee = transaction.transactionHash
                params.addressTo = transaction.addressTo
            }
            await SendActions.cleanData()
            SendActions.setUiType({
                ui: {
                    uiType : 'TRANSACTION_SCREEN'
                },
                addData: {
                    gotoReceipt: true,
                }
            })
         */
    }
}
