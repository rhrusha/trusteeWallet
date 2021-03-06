import React from 'react'
import { Dimensions, PixelRatio } from 'react-native'
import AsyncStorage from '@react-native-community/async-storage'

import { useColorScheme, Appearance } from 'react-native-appearance'

import { lightColors, darkColors } from './colors'
import MarketingEvent from '../../services/Marketing/MarketingEvent'


const { width: SCREEN_WIDTH } = Dimensions.get('window')
const PIXEL_RATIO = PixelRatio.get()

let GRID_SIZE = 16
if (PIXEL_RATIO <= 2 && SCREEN_WIDTH < 330) {
    GRID_SIZE = 8 // iphone 5s
}

let SYSTEM_COLOR_SCHEME = Appearance.getColorScheme()
if (SYSTEM_COLOR_SCHEME === 'no-preference') SYSTEM_COLOR_SCHEME = 'light'

export const ThemeContext = React.createContext({
    isLight: true,
    color: lightColors,
    GRID_SIZE,
})

export class ThemeProvider extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            isLight: SYSTEM_COLOR_SCHEME === 'light' // @todo dark mode will be back
        }
        this.getThemeSetting()
    }

    getThemeSetting = async () => {
        // return false // @even darker
        try {
            const res = await AsyncStorage.getItem('themeSetting')
            if (res !== null) {
                this.setState(() => ({ isLight: res === 'light' }))
            }
        } catch (e) {
            // Log.err(`HomeScreen getBalanceVisibility error ${e.message}`)
        }
    }

    changeTheme = async () => {
        const newTheme = this.state.isLight ? 'dark' : 'light'
        this.setState(() => ({ isLight: newTheme === 'light' }))
        await AsyncStorage.setItem('themeSetting', newTheme)
    }

    render() {
        const { isLight } = this.state
        const defaultTheme = {
            isLight,
            colors: isLight ? lightColors : darkColors,
            GRID_SIZE,
            changeTheme: this.changeTheme
        }
        MarketingEvent.UI_DATA.IS_LIGHT = isLight
        return (
            <ThemeContext.Provider value={defaultTheme}>
                {this.props.children}
            </ThemeContext.Provider>
        )
    }
}

export const useTheme = () => React.useContext(ThemeContext)
