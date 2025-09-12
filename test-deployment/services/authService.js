"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const uuid_1 = require("uuid");
const cognitoService_1 = require("./cognitoService");
const dynamoService_1 = require("./dynamoService");
const jwtService_1 = require("./jwtService");
class AuthService {
    constructor() {
        this.cognitoService = new cognitoService_1.CognitoService();
        this.dynamoService = new dynamoService_1.DynamoService();
        this.jwtService = new jwtService_1.JwtService();
    }
    async registerUser(request) {
        try {
            const existingUser = await this.dynamoService.getUserByEmail(request.email);
            if (existingUser) {
                return {
                    success: false,
                    message: 'User already exists',
                    error: 'USER_EXISTS'
                };
            }
            const cognitoUser = await this.cognitoService.registerUser(request);
            const user = {
                userId: (0, uuid_1.v4)(),
                email: request.email,
                firstName: request.firstName,
                lastName: request.lastName,
                role: request.role,
                schoolId: request.schoolId,
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                cognitoSub: cognitoUser.Username
            };
            const createdUser = await this.dynamoService.createUser(user);
            const tokens = this.jwtService.generateTokenPair(createdUser);
            return {
                success: true,
                message: 'User registered successfully',
                data: {
                    user: createdUser,
                    tokens: {
                        accessToken: tokens.accessToken,
                        refreshToken: tokens.refreshToken,
                        idToken: ''
                    }
                }
            };
        }
        catch (error) {
            console.error('Error in registerUser:', error);
            return {
                success: false,
                message: 'Registration failed',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    async authenticateUser(request) {
        try {
            const cognitoTokens = await this.cognitoService.authenticateUser(request);
            const user = await this.dynamoService.getUserByEmail(request.email);
            if (!user) {
                return {
                    success: false,
                    message: 'User not found',
                    error: 'USER_NOT_FOUND'
                };
            }
            if (!user.isActive) {
                return {
                    success: false,
                    message: 'Account is deactivated',
                    error: 'ACCOUNT_DEACTIVATED'
                };
            }
            await this.dynamoService.updateLastLogin(user.userId);
            const tokens = this.jwtService.generateTokenPair(user);
            return {
                success: true,
                message: 'Authentication successful',
                data: {
                    user,
                    tokens: {
                        accessToken: tokens.accessToken,
                        refreshToken: tokens.refreshToken,
                        idToken: cognitoTokens.IdToken
                    }
                }
            };
        }
        catch (error) {
            console.error('Error in authenticateUser:', error);
            return {
                success: false,
                message: 'Authentication failed',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    async getUserProfile(userId) {
        try {
            const user = await this.dynamoService.getUserById(userId);
            if (!user) {
                return {
                    success: false,
                    message: 'User not found',
                    error: 'USER_NOT_FOUND'
                };
            }
            return {
                success: true,
                message: 'User profile retrieved',
                data: {
                    user,
                    tokens: {
                        accessToken: '',
                        refreshToken: '',
                        idToken: ''
                    }
                }
            };
        }
        catch (error) {
            console.error('Error in getUserProfile:', error);
            return {
                success: false,
                message: 'Failed to get user profile',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    async updateUserProfile(userId, updates) {
        try {
            const user = await this.dynamoService.getUserById(userId);
            if (!user) {
                return {
                    success: false,
                    message: 'User not found',
                    error: 'USER_NOT_FOUND'
                };
            }
            const updatedUser = await this.dynamoService.updateUser(userId, updates);
            if (updates.firstName || updates.lastName) {
                const cognitoUpdates = {};
                if (updates.firstName)
                    cognitoUpdates.given_name = updates.firstName;
                if (updates.lastName)
                    cognitoUpdates.family_name = updates.lastName;
                await this.cognitoService.updateUserAttributes(user.email, cognitoUpdates);
            }
            return {
                success: true,
                message: 'Profile updated successfully',
                data: {
                    user: updatedUser,
                    tokens: {
                        accessToken: '',
                        refreshToken: '',
                        idToken: ''
                    }
                }
            };
        }
        catch (error) {
            console.error('Error in updateUserProfile:', error);
            return {
                success: false,
                message: 'Failed to update profile',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    async changePassword(userId, request) {
        try {
            const user = await this.dynamoService.getUserById(userId);
            if (!user) {
                return {
                    success: false,
                    message: 'User not found',
                    error: 'USER_NOT_FOUND'
                };
            }
            await this.cognitoService.changePassword(user.email, request);
            return {
                success: true,
                message: 'Password changed successfully'
            };
        }
        catch (error) {
            console.error('Error in changePassword:', error);
            return {
                success: false,
                message: 'Failed to change password',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    async initiatePasswordReset(request) {
        try {
            await this.cognitoService.initiatePasswordReset(request);
            return {
                success: true,
                message: 'Password reset email sent'
            };
        }
        catch (error) {
            console.error('Error in initiatePasswordReset:', error);
            return {
                success: false,
                message: 'Failed to initiate password reset',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    async confirmPasswordReset(request) {
        try {
            await this.cognitoService.confirmPasswordReset(request);
            return {
                success: true,
                message: 'Password reset successfully'
            };
        }
        catch (error) {
            console.error('Error in confirmPasswordReset:', error);
            return {
                success: false,
                message: 'Failed to confirm password reset',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    async signOutUser(accessToken) {
        try {
            await this.cognitoService.signOutUser(accessToken);
            return {
                success: true,
                message: 'User signed out successfully'
            };
        }
        catch (error) {
            console.error('Error in signOutUser:', error);
            return {
                success: false,
                message: 'Failed to sign out user',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    async deleteUser(userId) {
        try {
            const user = await this.dynamoService.getUserById(userId);
            if (!user) {
                return {
                    success: false,
                    message: 'User not found',
                    error: 'USER_NOT_FOUND'
                };
            }
            await this.cognitoService.deleteUser(user.email);
            await this.dynamoService.deleteUser(userId);
            return {
                success: true,
                message: 'User account deleted successfully'
            };
        }
        catch (error) {
            console.error('Error in deleteUser:', error);
            return {
                success: false,
                message: 'Failed to delete user account',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    async refreshToken(refreshToken) {
        try {
            const tokenData = this.jwtService.verifyRefreshToken(refreshToken);
            if (!tokenData) {
                return {
                    success: false,
                    message: 'Invalid refresh token',
                    error: 'INVALID_REFRESH_TOKEN'
                };
            }
            const user = await this.dynamoService.getUserById(tokenData.userId);
            if (!user || !user.isActive) {
                return {
                    success: false,
                    message: 'User not found or inactive',
                    error: 'USER_NOT_FOUND'
                };
            }
            const tokens = this.jwtService.generateTokenPair(user);
            return {
                success: true,
                message: 'Token refreshed successfully',
                data: {
                    user,
                    tokens: {
                        accessToken: tokens.accessToken,
                        refreshToken: tokens.refreshToken,
                        idToken: ''
                    }
                }
            };
        }
        catch (error) {
            console.error('Error in refreshToken:', error);
            return {
                success: false,
                message: 'Failed to refresh token',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    async verifyToken(token) {
        try {
            const tokenPayload = this.jwtService.verifyToken(token);
            if (!tokenPayload) {
                return null;
            }
            const user = await this.dynamoService.getUserById(tokenPayload.userId);
            if (!user || !user.isActive) {
                return null;
            }
            return { user, tokenPayload };
        }
        catch (error) {
            console.error('Error in verifyToken:', error);
            return null;
        }
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=authService.js.map