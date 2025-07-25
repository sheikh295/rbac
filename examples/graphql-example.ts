/**
 * @fileoverview GraphQL integration example for @mamoorali295/rbac
 * 
 * This example demonstrates how to integrate RBAC with a GraphQL API.
 * Shows usage of directives, resolvers, and schema definitions.
 */

import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as mongoose from 'mongoose';
import * as express from 'express';
import * as http from 'http';
import * as cors from 'cors';

// Import RBAC GraphQL integration
import { 
  authDirectiveTransformer, 
  registerUserDirectiveTransformer, 
  rbacResolvers 
} from '@mamoorali295/rbac/graphql';

// Import main RBAC system for initialization
import { RBAC } from '@mamoorali295/rbac';

/**
 * GraphQL schema with RBAC directives
 */
const typeDefs = `
  directive @auth(feature: String, permission: String) on FIELD_DEFINITION
  directive @registerUser(userIdField: String, nameField: String, emailField: String) on FIELD_DEFINITION

  type User {
    id: ID!
    name: String!
    email: String!
    role: String
  }

  type Invoice {
    id: ID!
    amount: Float!
    description: String!
    userId: String!
  }

  type Query {
    # Auto-inferred permissions: feature="users", permission="read"
    users: [User!]! @auth
    
    # Auto-inferred permissions: feature="users", permission="read"
    user(id: ID!): User @auth
    
    # Auto-inferred permissions: feature="billing", permission="read"
    billingInvoices: [Invoice!]! @auth
    
    # Explicit permissions
    adminDashboard: String! @auth(feature: "admin", permission: "read")
    
    # RBAC system queries (from built-in resolvers)
    rbacUsers(page: Int, limit: Int, search: String): PaginatedUsers! @auth(feature: "admin", permission: "read")
    rbacRoles: [Role!]! @auth(feature: "admin", permission: "read")
    rbacStats: RbacStats! @auth(feature: "admin", permission: "read")
  }

  type Mutation {
    # Auto-inferred permissions: feature="users", permission="create"
    # Also registers user in RBAC system
    createUser(input: CreateUserInput!): User! @auth @registerUser
    
    # Auto-inferred permissions: feature="users", permission="update"
    updateUser(id: ID!, input: UpdateUserInput!): User! @auth
    
    # Auto-inferred permissions: feature="users", permission="delete"
    deleteUser(id: ID!): Boolean! @auth
    
    # Auto-inferred permissions: feature="billing", permission="create"
    createInvoice(input: CreateInvoiceInput!): Invoice! @auth
    
    # Explicit sudo permission
    resetSystem: Boolean! @auth(feature: "admin", permission: "sudo")
    
    # Role assignment with explicit admin permissions
    assignRole(userId: ID!, role: String!): User! @auth(feature: "admin", permission: "update")
    
    # Custom field mapping for user registration
    signUp(data: SignUpData!): User! @auth @registerUser(
      userIdField: "userId", 
      nameField: "fullName", 
      emailField: "emailAddress"
    )

    # RBAC system mutations (from built-in resolvers)
    createRbacUser(input: CreateUserInput!): User! @auth(feature: "admin", permission: "create") @registerUser
    createRbacRole(input: CreateRoleInput!): Role! @auth(feature: "admin", permission: "create")
    assignRbacRole(user_id: String!, role_name: String!): User! @auth(feature: "admin", permission: "update")
  }

  input CreateUserInput {
    id: ID!
    name: String!
    email: String!
  }

  input UpdateUserInput {
    name: String
    email: String
  }

  input CreateInvoiceInput {
    amount: Float!
    description: String!
    userId: String!
  }

  input SignUpData {
    userId: ID!
    fullName: String!
    emailAddress: String!
  }

  # Include RBAC built-in types
  ${readFileSync(join(__dirname, '../src/graphql/schema/rbac.graphql'), 'utf8')}
`;

/**
 * Custom resolvers for the example application
 */
