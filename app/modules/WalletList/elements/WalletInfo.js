/**
 * @version 0.31
 * @author yura
 */
import React from 'react'
import { connect } from 'react-redux'
import {
    View,
    Text,
    Animated,
    TouchableOpacity, StyleSheet
} from 'react-native'

import AsyncStorage from '@react-native-community/async-storage'
import Entypo from 'react-native-vector-icons/Entypo'
import moment from 'moment'

import CustomIcon from '@app/components/elements/CustomIcon'
import NavStore from '@app/components/navigation/NavStore'
import GradientView from '@app/components/elements/GradientView'
import LetterSpacing from '@app/components/elements/LetterSpacing'

import { setQRConfig } from '@app/appstores/Stores/QRCodeScanner/QRCodeScannerActions'
import { saveSelectedBasicCurrencyCode } from '@app/appstores/Stores/Main/MainStoreActions'
import cryptoWalletActions from '@app/appstores/Actions/CryptoWalletActions'
import settingsActions from '@app/appstores/Stores/Settings/SettingsActions'

import { strings } from '@app/services/i18n'
import Log from '@app/services/Log/Log'
import { capitalize } from '@app/services/UI/Capitalize/Capitalize'
import { checkQRPermission } from '@app/services/UI/Qr/QrPermissions'
import MarketingEvent from '@app/services/Marketing/MarketingEvent'

import { HIT_SLOP } from '@app/themes/HitSlop'

import { ThemeContext } from '@app/modules/theme/ThemeProvider'

import { SIZE } from '../helpers'


let CACHE_PREV_CURRENCY = false

class WalletInfo extends React.PureComponent {

    constructor(props) {
        super(props)
        this.state = {
            opacity: new Animated.Value(1),
            isViolet: false,
        }
    }

    // eslint-disable-next-line camelcase
    async UNSAFE_componentWillMount() {

        try {
            AsyncStorage.getItem('isViolet').then(res => {
                let isViolet = res
                isViolet = isViolet !== null ? JSON.parse(isViolet) : false

                this.setState(({
                    isViolet,
                }))
            })

        } catch (e) {
            Log.err('HomeScreen.WalletInfo Unsafe mount error ' + e.message)
        }

    }

    handleChangeLocal = async () => {
        const selectedBasicCurrency = this.props.selectedBasicCurrency
        Log.log('HomeScreen.WalletInfo handleChangeLocal', selectedBasicCurrency)
        if (selectedBasicCurrency.currencyCode !== 'USD') {
            if (CACHE_PREV_CURRENCY !== selectedBasicCurrency.currencyCode) {
                await settingsActions.setSettings('local_currency_homescreen', selectedBasicCurrency.currencyCode)
                CACHE_PREV_CURRENCY = selectedBasicCurrency.currencyCode
            }
            await saveSelectedBasicCurrencyCode('USD')
        } else {
            if (!CACHE_PREV_CURRENCY) {
                CACHE_PREV_CURRENCY = await settingsActions.getSetting('local_currency_homescreen')
            }
            if (!CACHE_PREV_CURRENCY) {
                CACHE_PREV_CURRENCY = 'UAH'
            }
            await saveSelectedBasicCurrencyCode(CACHE_PREV_CURRENCY)
        }
    }

    handleScanQr = () => checkQRPermission(this.qrPermissionCallback)

    handleOpenSettings = () => NavStore.goNext('SettingsMainScreen')

    qrPermissionCallback = () => {
        Log.log('WalletInfo handleScanQr started')

        setQRConfig({
            name: strings('components.elements.input.qrName'),
            successMessage: strings('components.elements.input.qrSuccess'),
            type: 'MAIN_SCANNER'
        })

        NavStore.goNext('QRCodeScannerScreen')
    }

    toggleViolet = async () => {
        await AsyncStorage.setItem('isViolet', JSON.stringify(!this.state.isViolet))

        Animated.timing(this.state.opacity, {
            toValue: 0,
            duration: 300
        }).start(() => {
            this.setState({ isViolet: !this.state.isViolet }, () => {
                Animated.timing(this.state.opacity, {
                    toValue: 1,
                    duration: 300
                }).start()
            })
        })
    }

