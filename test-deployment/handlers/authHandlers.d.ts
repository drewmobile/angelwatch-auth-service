import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
export declare const registerHandler: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;
export declare const loginHandler: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;
export declare const getProfileHandler: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;
export declare const updateProfileHandler: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;
export declare const changePasswordHandler: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;
export declare const forgotPasswordHandler: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;
export declare const confirmPasswordResetHandler: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;
export declare const refreshTokenHandler: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;
export declare const signOutHandler: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;
export declare const deleteAccountHandler: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;
export declare const corsHandler: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;
//# sourceMappingURL=authHandlers.d.ts.map