const customResolvers = {
  Query: {
    users: async () => {
      // Your custom user fetching logic
      return [
        { id: '1', name: 'John Doe', email: 'john@example.com', role: 'admin' },
        { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'user' }
      ];
    },

    user: async (_: any, { id }: { id: string }) => {
      // Your custom user fetching logic
      return { id, name: 'John Doe', email: 'john@example.com', role: 'admin' };
    },

    billingInvoices: async () => {
      // Your custom invoice fetching logic
      return [
        { id: '1', amount: 100.0, description: 'Service fee', userId: '1' },
        { id: '2', amount: 50.0, description: 'Product purchase', userId: '2' }
      ];
    },

    adminDashboard: async () => {
      return 'Welcome to the admin dashboard!';
    }
  },

  Mutation: {
    createUser: async (_: any, { input }: { input: any }, context: any) => {
      // User is automatically registered in RBAC by @registerUser directive
      // Your custom user creation logic here
      console.log('Creating user:', input);
      console.log('RBAC user info:', context.rbacUser);
      
      return {
        id: input.id,
        name: input.name,
        email: input.email,
        role: 'user'
      };
    },

    updateUser: async (_: any, { id, input }: { id: string, input: any }) => {
      // Your custom user update logic
      console.log('Updating user:', id, input);
      return { id, ...input, role: 'user' };
    },

    deleteUser: async (_: any, { id }: { id: string }) => {
      // Your custom user deletion logic
      console.log('Deleting user:', id);
      return true;
    },

    createInvoice: async (_: any, { input }: { input: any }) => {
      // Your custom invoice creation logic
      console.log('Creating invoice:', input);
      return {
        id: Math.random().toString(36).substr(2, 9),
        ...input
      };
    },

    resetSystem: async () => {
      // Your custom system reset logic
      console.log('System reset initiated by admin');
      return true;
    },

    assignRole: async (_: any, { userId, role }: { userId: string, role: string }) => {
      // Use RBAC service to assign role
      await RBAC.assignRole(userId, role);
      
      // Return updated user (your custom logic)
      return { id: userId, name: 'User', email: 'user@example.com', role };
    },

    signUp: async (_: any, { data }: { data: any }, context: any) => {
      // User is automatically registered in RBAC by @registerUser directive
      // with custom field mapping
      console.log('Signing up user:', data);
      console.log('RBAC user info:', context.rbacUser);
      
      return {
        id: data.userId,
        name: data.fullName,
        email: data.emailAddress,
        role: 'user'
      };
    }
  }
};

/**
 * Merge custom resolvers with RBAC resolvers
 */
const resolvers = {
  Query: {
    ...customResolvers.Query,
    ...rbacResolvers.Query
  },
  Mutation: {
    ...customResolvers.Mutation,
    ...rbacResolvers.Mutation
  }
};

/**
 * Context function to extract user identity for GraphQL
 */
const context = ({ req }: { req: express.Request }) => {
  return {
    // Standard Express request
    req,
    
    // Extract user from various possible locations
    user: req.user || req.body?.user || null,
    user_id: req.user?.id || req.user?.user_id || req.headers['x-user-id'],
    email: req.user?.email || req.headers['x-user-email']
  };
};

/**
 * Create and configure Apollo Server
 */
async function createServer(httpServer: http.Server) {
  // Initialize RBAC system
  await mongoose.connect('mongodb://localhost:27017/rbac-graphql-example');
  
  await RBAC.init({
    database: {
      type: 'mongodb',
      connection: mongoose.connection
    },
    authAdapter: async (req: any) => {
      // For GraphQL, req might be the context object
      const user_id = req.user?.id || req.user?.user_id || req.user_id || req.userId;
      const email = req.user?.email || req.email;
      
      if (!user_id) {
        throw new Error('User not authenticated');
      }
      
      return { user_id, email };
    },
    defaultRole: 'user',
    onUserRegister: (user) => {
      console.log('New user registered via GraphQL:', user);
    }
  });

  // Create executable schema
  let schema = makeExecutableSchema({
    typeDefs,
    resolvers
  });

  // Apply directive transformers
  schema = authDirectiveTransformer(schema);
  schema = registerUserDirectiveTransformer(schema);

  const server = new ApolloServer({
    schema,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
    introspection: true
  });

  return server;
}

/**
 * Start the GraphQL server
 */
async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);
  
  // Add authentication middleware (example)
  const authMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    // Mock authentication - in real app, validate JWT token
    const userId = req.headers['x-user-id'] as string;
    const userEmail = req.headers['x-user-email'] as string;
    
    if (userId) {
      (req as any).user = {
        id: userId,
        email: userEmail || `${userId}@example.com`
      };
    }
    
    next();
  };

  const server = await createServer(httpServer);
  await server.start();
  
  // Apply the Apollo GraphQL middleware
  app.use(
    '/graphql',
    cors<cors.CorsRequest>(),
    express.json(),
    authMiddleware,
    expressMiddleware(server, {
      context: context
    })
  );
  
  // Mount RBAC admin dashboard
  app.use('/rbac-admin', RBAC.adminDashboard({
    user: 'admin',
    pass: 'secret123',
    sessionSecret: 'graphql-rbac-secret'
  }));
  
  const PORT = 4000;
  await new Promise<void>((resolve) => {
    httpServer.listen({ port: PORT }, resolve);
  });
  
  console.log(`🚀 GraphQL server with RBAC running at http://localhost:${PORT}/graphql`);
  console.log(`🔐 RBAC admin dashboard at http://localhost:${PORT}/rbac-admin`);
  console.log(`\nExample queries to test:`);
  console.log(`
    # Add these headers to your requests:
    # x-user-id: user123
    # x-user-email: user123@example.com
    
    query GetUsers {
      users {
        id
        name
        email
        role
      }
    }
    
    query GetRBACStats {
      rbacStats {
        users
        roles
        features
        permissions
      }
    }
    
    mutation CreateUser {
      createUser(input: { id: "new-user", name: "New User", email: "new@example.com" }) {
        id
        name
        email
        role
      }
    }
  `);
}

// Uncomment to run this example
// startServer().catch(console.error);