import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { registerHandler, loginHandler, getProfileHandler, updateProfileHandler, changePasswordHandler, forgotPasswordHandler, confirmPasswordResetHandler, refreshTokenHandler, signOutHandler, deleteAccountHandler, corsHandler } from './handlers/authHandlers';
export declare const handler: (event: APIGatewayProxyEvent, context: Context) => Promise<APIGatewayProxyResult>;
export { registerHandler, loginHandler, getProfileHandler, updateProfileHandler, changePasswordHandler, forgotPasswordHandler, confirmPasswordResetHandler, refreshTokenHandler, signOutHandler, deleteAccountHandler, corsHandler };
//# sourceMappingURL=index.d.ts.map