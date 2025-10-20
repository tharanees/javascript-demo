import React from 'react';
import ReactDOM from 'react-dom/client';
import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client/core';
import { ApolloProvider } from '@apollo/client/react';
import { CssBaseline, ThemeProvider } from '@mui/material';
import AppShell from './layouts/AppShell.jsx';
import createTheme from './theme/theme.js';
import './theme/global.css';

const client = new ApolloClient({
  link: new HttpLink({ uri: '/graphql' }),
  cache: new InMemoryCache(),
  connectToDevTools: true
});

const theme = createTheme();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ApolloProvider client={client}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AppShell />
      </ThemeProvider>
    </ApolloProvider>
  </React.StrictMode>
);
