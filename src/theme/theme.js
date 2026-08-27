import { createTheme } from '@mui/material/styles'

const blue = {
  50: '#eef6ff',
  100: '#d9ecfe',
  200: '#bcdcfd',
  300: '#8ec6fa',
  400: '#59a8f4',
  500: '#2f8be8',
  600: '#1976d2',
  700: '#1563b4',
  800: '#155494',
  900: '#174a7a'
}

const neutral = {
  50: '#f7f8fa',
  100: '#eef0f4',
  200: '#dfe2ea',
  300: '#c6cbd8',
  400: '#a6adbe',
  500: '#82899e',
  600: '#6b738a',
  700: '#565d73',
  800: '#3b4155',
  900: '#232840'
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
        main: blue[600],
        light: blue[300],
        dark: blue[800],
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
              secondary: '#94a3b8'
            }
          }
        : {
            background: {
              default: '#f6f7f9',
              paper: '#ffffff'
            },
            text: {
              primary: '#1e293b',
              secondary: '#5f6b7e'
            }
          })
    },
    typography: {
      fontFamily: '"Manrope", "Helvetica Neue", "Arial", sans-serif',
      h1: { fontFamily: '"Manrope", sans-serif', fontWeight: 800 },
      h2: { fontFamily: '"Manrope", sans-serif', fontWeight: 800 },
      h3: { fontFamily: '"Manrope", sans-serif', fontWeight: 800 },
      h4: { fontFamily: '"Manrope", sans-serif', fontWeight: 700 },
      h5: { fontFamily: '"Manrope", sans-serif', fontWeight: 700 },
      h6: { fontFamily: '"Manrope", sans-serif', fontWeight: 700 },
      subtitle1: { fontWeight: 600 },
      button: { fontFamily: '"Manrope", sans-serif', fontWeight: 700 }
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
