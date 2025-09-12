// Main Lambda entry point for AngelWatch Auth Service
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import {
    registerHandler,
    loginHandler,
    getProfileHandler,
    updateProfileHandler,
    changePasswordHandler,
    forgotPasswordHandler,
    confirmPasswordResetHandler,
    refreshTokenHandler,
    signOutHandler,
    deleteAccountHandler,
    corsHandler
} from './handlers/authHandlers';

// Health check handler
const healthHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,Authorization',
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
        },
        body: JSON.stringify({
            success: true,
            message: 'Auth Service is healthy',
            timestamp: new Date().toISOString(),
            service: 'angelwatch-auth-service',
            version: '1.0.0'
        })
    };
};

// Route mapping
const routes: Record<string, (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>> = {
    'GET /auth/health': healthHandler,
    'POST /auth/register': registerHandler,
    'POST /auth/login': loginHandler,
    'GET /auth/profile': getProfileHandler,
    'PUT /auth/profile': updateProfileHandler,
    'POST /auth/change-password': changePasswordHandler,
    'POST /auth/forgot-password': forgotPasswordHandler,
    'POST /auth/confirm-password-reset': confirmPasswordResetHandler,
    'POST /auth/refresh-token': refreshTokenHandler,
    'POST /auth/signout': signOutHandler,
    'DELETE /auth/account': deleteAccountHandler,
    'OPTIONS /auth/*': corsHandler
};

// Main Lambda handler
export const handler = async (
    event: APIGatewayProxyEvent,
    context: Context
): Promise<APIGatewayProxyResult> => {
    console.log('Lambda invocation:', {
        requestId: context.awsRequestId,
        method: event.httpMethod,
        path: event.path,
        resource: event.resource,
        requestContext: event.requestContext,
        headers: event.headers,
        body: event.body
    });

    try {
        // Handle CORS preflight requests
        if (event.httpMethod === 'OPTIONS') {
            return corsHandler(event);
        }

        // For proxy integration, we need to handle the full path
        // The path might be /auth but we need to handle /auth/health, /auth/login, etc.
        let routeKey = `${event.httpMethod} ${event.path}`;

        // If the path is just /auth, try to determine the actual endpoint from the request
        if (event.path === '/auth' && event.requestContext && event.requestContext.path) {
            const fullPath = event.requestContext.path;
            routeKey = `${event.httpMethod} ${fullPath}`;
        }

        // Find matching route
        let handler = routes[routeKey];

        // Try to match wildcard routes
        if (!handler) {
            const wildcardKey = `${event.httpMethod} ${event.path.split('/').slice(0, 2).join('/')}/*`;
            handler = routes[wildcardKey];
        }

        if (!handler) {
            console.log('No handler found for route:', routeKey);
            return {
                statusCode: 404,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
                },
                body: JSON.stringify({
                    success: false,
                    message: 'Endpoint not found',
                    error: 'NOT_FOUND'
                })
            };
        }

        // Execute handler
        const result = await handler(event);

        console.log('Handler result:', {
            statusCode: result.statusCode,
            body: result.body
        });

        return result;
    } catch (error) {
        console.error('Unhandled error in Lambda:', error);

        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
            },
            body: JSON.stringify({
                success: false,
                message: 'Internal server error',
                error: error instanceof Error ? error.message : 'Unknown error'
            })
        };
    }
};

// Export individual handlers for testing
export {
    registerHandler,
    loginHandler,
    getProfileHandler,
    updateProfileHandler,
    changePasswordHandler,
    forgotPasswordHandler,
    confirmPasswordResetHandler,
    refreshTokenHandler,
    signOutHandler,
    deleteAccountHandler,
    corsHandler
};
