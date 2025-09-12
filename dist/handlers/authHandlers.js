"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.corsHandler = exports.deleteAccountHandler = exports.signOutHandler = exports.refreshTokenHandler = exports.confirmPasswordResetHandler = exports.forgotPasswordHandler = exports.changePasswordHandler = exports.updateProfileHandler = exports.getProfileHandler = exports.loginHandler = exports.registerHandler = void 0;
const authService_1 = require("../services/authService");
const jwtService_1 = require("../services/jwtService");
const auth_1 = require("../types/auth");
const authService = new authService_1.AuthService();
const jwtService = new jwtService_1.JwtService();
const createResponse = (statusCode, body) => {
    return {
        statusCode,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,Authorization',
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
        },
        body: JSON.stringify(body)
    };
};
const parseBody = (event) => {
    try {
        return event.body ? JSON.parse(event.body) : {};
    }
    catch (error) {
        throw new Error('Invalid JSON in request body');
    }
};
const getUserIdFromToken = (event) => {
    const authHeader = event.headers.Authorization || event.headers.authorization;
    const token = jwtService.extractTokenFromHeader(authHeader);
    if (!token) {
        throw new Error('No authorization token provided');
    }
    const tokenPayload = jwtService.verifyToken(token);
    if (!tokenPayload) {
        throw new Error('Invalid or expired token');
    }
    return tokenPayload.userId;
};
const registerHandler = async (event) => {
    try {
        console.log('Register request:', event);
        const request = parseBody(event);
        if (!request.email || !request.password || !request.firstName || !request.lastName || !request.role) {
            return createResponse(400, {
                success: false,
                message: 'Missing required fields: email, password, firstName, lastName, role'
            });
        }
        if (!Object.values(auth_1.UserRole).includes(request.role)) {
            return createResponse(400, {
                success: false,
                message: 'Invalid role. Must be one of: student, teacher, school_admin, admin'
            });
        }
        const result = await authService.registerUser(request);
        return createResponse(result.success ? 201 : 400, result);
    }
    catch (error) {
        console.error('Error in registerHandler:', error);
        return createResponse(500, {
            success: false,
            message: 'Internal server error',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.registerHandler = registerHandler;
const loginHandler = async (event) => {
    try {
        console.log('Login request:', event);
        const request = parseBody(event);
        if (!request.email || !request.password) {
            return createResponse(400, {
                success: false,
                message: 'Missing required fields: email, password'
            });
        }
        const result = await authService.authenticateUser(request);
        return createResponse(result.success ? 200 : 401, result);
    }
    catch (error) {
        console.error('Error in loginHandler:', error);
        return createResponse(500, {
            success: false,
            message: 'Internal server error',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.loginHandler = loginHandler;
const getProfileHandler = async (event) => {
    try {
        console.log('Get profile request:', event);
        const userId = getUserIdFromToken(event);
        const result = await authService.getUserProfile(userId);
        return createResponse(result.success ? 200 : 404, result);
    }
    catch (error) {
        console.error('Error in getProfileHandler:', error);
        if (error instanceof Error && error.message.includes('token')) {
            return createResponse(401, {
                success: false,
                message: error.message
            });
        }
        return createResponse(500, {
            success: false,
            message: 'Internal server error',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.getProfileHandler = getProfileHandler;
const updateProfileHandler = async (event) => {
    try {
        console.log('Update profile request:', event);
        const userId = getUserIdFromToken(event);
        const updates = parseBody(event);
        const result = await authService.updateUserProfile(userId, updates);
        return createResponse(result.success ? 200 : 400, result);
    }
    catch (error) {
        console.error('Error in updateProfileHandler:', error);
        if (error instanceof Error && error.message.includes('token')) {
            return createResponse(401, {
                success: false,
                message: error.message
            });
        }
        return createResponse(500, {
            success: false,
            message: 'Internal server error',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.updateProfileHandler = updateProfileHandler;
const changePasswordHandler = async (event) => {
    try {
        console.log('Change password request:', event);
        const userId = getUserIdFromToken(event);
        const request = parseBody(event);
        if (!request.currentPassword || !request.newPassword) {
            return createResponse(400, {
                success: false,
                message: 'Missing required fields: currentPassword, newPassword'
            });
        }
        const result = await authService.changePassword(userId, request);
        return createResponse(result.success ? 200 : 400, result);
    }
    catch (error) {
        console.error('Error in changePasswordHandler:', error);
        if (error instanceof Error && error.message.includes('token')) {
            return createResponse(401, {
                success: false,
                message: error.message
            });
        }
        return createResponse(500, {
            success: false,
            message: 'Internal server error',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.changePasswordHandler = changePasswordHandler;
const forgotPasswordHandler = async (event) => {
    try {
        console.log('Forgot password request:', event);
        const request = parseBody(event);
        if (!request.email) {
            return createResponse(400, {
                success: false,
                message: 'Missing required field: email'
            });
        }
        const result = await authService.initiatePasswordReset(request);
        return createResponse(result.success ? 200 : 400, result);
    }
    catch (error) {
        console.error('Error in forgotPasswordHandler:', error);
        return createResponse(500, {
            success: false,
            message: 'Internal server error',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.forgotPasswordHandler = forgotPasswordHandler;
const confirmPasswordResetHandler = async (event) => {
    try {
        console.log('Confirm password reset request:', event);
        const request = parseBody(event);
        if (!request.email || !request.code || !request.newPassword) {
            return createResponse(400, {
                success: false,
                message: 'Missing required fields: email, code, newPassword'
            });
        }
        const result = await authService.confirmPasswordReset(request);
        return createResponse(result.success ? 200 : 400, result);
    }
    catch (error) {
        console.error('Error in confirmPasswordResetHandler:', error);
        return createResponse(500, {
            success: false,
            message: 'Internal server error',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.confirmPasswordResetHandler = confirmPasswordResetHandler;
const refreshTokenHandler = async (event) => {
    try {
        console.log('Refresh token request:', event);
        const request = parseBody(event);
        if (!request.refreshToken) {
            return createResponse(400, {
                success: false,
                message: 'Missing required field: refreshToken'
            });
        }
        const result = await authService.refreshToken(request.refreshToken);
        return createResponse(result.success ? 200 : 401, result);
    }
    catch (error) {
        console.error('Error in refreshTokenHandler:', error);
        return createResponse(500, {
            success: false,
            message: 'Internal server error',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.refreshTokenHandler = refreshTokenHandler;
const signOutHandler = async (event) => {
    try {
        console.log('Sign out request:', event);
        const authHeader = event.headers.Authorization || event.headers.authorization;
        const token = jwtService.extractTokenFromHeader(authHeader);
        if (!token) {
            return createResponse(400, {
                success: false,
                message: 'No authorization token provided'
            });
        }
        const result = await authService.signOutUser(token);
        return createResponse(result.success ? 200 : 400, result);
    }
    catch (error) {
        console.error('Error in signOutHandler:', error);
        return createResponse(500, {
            success: false,
            message: 'Internal server error',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.signOutHandler = signOutHandler;
const deleteAccountHandler = async (event) => {
    try {
        console.log('Delete account request:', event);
        const userId = getUserIdFromToken(event);
        const result = await authService.deleteUser(userId);
        return createResponse(result.success ? 200 : 400, result);
    }
    catch (error) {
        console.error('Error in deleteAccountHandler:', error);
        if (error instanceof Error && error.message.includes('token')) {
            return createResponse(401, {
                success: false,
                message: error.message
            });
        }
        return createResponse(500, {
            success: false,
            message: 'Internal server error',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.deleteAccountHandler = deleteAccountHandler;
const corsHandler = async (event) => {
    return createResponse(200, { message: 'CORS preflight' });
};
exports.corsHandler = corsHandler;
//# sourceMappingURL=authHandlers.js.map