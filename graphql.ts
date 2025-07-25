/**
 * @fileoverview GraphQL integration for @mamoorali295/rbac
 * 
 * This module provides GraphQL-specific directives, resolvers, and schema
 * for seamless integration with GraphQL APIs.
 * 
 * @example
 * ```typescript
 * import { AuthDirective, RegisterUserDirective, rbacResolvers } from '@mamoorali295/rbac/graphql';
 * import { readFileSync } from 'fs';
 * 
 * const typeDefs = readFileSync('./rbac.graphql', 'utf8');
 * 
 * const server = new ApolloServer({
 *   typeDefs: [typeDefs, yourOtherTypeDefs],
 *   resolvers: [rbacResolvers, yourOtherResolvers],
 *   schemaDirectives: {
 *     auth: AuthDirective,
 *     registerUser: RegisterUserDirective
 *   }
 * });
 * 
 * // Usage in GraphQL schema
 * // type Query {
 * //   billingInvoices: [Invoice] @auth
 * //   adminReset: Boolean @auth(feature: "admin", permission: "sudo")
 * // }
 * //
 * // type Mutation {
 * //   createUser(input: CreateUserInput): User @auth @registerUser
 * // }
 * ```
 */

// Check if GraphQL dependencies are available
try {
  require('@apollo/server');
  require('@graphql-tools/utils');
  require('@graphql-tools/schema');
  require('graphql');
  // If dependencies are available, export the GraphQL integration
  module.exports = require('./dist/graphql');
} catch (error) {
  throw new Error(
    'GraphQL dependencies not found. Please install the required GraphQL packages to use GraphQL integration:\n\n' +
    'npm install @apollo/server @graphql-tools/utils @graphql-tools/schema graphql\n\n' +
    'Or if using yarn:\n' +
    'yarn add @apollo/server @graphql-tools/utils @graphql-tools/schema graphql'
  );
}