/**
 * @version 0.44
 */
import React, { PureComponent } from 'react'
import { View, StyleSheet, ScrollView, Text } from 'react-native'
import { strings, sublocale } from '@app/services/i18n'
import ALL_TERMS from '@app/../__terms__/ALL'
import MarketingAnalytics from '@app/services/Marketing/MarketingAnalytics'
import ScreenWrapper from '@app/components/elements/ScreenWrapper'


class PrivacyPolicyScreen extends PureComponent {

    render() {
        MarketingAnalytics.setCurrentScreen('Settings.PrivacyPolicyScreen')

        let sub = sublocale()
        if (sub !== 'uk' && sub !== 'ru') {
            sub = 'en'
        }

        return (
            <ScreenWrapper
                title={strings('settings.about.privacy')}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    style={styles.wrapper__scrollView}
                >
                    <View style={styles.wrapper__content}>
                        <Text style={styles.title}>
                            {strings('settings.about.privacy')}
                        </Text>
                        <Text style={styles.text}>
                            {ALL_TERMS.PRIVACY_POLICY[sub]}
                        </Text>
                    </View>
                </ScrollView>
            </ScreenWrapper>
        )
    }
}


export default PrivacyPolicyScreen

const styles = StyleSheet.create({
    wrapper__scrollView: {
        marginTop: 80
    },
    wrapper__top: {
        height: 145,
        marginBottom: 35
    },
    wrapper__bg: {
        width: '100%',
        height: '100%'
    },
    wrapper__content: {
        paddingLeft: 15,
        paddingRight: 15,
        marginTop: 35
    },
    title: {
        marginLeft: 28,
        fontFamily: 'SFUIDisplay-Semibold',
        fontSize: 16,
        color: '#404040'
    },
    text: {
        width: '100%',
        paddingLeft: 15,
        paddingRight: 15,
        marginBottom: 10,

        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 14,
        textAlign: 'left',
        color: '#404040'
    }
})
