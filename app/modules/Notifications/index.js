
import React from 'react'
import { connect } from 'react-redux'
import {
    View,
    Text,
    ScrollView,
    SafeAreaView,
    SectionList,
    StyleSheet,
    TouchableOpacity,
    Linking
} from 'react-native'
import firebase from 'react-native-firebase'
import _forEach from 'lodash/forEach'
import _cloneDeep from 'lodash/cloneDeep'
import moment from 'moment'

import NavStore from '../../components/navigation/NavStore'

import AppNewsActions from '../../appstores/Stores/AppNews/AppNewsActions'

import { strings, sublocale } from '../../services/i18n'
import { ThemeContext } from '../../modules/theme/ThemeProvider'
import Header from '../../components/elements/new/Header'
import ListItem from '../../components/elements/new/list/ListItem/Notification'
import Tabs from './elements/Tabs'


const NOTIFIES_GROUP = {
    BSE_ORDERS: 'BSE_ORDERS',
    PAYMENT_DETAILS: 'PAYMENT_DETAILS',
    RATES_CHANGING: 'RATES_CHANGING',
    NEWS: 'NEWS',
    ALL: 'ALL',
}

const ALLOWED_NOTIFICATIONS = [
    NOTIFIES_GROUP.BSE_ORDERS,
    NOTIFIES_GROUP.PAYMENT_DETAILS,
    NOTIFIES_GROUP.RATES_CHANGING,
    NOTIFIES_GROUP.NEWS
]

class NotificationsScreen extends React.Component {
    state = {
        headerHeight: 0,
        tabs: [
            {
                title: strings('notifications.tabAll'),
                index: 0,
                active: true,
                hasNewNoties: false,
                group: NOTIFIES_GROUP.ALL
            },
            {
                title: strings('notifications.tabNews'),
                index: 1,
                active: false,
                hasNewNoties: false,
                group: NOTIFIES_GROUP.NEWS
            },
        ],
        data: []
    }

    currentLocale;
    allowedNotifications = ALLOWED_NOTIFICATIONS

    componentDidMount() {
        this.currentLocale = sublocale()
        this.prepareData()
    }

    UNSAFE_componentWillReceiveProps(nextProps) {
        this.prepareData(nextProps.notifications)
    }

    prepareData = (notifications = this.props.notifications) => {
        const tabs = _cloneDeep(this.state.tabs)

        const tabsThatHaveNoties = []
        notifications.forEach((notif) => {
            if (notif.newsOpenedAt === null && !tabsThatHaveNoties.includes(notif.newsGroup)) tabsThatHaveNoties.push(notif.newsGroup)
        })

        const filteredAlllowed = notifications.filter(notif => this.allowedNotifications.includes(notif.newsGroup))
        filteredAlllowed.forEach((notification, i) => {
            const timestamp = Number(notification.newsCreated)
            if (!isNaN(timestamp) && timestamp !== 0) {
                notification.receivedAtDay = moment(timestamp).startOf('day').calendar()
            } else {
                notification.receivedAtDay = null
            }
        })
        const grouped = filteredAlllowed.reduce((grouped, notif) => {
            if (!grouped[notif.receivedAtDay]) grouped[notif.receivedAtDay] = []
            grouped[notif.receivedAtDay].push(notif)
            return grouped
        }, {})

        const data = []
        _forEach(grouped, (arr, date) => {
            if (date !== null && arr.length) {
                data.push({
                    title: date,
                    data: arr
                })
            }
        })

        tabs.forEach((tab) => {
            if (tab.group === NOTIFIES_GROUP.ALL) {
                tab.hasNewNoties = !!tabsThatHaveNoties.length
            } else {
                tab.hasNewNoties = tabsThatHaveNoties.includes(tab.group)
            }
        })

        this.setState(() => ({ data, tabs }))
    }

    setHeaderHeight = (height) => {
        const headerHeight = Math.round(height || 0);
        this.setState(() => ({ headerHeight }))
    }

    handleBack = () => { NavStore.goBack() }

    handleChangeTab = (newTab) => {
        if (newTab.group === NOTIFIES_GROUP.ALL) {
            this.allowedNotifications = ALLOWED_NOTIFICATIONS
        } else {
            this.allowedNotifications = [newTab.group]
        }
        const newTabs = this.state.tabs.map(tab => ({
            ...tab,
            active: tab.index === newTab.index,
        }))
        this.setState(() => ({ tabs: newTabs }), () => { this.prepareData() })
    }

    renderTabs = () => <Tabs tabs={this.state.tabs} changeTab={this.handleChangeTab} />

    renderListItem = ({ item, section, index }) => {
        let title;
        let subtitle;
        const notifData = item.newsJson.notification?.[this.currentLocale]
        if (notifData) {
            title = notifData.title
            subtitle = notifData.description
        }
        return (
            <ListItem
                title={title || subtitle}
                subtitle={title ? subtitle : null}
                iconType=""
                onPress={() => this.handleOpenNotification(item, title || subtitle)}
                rightContent={item.newsGroup === NOTIFIES_GROUP.BSE_ORDERS ? 'arrow' : null}
                isNew={item.newsOpenedAt === null}
                last={index === section.data.length - 1}
            />
        )
    }

    handleOpenNotification = async (notification, title) => {
        if (notification.newsOpenedAt === null) {
            await AppNewsActions.markAsOpened(notification.id)
        }
        if (notification.newsUrl && notification.newsUrl !== 'null') {
            NavStore.goNext('WebViewScreen', { url: notification.newsUrl, title })
            return
        }
        // TODO: add orders processing
    }

    render() {
        const { colors, GRID_SIZE } = this.context
        const { headerHeight, data } = this.state

        firebase.analytics().setCurrentScreen('NotificationsScreen')

        return (
            <View style={[styles.container, { backgroundColor: colors.common.background }]}>
                <Header
                    rightType="close"
                    rightAction={this.handleBack}
                    title={strings('notifications.title')}
                    setHeaderHeight={this.setHeaderHeight}
                    ExtraView={this.renderTabs}
                />
                <SafeAreaView style={[styles.content, {
                    backgroundColor: colors.common.background,
                    marginTop: headerHeight,
                }]}>
                    <SectionList
                        showsVerticalScrollIndicator={false}
                        sections={data}
                        stickySectionHeadersEnabled={false}
                        contentContainerStyle={{ marginTop: GRID_SIZE * 1.5, paddingHorizontal: GRID_SIZE }}
                        renderItem={this.renderListItem}
                        renderSectionHeader={({ section: { title } }) => (
                            <Text style={[styles.blockTitle, { color: colors.common.text3, marginLeft: GRID_SIZE }]}>{title}</Text>
                        )}
                        renderSectionFooter={() => <View style={{ flex: 1, height: GRID_SIZE * 2 }} />}
                    />
                </SafeAreaView>
            </View>
        )
    }
}


const mapStateToProps = (state) => {
    return {
        notifications: state.appNewsStore.appNewsList
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        dispatch
    }
}

NotificationsScreen.contextType = ThemeContext

export default connect(mapStateToProps, mapDispatchToProps)(NotificationsScreen)

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    content: {
        flex: 1,
    },
    blockTitle: {
        fontFamily: 'Montserrat-Bold',
        fontSize: 12,
        lineHeight: 12,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
    },
})