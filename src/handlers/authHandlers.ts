// Lambda handlers for authentication endpoints
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { AuthService } from '../services/authService';
import { JwtService } from '../services/jwtService';
import {
    AuthRequest,
    RegisterRequest,
    PasswordResetRequest,
    PasswordResetConfirm,
    ChangePasswordRequest,
    UpdateProfileRequest,
    UserRole
} from '../types/auth';

const authService = new AuthService();
const jwtService = new JwtService();

// Helper function to create API Gateway response
const createResponse = (statusCode: number, body: any): APIGatewayProxyResult => {
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

// Helper function to parse request body
const parseBody = (event: APIGatewayProxyEvent): any => {
    try {
        return event.body ? JSON.parse(event.body) : {};
    } catch (error) {
        throw new Error('Invalid JSON in request body');
    }
};

// Helper function to get user ID from token
const getUserIdFromToken = (event: APIGatewayProxyEvent): string => {
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

/**
 * User registration handler
 */
export const registerHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        console.log('Register request:', event);

        const request: RegisterRequest = parseBody(event);

        // Validate required fields
        if (!request.email || !request.password || !request.firstName || !request.lastName || !request.role) {
            return createResponse(400, {
                success: false,
                message: 'Missing required fields: email, password, firstName, lastName, role'
            });
        }

        // Validate role
        if (!Object.values(UserRole).includes(request.role)) {
            return createResponse(400, {
                success: false,
                message: 'Invalid role. Must be one of: student, teacher, school_admin, admin'
            });
        }

        const result = await authService.registerUser(request);

        return createResponse(result.success ? 201 : 400, result);
    } catch (error) {
        console.error('Error in registerHandler:', error);
        return createResponse(500, {
            success: false,
            message: 'Internal server error',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

/**
 * User login handler
 */
export const loginHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        console.log('Login request:', event);

        const request: AuthRequest = parseBody(event);

        // Validate required fields
        if (!request.email || !request.password) {
            return createResponse(400, {
                success: false,
                message: 'Missing required fields: email, password'
            });
        }

        const result = await authService.authenticateUser(request);

        return createResponse(result.success ? 200 : 401, result);
    } catch (error) {
        console.error('Error in loginHandler:', error);
        return createResponse(500, {
            success: false,
            message: 'Internal server error',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

/**
 * Get user profile handler
 */
export const getProfileHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        console.log('Get profile request:', event);

        const userId = getUserIdFromToken(event);
        const result = await authService.getUserProfile(userId);

        return createResponse(result.success ? 200 : 404, result);
    } catch (error) {
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

/**
 * Update user profile handler
 */
export const updateProfileHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        console.log('Update profile request:', event);

        const userId = getUserIdFromToken(event);
        const updates: UpdateProfileRequest = parseBody(event);

        const result = await authService.updateUserProfile(userId, updates);

        return createResponse(result.success ? 200 : 400, result);
    } catch (error) {
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

/**
 * Change password handler
 */
export const changePasswordHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        console.log('Change password request:', event);

        const userId = getUserIdFromToken(event);
        const request: ChangePasswordRequest = parseBody(event);

        // Validate required fields
        if (!request.currentPassword || !request.newPassword) {
            return createResponse(400, {
                success: false,
                message: 'Missing required fields: currentPassword, newPassword'
            });
        }

        const result = await authService.changePassword(userId, request);

        return createResponse(result.success ? 200 : 400, result);
    } catch (error) {
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

/**
 * Initiate password reset handler
 */
export const forgotPasswordHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        console.log('Forgot password request:', event);

        const request: PasswordResetRequest = parseBody(event);

        // Validate required fields
        if (!request.email) {
            return createResponse(400, {
                success: false,
                message: 'Missing required field: email'
            });
        }

        const result = await authService.initiatePasswordReset(request);

        return createResponse(result.success ? 200 : 400, result);
    } catch (error) {
        console.error('Error in forgotPasswordHandler:', error);
        return createResponse(500, {
            success: false,
            message: 'Internal server error',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

/**
 * Confirm password reset handler
 */
export const confirmPasswordResetHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        console.log('Confirm password reset request:', event);

        const request: PasswordResetConfirm = parseBody(event);

        // Validate required fields
        if (!request.email || !request.code || !request.newPassword) {
            return createResponse(400, {
                success: false,
                message: 'Missing required fields: email, code, newPassword'
            });
        }

        const result = await authService.confirmPasswordReset(request);

        return createResponse(result.success ? 200 : 400, result);
    } catch (error) {
        console.error('Error in confirmPasswordResetHandler:', error);
        return createResponse(500, {
            success: false,
            message: 'Internal server error',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

/**
 * Refresh token handler
 */
export const refreshTokenHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        console.log('Refresh token request:', event);

        const request = parseBody(event);

        // Validate required fields
        if (!request.refreshToken) {
            return createResponse(400, {
                success: false,
                message: 'Missing required field: refreshToken'
            });
        }

        const result = await authService.refreshToken(request.refreshToken);

        return createResponse(result.success ? 200 : 401, result);
    } catch (error) {
        console.error('Error in refreshTokenHandler:', error);
        return createResponse(500, {
            success: false,
            message: 'Internal server error',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

/**
 * Sign out handler
 */
export const signOutHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
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
    } catch (error) {
        console.error('Error in signOutHandler:', error);
        return createResponse(500, {
            success: false,
            message: 'Internal server error',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

/**
 * Delete user account handler
 */
export const deleteAccountHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        console.log('Delete account request:', event);

        const userId = getUserIdFromToken(event);
        const result = await authService.deleteUser(userId);

        return createResponse(result.success ? 200 : 400, result);
    } catch (error) {
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

/**
 * CORS handler for preflight requests
 */
export const corsHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    return createResponse(200, { message: 'CORS preflight' });
};
