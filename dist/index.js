"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.corsHandler = exports.deleteAccountHandler = exports.signOutHandler = exports.refreshTokenHandler = exports.confirmPasswordResetHandler = exports.forgotPasswordHandler = exports.changePasswordHandler = exports.updateProfileHandler = exports.getProfileHandler = exports.loginHandler = exports.registerHandler = exports.handler = void 0;
const authHandlers_1 = require("./handlers/authHandlers");
Object.defineProperty(exports, "registerHandler", { enumerable: true, get: function () { return authHandlers_1.registerHandler; } });
Object.defineProperty(exports, "loginHandler", { enumerable: true, get: function () { return authHandlers_1.loginHandler; } });
Object.defineProperty(exports, "getProfileHandler", { enumerable: true, get: function () { return authHandlers_1.getProfileHandler; } });
Object.defineProperty(exports, "updateProfileHandler", { enumerable: true, get: function () { return authHandlers_1.updateProfileHandler; } });
Object.defineProperty(exports, "changePasswordHandler", { enumerable: true, get: function () { return authHandlers_1.changePasswordHandler; } });
Object.defineProperty(exports, "forgotPasswordHandler", { enumerable: true, get: function () { return authHandlers_1.forgotPasswordHandler; } });
Object.defineProperty(exports, "confirmPasswordResetHandler", { enumerable: true, get: function () { return authHandlers_1.confirmPasswordResetHandler; } });
Object.defineProperty(exports, "refreshTokenHandler", { enumerable: true, get: function () { return authHandlers_1.refreshTokenHandler; } });
Object.defineProperty(exports, "signOutHandler", { enumerable: true, get: function () { return authHandlers_1.signOutHandler; } });
Object.defineProperty(exports, "deleteAccountHandler", { enumerable: true, get: function () { return authHandlers_1.deleteAccountHandler; } });
Object.defineProperty(exports, "corsHandler", { enumerable: true, get: function () { return authHandlers_1.corsHandler; } });
const healthHandler = async (event) => {
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
const routes = {
    'GET /auth/health': healthHandler,
    'POST /auth/register': authHandlers_1.registerHandler,
    'POST /auth/login': authHandlers_1.loginHandler,
    'GET /auth/profile': authHandlers_1.getProfileHandler,
    'PUT /auth/profile': authHandlers_1.updateProfileHandler,
    'POST /auth/change-password': authHandlers_1.changePasswordHandler,
    'POST /auth/forgot-password': authHandlers_1.forgotPasswordHandler,
    'POST /auth/confirm-password-reset': authHandlers_1.confirmPasswordResetHandler,
    'POST /auth/refresh-token': authHandlers_1.refreshTokenHandler,
    'POST /auth/signout': authHandlers_1.signOutHandler,
    'DELETE /auth/account': authHandlers_1.deleteAccountHandler,
    'OPTIONS /auth/*': authHandlers_1.corsHandler
};
const handler = async (event, context) => {
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
        if (event.httpMethod === 'OPTIONS') {
            return (0, authHandlers_1.corsHandler)(event);
        }
        let routeKey = `${event.httpMethod} ${event.path}`;
        if (event.path === '/auth' && event.requestContext && event.requestContext.path) {
            const fullPath = event.requestContext.path;
            routeKey = `${event.httpMethod} ${fullPath}`;
        }
        let handler = routes[routeKey];
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
        const result = await handler(event);
        console.log('Handler result:', {
            statusCode: result.statusCode,
            body: result.body
        });
        return result;
    }
    catch (error) {
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
exports.handler = handler;
//# sourceMappingURL=index.js.map