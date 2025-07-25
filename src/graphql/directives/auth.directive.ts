import { mapSchema, getDirective, MapperKind } from '@graphql-tools/utils';
import { defaultFieldResolver, GraphQLError, GraphQLSchema } from 'graphql';
import { RBAC } from '../../RBAC';

export interface AuthDirectiveArgs {
  feature?: string;
  permission?: string;
}

/**
 * GraphQL directive transformer for RBAC authentication and authorization.
 * Can auto-infer permissions from field names or use explicit configuration.
 * 
 * @example
 * ```graphql
 * type Query {
 *   # Auto-inferred permissions
 *   billingInvoices: [Invoice] @auth
 *   
 *   # Explicit permissions
 *   adminReset: Boolean @auth(feature: "admin", permission: "sudo")
 *   
 *   # Feature-level permission (infers permission from field name)
 *   billingCreate(input: CreateInput): Invoice @auth(feature: "billing")
 * }
 * 
 * type Mutation {
 *   # Auto-inferred: feature="user", permission="create"
 *   createUser(input: CreateUserInput): User @auth
 *   
 *   # Auto-inferred: feature="user", permission="update"  
 *   updateUser(id: ID!, input: UpdateUserInput): User @auth
 *   
 *   # Auto-inferred: feature="user", permission="delete"
 *   deleteUser(id: ID!): Boolean @auth
 * }
 * ```
 */
export function authDirectiveTransformer(schema: GraphQLSchema, directiveName = 'auth'): GraphQLSchema {
  return mapSchema(schema, {
    [MapperKind.OBJECT_FIELD]: (fieldConfig) => {
      const authDirective = getDirective(schema, fieldConfig, directiveName)?.[0];
      
      if (authDirective) {
        const { resolve = defaultFieldResolver } = fieldConfig;
        const { feature, permission } = authDirective as AuthDirectiveArgs;

        fieldConfig.resolve = async function (source, args, context, info) {
          try {
            if (!RBAC['config'] || !RBAC['initialized'] || !RBAC['dbAdapter']) {
              throw new GraphQLError('RBAC system not initialized', {
                extensions: { code: 'UNAUTHENTICATED' }
              });
            }

            // Extract user identity from GraphQL context
            const userIdentity = await getUserIdentityFromContext(context);
            
            // Get feature and permission
            const { feature: resolvedFeature, permission: resolvedPermission } = getFeatureAndPermission(
              info,
              feature,
              permission
            );

            // Check permissions
            const user = await RBAC['dbAdapter'].findUserByUserIdWithRole(userIdentity.user_id);

            if (!user) {
              throw new GraphQLError('User not found in RBAC system', {
                extensions: { code: 'UNAUTHENTICATED' }
              });
            }

            const role = user.role as any;
            if (!role || !role.features) {
              throw new GraphQLError('No role or features assigned', {
                extensions: { code: 'FORBIDDEN' }
              });
            }

            const userFeature = role.features.find((f: any) => f.feature.name === resolvedFeature);
            if (!userFeature) {
              throw new GraphQLError(`Access denied to feature: ${resolvedFeature}`, {
                extensions: { code: 'FORBIDDEN' }
              });
            }

            const hasPermission = userFeature.permissions.some((p: any) => p.name === resolvedPermission);
            if (!hasPermission) {
              throw new GraphQLError(`Permission denied: ${resolvedPermission} on ${resolvedFeature}`, {
                extensions: { code: 'FORBIDDEN' }
              });
            }

            return resolve.call(this, source, args, context, info);
          } catch (error) {
            if (error instanceof GraphQLError) {
              throw error;
            }
            throw new GraphQLError('Internal server error during permission check', {
              extensions: { code: 'INTERNAL_SERVER_ERROR' }
            });
          }
        };
      }
      
      return fieldConfig;
    }
  });
}

async function getUserIdentityFromContext(context: any): Promise<{ user_id: string; email?: string }> {
  if (RBAC['config']?.authAdapter) {
    // For GraphQL, we need to adapt the Express-style authAdapter
    // Assuming context contains request object or user info
    const request = context.req || context.request || context;
    return await RBAC['config'].authAdapter(request);
  }

  // Fallback: extract from context
  const user_id = context.user?.id || context.user?.user_id || context.user_id || context.userId;
  const email = context.user?.email || context.email;

  if (!user_id) {
    throw new GraphQLError('Unable to determine user identity. Provide authAdapter or attach user info to GraphQL context.', {
      extensions: { code: 'UNAUTHENTICATED' }
    });
  }

  return { user_id, email };
}

function getFeatureAndPermission(
  info: any,
  explicitFeature?: string,
  explicitPermission?: string
): { feature: string; permission: string } {
  if (explicitFeature && explicitPermission) {
    return { feature: explicitFeature, permission: explicitPermission };
  }

  const fieldName = info.fieldName.toLowerCase();
  const parentTypeName = info.parentType.name.toLowerCase();

  // If feature is explicitly provided, infer permission from field name
  if (explicitFeature) {
    const feature = explicitFeature;
    let permission = 'read';

    if (fieldName.startsWith('create') || fieldName.startsWith('add')) {
      permission = 'create';
    } else if (fieldName.startsWith('update') || fieldName.startsWith('edit') || fieldName.startsWith('modify')) {
      permission = 'update';
    } else if (fieldName.startsWith('delete') || fieldName.startsWith('remove')) {
      permission = 'delete';
    } else if (fieldName.includes('sudo') || fieldName.includes('admin')) {
      permission = 'sudo';
    } else if (parentTypeName === 'mutation') {
      permission = 'create'; // Default for mutations
    }

    return { feature, permission };
  }

  // Auto-infer both feature and permission
  let feature = 'default';
  let permission = 'read';

  // Extract feature from field name (e.g., billingInvoices -> billing)
  const featureMatch = fieldName.match(/^([a-z]+)[A-Z]/);
  if (featureMatch) {
    feature = featureMatch[1];
  } else {
    // If no camelCase pattern, use first word or entire field name
    const words = fieldName.split(/(?=[A-Z])/);
    feature = words[0] || 'default';
  }

  // Infer permission from field name and operation type
  if (fieldName.includes('sudo') || fieldName.includes('admin')) {
    permission = 'sudo';
  } else if (parentTypeName === 'mutation') {
    if (fieldName.startsWith('create') || fieldName.startsWith('add')) {
      permission = 'create';
    } else if (fieldName.startsWith('update') || fieldName.startsWith('edit') || fieldName.startsWith('modify')) {
      permission = 'update';
    } else if (fieldName.startsWith('delete') || fieldName.startsWith('remove')) {
      permission = 'delete';
    } else {
      permission = 'create'; // Default for mutations
    }
  } else {
    permission = 'read'; // Default for queries
  }

  return { feature, permission };
}