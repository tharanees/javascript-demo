import { createTheme } from '@mui/material/styles';

const primary = {
  main: '#1976d2',
  light: '#63a4ff',
  dark: '#004ba0'
};

const secondary = {
  main: '#ff9800',
  light: '#ffc947',
  dark: '#c66900'
};

const background = {
  default: '#0f172a',
  paper: '#111c34'
};

const text = {
  primary: '#e2e8f0',
  secondary: '#94a3b8'
};

export default function buildTheme() {
  return createTheme({
    palette: {
      mode: 'dark',
      primary,
      secondary,
      background,
      text,
      divider: 'rgba(148, 163, 184, 0.24)'
    },
    shape: {
      borderRadius: 16
    },
    typography: {
      fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: background.paper
          }
        }
      }
    }
  });
}
