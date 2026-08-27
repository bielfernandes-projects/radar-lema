import { createTheme } from '@mui/material/styles'

const blue = {
  50: '#eff6ff',
  100: '#dbeafe',
  200: '#bfdbfe',
  300: '#93c5fd',
  400: '#60a5fa',
  500: '#3b82f6',
  600: '#2563eb',
  700: '#1d4ed8',
  800: '#1e40af',
  900: '#1e3a8a'
}

// Escala de cinzas "UNO": 100 = terciaria (#EBEEF2), 500 = quaternaria (#768191)
const neutral = {
  50: '#f7f8fa',
  100: '#ebeef2',
  200: '#dce0e7',
  300: '#c2c8d2',
  400: '#9aa2b1',
  500: '#768191',
  600: '#5c6675',
  700: '#464e5a',
  800: '#333941',
  900: '#21252b'
}

const FAVORITE = {
  main: '#e0436f',
  light: '#f07497',
  dark: '#bf3357'
}

export default function createAppTheme(mode) {
  return createTheme({
    palette: {
      mode,
      primary: {
        main: blue[500],
        light: blue[300],
        dark: blue[700],
        contrastText: '#ffffff'
      },
      secondary: {
        main: neutral[600],
        light: neutral[400],
        dark: neutral[800],
        contrastText: '#ffffff'
      },
      favorite: FAVORITE,
      grey: neutral,
      ...(mode === 'dark'
        ? {
            background: {
              default: '#0f172a',
              paper: '#1e293b'
            },
            text: {
              primary: '#f1f5f9',
              secondary: neutral[400]
            }
          }
        : {
            background: {
              default: '#ebeef2',
              paper: '#ffffff'
            },
            text: {
              primary: '#1e293b',
              secondary: neutral[500]
            }
          })
    },
    typography: {
      fontFamily: '"Open Sans", "Helvetica Neue", "Arial", sans-serif',
      // Syncopate so tem pesos 400/700 e e bem larga -> letterSpacing negativo nos titulos
      h1: { fontFamily: '"Syncopate", "Open Sans", sans-serif', fontWeight: 700, letterSpacing: '-0.02em' },
      h2: { fontFamily: '"Syncopate", "Open Sans", sans-serif', fontWeight: 700, letterSpacing: '-0.02em' },
      h3: { fontFamily: '"Syncopate", "Open Sans", sans-serif', fontWeight: 700, letterSpacing: '-0.01em' },
      h4: { fontFamily: '"Syncopate", "Open Sans", sans-serif', fontWeight: 700 },
      h5: { fontFamily: '"Syncopate", "Open Sans", sans-serif', fontWeight: 700 },
      h6: { fontFamily: '"Syncopate", "Open Sans", sans-serif', fontWeight: 700 },
      subtitle1: { fontWeight: 600 },
      button: { fontWeight: 700 }
    },
    shape: {
      borderRadius: 10
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          'html, body': {
            overflowX: 'hidden'
          }
        }
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 700
          }
        }
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 14,
            boxShadow: mode === 'dark'
              ? '0 1px 2px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.25)'
              : '0 1px 2px rgba(15,23,42,0.04), 0 4px 16px rgba(15,23,42,0.06)'
          }
        }
      },
      MuiChip: {
        styleOverrides: {
          root: {
            fontWeight: 600
          }
        }
      }
    }
  })
}
