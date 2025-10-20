import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';

const link = new HttpLink({ uri: '/graphql' });

export const apolloClient = new ApolloClient({
  link,
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          marketOverview: {
            keyArgs: ['symbols'],
            merge(existing = [], incoming) {
              return incoming;
            },
          },
        },
      },
    },
  }),
});
