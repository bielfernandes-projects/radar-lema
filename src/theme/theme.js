import { createTheme } from '@mui/material/styles'

export default function createAppTheme(mode) {
  return createTheme({
    palette: {
      mode,
      primary: {
        main: '#1976d2',
        light: '#42a5f5',
        dark: '#1565c0',
        contrastText: '#ffffff'
      },
      secondary: {
        main: '#64748b',
        light: '#94a3b8',
        dark: '#475569',
        contrastText: '#ffffff'
      },
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
              default: '#f8fafc',
              paper: '#ffffff'
            },
            text: {
              primary: '#1e293b',
              secondary: '#64748b'
            }
          })
    },
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      h1: { fontFamily: '"Manrope", "Roboto", sans-serif', fontWeight: 700 },
      h2: { fontFamily: '"Manrope", "Roboto", sans-serif', fontWeight: 700 },
      h3: { fontFamily: '"Manrope", "Roboto", sans-serif', fontWeight: 700 },
      h4: { fontFamily: '"Manrope", "Roboto", sans-serif', fontWeight: 700 },
      h5: { fontFamily: '"Manrope", "Roboto", sans-serif', fontWeight: 700 },
      h6: { fontFamily: '"Manrope", "Roboto", sans-serif', fontWeight: 700 },
      button: { fontFamily: '"Manrope", "Roboto", sans-serif', fontWeight: 600 }
    },
    shape: {
      borderRadius: 8
    }
  })
}