    render() {
        const {
            changeBalanceVisibility,
            triggerBalanceVisibility,
            isBalanceVisible,
            originalVisibility,
            balanceData,
            walletNumber
        } = this.props
        const { isViolet } = this.state
        const { colors, GRID_SIZE } = this.context
        // @misha to optimize
        const date = new Date()
        const todayPrep = `${strings('homeScreen.today')}, ${date.getDate()} ${capitalize(moment(date).format('MMM'))}`

        return (
            <Animated.View style={{ opacity: this.state.opacity, marginHorizontal: GRID_SIZE, marginBottom: GRID_SIZE / 2 }}>
                <View style={styles.shadow__container}>
                    <View style={styles.shadow__item} />
                </View>
                <TouchableOpacity
                    style={styles.container}
                    activeOpacity={1}
                    onLongPress={this.toggleViolet}
                    delayLongPress={5000}
                >
                    <GradientView
                        style={styles.container__bg}
                        array={isViolet ? colors.homeScreen.listItemVioletGradient : colors.homeScreen.listItemGradient}
                        start={{ x: 1, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <View style={styles.container__top}>
                            <View style={styles.container__top__left}>
                                <Text style={[
                                    styles.container__title,
                                    { color: isViolet ? colors.homeScreen.text1Violet : colors.common.text1 }
                                ]}>
                                    {strings('homeScreen.balance')}
                                </Text>



                                {MarketingEvent.DATA.LOG_TESTER ? (
                                        <TouchableOpacity onPress={() => cryptoWalletActions.setNextWallet(walletNumber, 'HomeScreen.WalletInfo')} hitSlop={HIT_SLOP}>
                                            <LetterSpacing
                                                text={'NEXT WALLET'}
                                                textStyle={Object.assign({}, styles.container__date, { color: isViolet ? colors.homeScreen.dateColorViolet : colors.common.text2 })}
                                                letterSpacing={1}
                                            />
                                        </TouchableOpacity>
                                    )
                                    :
                                    <LetterSpacing
                                        text={todayPrep}
                                        textStyle={Object.assign({}, styles.container__date, { color: isViolet ? colors.homeScreen.dateColorViolet : colors.common.text2 })}
                                        letterSpacing={1}
                                    />

                                }
                            </View>
                            <TouchableOpacity style={styles.addAsset} onPress={() => NavStore.goNext('AddAssetScreen')}>
                                <View style={[styles.addAsset__content, { borderColor: isViolet ? colors.homeScreen.walletInfoTextViolet : colors.common.text1 }]}>
                                    <Entypo style={[styles.addAsset__icon, { color: isViolet ? colors.homeScreen.walletInfoTextViolet : colors.common.text3 }]} size={13} name="plus" />
                                    <Text style={[styles.addAsset__text, { color: isViolet ? colors.homeScreen.walletInfoTextViolet : colors.common.text3 }]}>
                                        {strings('settings.assets.addAsset').toUpperCase()}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.walletInfo__content}>
                            <TouchableOpacity
                                activeOpacity={0.8}
                                style={styles.walletInfo__content__balance}
                                onPressIn={() => triggerBalanceVisibility(true)}
                                onPressOut={() => triggerBalanceVisibility(false)}
                                disabled={originalVisibility}
                                hitSlop={{ top: 20, left: 20, right: isBalanceVisible ? 100 : 20, bottom: 20 }}
                            >
                                {
                                    isBalanceVisible ? (
                                        <React.Fragment>
                                            <TouchableOpacity onPress={this.handleChangeLocal}>
                                                <Text style={[
                                                    styles.walletInfo__text_small,
                                                    styles.walletInfo__text_small_first,
                                                    { color: isViolet ? colors.homeScreen.walletInfoTextViolet : colors.common.text1 }
                                                ]}>
                                                    {balanceData.currencySymbol}
                                                </Text>
                                            </TouchableOpacity>
                                            <Text style={[styles.walletInfo__text_middle, { color: isViolet ? colors.homeScreen.walletInfoTextViolet : colors.common.text1 }]}>{balanceData.beforeDecimal}</Text>
                                            <Text style={[styles.walletInfo__text_small, { color: isViolet ? colors.homeScreen.walletInfoTextViolet : colors.common.text1 }]}>{balanceData.afterDecimal}</Text>
                                        </React.Fragment>
                                    ) : (
                                            <Text style={[
                                                styles.walletInfo__text_middle,
                                                styles.walletInfo__hiddenBalance,
                                                { color: isViolet ? colors.homeScreen.walletInfoTextViolet : colors.common.text1 }
                                            ]}>****</Text>
                                        )
                                }

                            </TouchableOpacity>

                            <TouchableOpacity onPress={changeBalanceVisibility} hitSlop={HIT_SLOP}>
                                {isBalanceVisible ? (
                                    <CustomIcon name={'eye'} size={24} color={isViolet ? colors.homeScreen.visibilityIconViolet : colors.common.text1} />
                                ) : (
                                    <CustomIcon name={'eyeClosed'} size={24} color={isViolet ? colors.homeScreen.visibilityIconViolet : colors.common.text1} />
                                    )}
                            </TouchableOpacity>
                        </View>
                    </GradientView>
                </TouchableOpacity>
            </Animated.View>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        selectedBasicCurrency: state.mainStore.selectedBasicCurrency,
        cryptoCurrencies: state.currencyStore.cryptoCurrencies,
        accountList: state.accountStore.accountList
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        dispatch
    }
}

WalletInfo.contextType = ThemeContext

export default connect(mapStateToProps, mapDispatchToProps)(WalletInfo)


const styles = StyleSheet.create({
    notificationButton: {
        paddingHorizontal: 12
    },
    qrButton: {
        paddingHorizontal: 10
    },
    settingsButton: {
        paddingLeft: 10,
        paddingRight: 12,
    },
    shadow__container: {
        position: 'absolute',
        paddingTop: 1,
        paddingBottom: 3,
        paddingRight: 3,
        paddingLeft: 3,
        top: 0,
        bottom: 0,
        right: 0,
        left: 0,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    shadow__item: {
        flex: 1,
        borderRadius: SIZE,
        elevation: 10,

        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 5
        },
        shadowOpacity: 0.1,
        shadowRadius: 6.27,
    },
    container: {
        borderRadius: SIZE,
        zIndex: 2
    },
    container__bg: {
        flex: 1,

        paddingHorizontal: SIZE - 1,
        paddingBottom: SIZE - 1,
        borderRadius: SIZE
    },
    container__top: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',

        marginBottom: 4
    },
    container__title: {
        marginTop: 14,
        marginLeft: -1,

        fontFamily: 'Montserrat-SemiBold',
        fontSize: 17
    },
    container__date: {
        marginTop: 2,

        fontSize: 10,
        fontFamily: 'SFUIDisplay-Semibold',
    },
    walletInfo__content: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    walletInfo__content__balance: {
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    walletInfo__text_small: {
        fontSize: 20,
        fontFamily: 'Montserrat-Medium',

        opacity: .8
    },
    walletInfo__text_small_first: {
        marginRight: 5
    },
    walletInfo__text_middle: {
        height: 42,
        fontSize: 52,
        fontFamily: 'Montserrat-Light',
        lineHeight: 50
    },
    walletInfo__hiddenBalance: {
        lineHeight: 58
    },
    addAsset: {
        paddingVertical: 19,
        paddingLeft: 15
    },
    addAsset__content: {
        position: 'relative',

        flexDirection: 'row',
        alignItems: 'center',

        height: 30,

        paddingHorizontal: 8,
        paddingVertical: 5,
        paddingLeft: 4,

        borderRadius: 6,
        borderWidth: 1.5
    },
    addAsset__text: {
        fontSize: 10,
        fontFamily: 'Montserrat-Bold'
    },
    addAsset__icon: {
        marginRight: 2,
        marginTop: 1,
    },
})
