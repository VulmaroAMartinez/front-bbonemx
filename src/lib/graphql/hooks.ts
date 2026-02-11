/**
 * BB Maintenance - Custom GraphQL Hooks
 * Re-exporta hooks de Apollo Client con tipado mejorado
 */

'use client';

import {
  useQuery as useApolloQuery,
  useMutation as useApolloMutation,
  useLazyQuery as useApolloLazyQuery,
  useSubscription as useApolloSubscription,
  gql,
  type DocumentNode,
  type QueryHookOptions,
  type MutationHookOptions,
  type LazyQueryHookOptions,
  type SubscriptionHookOptions,
} from '@apollo/client';

// Re-exportar useQuery con tipado mejorado
export function useQuery<TData = unknown, TVariables = Record<string, unknown>>(
  query: DocumentNode,
  options?: QueryHookOptions<TData, TVariables>
) {
  return useApolloQuery<TData, TVariables>(query, options);
}

// Re-exportar useMutation con tipado mejorado
export function useMutation<TData = unknown, TVariables = Record<string, unknown>>(
  mutation: DocumentNode,
  options?: MutationHookOptions<TData, TVariables>
) {
  return useApolloMutation<TData, TVariables>(mutation, options);
}

// Re-exportar useLazyQuery
export function useLazyQuery<TData = unknown, TVariables = Record<string, unknown>>(
  query: DocumentNode,
  options?: LazyQueryHookOptions<TData, TVariables>
) {
  return useApolloLazyQuery<TData, TVariables>(query, options);
}

// Re-exportar useSubscription (para futuras implementaciones en tiempo real)
export function useSubscription<TData = unknown, TVariables = Record<string, unknown>>(
  subscription: DocumentNode,
  options?: SubscriptionHookOptions<TData, TVariables>
) {
  return useApolloSubscription<TData, TVariables>(subscription, options);
}

// Re-exportar gql
export { gql };
