/**
 * BB Maintenance - Configuración de Apollo Client
 * Cliente GraphQL configurado para conectarse a un backend NestJS code-first
 */

'use client';

import { ApolloClient, InMemoryCache, HttpLink, from, ApolloLink } from '@apollo/client';
import { onError } from '@apollo/client/link/error';

// Obtener la URL del endpoint GraphQL desde variables de entorno
const GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://localhost:3001/graphql';

// Link para manejo de errores
const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) => {
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${JSON.stringify(locations)}, Path: ${path}`
      );
    });
  }
  if (networkError) {
    console.error(`[Network error]: ${networkError}`);
  }
});

// Link para agregar headers de autenticación
const authLink = new ApolloLink((operation, forward) => {
  // Obtener el token de autenticación desde localStorage
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  
  // Agregar el token al contexto de la operación
  operation.setContext(({ headers = {} }) => ({
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  }));
  
  return forward(operation);
});

// Link HTTP para conectarse al servidor GraphQL
const httpLink = new HttpLink({
  uri: GRAPHQL_ENDPOINT,
  credentials: 'include', // Incluir cookies en las peticiones
});

// Crear el cliente Apollo
export const apolloClient = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          // Configuración de cache para queries específicas
          workOrders: {
            merge(existing = [], incoming) {
              return incoming;
            },
          },
          notifications: {
            merge(existing = [], incoming) {
              return incoming;
            },
          },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
      errorPolicy: 'all',
    },
    query: {
      fetchPolicy: 'network-only',
      errorPolicy: 'all',
    },
    mutate: {
      errorPolicy: 'all',
    },
  },
});
