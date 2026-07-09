import { createTheme } from '@mui/material/styles'

// Tema alinhado à identidade visual do UNO:
// - Azul institucional como cor primária (#1976d2)
// - Branco (#ffffff) como cor de fundo do PWA/manifest
// - Cinza neutro para fundos e textos secundários
// - Manrope para títulos, Roboto para corpo
const theme = createTheme({
  palette: {
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
    background: {
      default: '#f8fafc',
      paper: '#ffffff'
    },
    text: {
      primary: '#1e293b',
      secondary: '#64748b'
    }
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

export default theme
