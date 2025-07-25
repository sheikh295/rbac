import { mapSchema, getDirective, MapperKind } from '@graphql-tools/utils';
import { defaultFieldResolver, GraphQLError, GraphQLSchema } from 'graphql';
import { RBAC } from '../../RBAC';

export interface RegisterUserDirectiveArgs {
  userIdField?: string;
  nameField?: string;
  emailField?: string;
}

/**
 * GraphQL directive transformer for automatically registering users in the RBAC system.
 * Automatically assigns default role if configured and calls registration hooks.
 * 
 * @example
 * ```graphql
 * type Mutation {
 *   # Default field mapping (id -> user_id, name -> name, email -> email)
 *   createUser(input: CreateUserInput): User @registerUser
 *   
 *   # Custom field mapping
 *   signUp(data: SignUpInput): User @registerUser(
 *     userIdField: "userId", 
 *     nameField: "fullName", 
 *     emailField: "emailAddress"
 *   )
 * }
 * 
 * input CreateUserInput {
 *   id: ID!
 *   name: String
 *   email: String
 * }
 * 
 * input SignUpInput {
 *   userId: ID!
 *   fullName: String
 *   emailAddress: String
 * }
 * ```
 */
export function registerUserDirectiveTransformer(schema: GraphQLSchema, directiveName = 'registerUser'): GraphQLSchema {
  return mapSchema(schema, {
    [MapperKind.OBJECT_FIELD]: (fieldConfig) => {
      const registerUserDirective = getDirective(schema, fieldConfig, directiveName)?.[0];
      
      if (registerUserDirective) {
        const { resolve = defaultFieldResolver } = fieldConfig;
        const { userIdField = 'id', nameField = 'name', emailField = 'email' } = registerUserDirective as RegisterUserDirectiveArgs;

        fieldConfig.resolve = async function (source, args, context, info) {
          try {
            if (!RBAC['config'] || !RBAC['initialized'] || !RBAC['dbAdapter']) {
              throw new GraphQLError('RBAC system not initialized', {
                extensions: { code: 'INTERNAL_SERVER_ERROR' }
              });
            }

            // Extract user data from arguments
            const input = args.input || args.data || args;
            const userData = {
              user_id: input[userIdField],
              name: input[nameField] || '',
              email: input[emailField] || '',
            };

            if (!userData.user_id) {
              throw new GraphQLError(`${userIdField} is required`, {
                extensions: { code: 'BAD_USER_INPUT' }
              });
            }

            // Check if user already exists
            const existingUser = await RBAC['dbAdapter'].findUserByUserId(userData.user_id);
            if (existingUser) {
              throw new GraphQLError('User already registered in RBAC system', {
                extensions: { code: 'BAD_USER_INPUT' }
              });
            }

            // Get default role if configured
            let defaultRoleId = undefined;
            if (RBAC['config'].defaultRole) {
              const role = await RBAC['dbAdapter'].findRoleByName(RBAC['config'].defaultRole);
              if (role) {
                defaultRoleId = role.id;
              }
            }

            // Create user in RBAC system
            await RBAC['dbAdapter'].createUser({
              user_id: userData.user_id,
              name: userData.name,
              email: userData.email,
              role_id: defaultRoleId,
            });

            // Call registration hook if configured
            if (RBAC['config'].onUserRegister) {
              await RBAC['config'].onUserRegister(userData);
            }

            // Attach user info to context for downstream use
            context.rbacUser = userData;

            // Continue with original resolver
            return resolve.call(this, source, args, context, info);
          } catch (error) {
            if (error instanceof GraphQLError) {
              throw error;
            }
            throw new GraphQLError('Internal server error during user registration', {
              extensions: { code: 'INTERNAL_SERVER_ERROR' }
            });
          }
        };
      }
      
      return fieldConfig;
    }
  });
}