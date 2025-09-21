"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const uuid_1 = require("uuid");
const cognitoService_1 = require("./cognitoService");
const dynamoService_1 = require("./dynamoService");
const jwtService_1 = require("./jwtService");
const auth_1 = require("../types/auth");
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
                isIndependent: request.role === auth_1.UserRole.TEACHER ? !request.schoolId : undefined,
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                cognitoSub: cognitoUser.Username
            };
            const createdUser = await this.dynamoService.createUser(user);
            const tokens = { accessToken: 'temp-token', refreshToken: 'temp-refresh' };
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
            const accessToken = this.jwtService.generateToken(user);
            const refreshToken = this.jwtService.generateRefreshToken(user);
            const tokens = { accessToken, refreshToken };
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
            if (user.role === auth_1.UserRole.TEACHER && updates.schoolId !== undefined) {
                updates.isIndependent = !updates.schoolId;
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
            const tokenData = null;
            if (!tokenData) {
                return {
                    success: false,
                    message: 'Invalid refresh token',
                    error: 'INVALID_REFRESH_TOKEN'
                };
            }
            const user = null;
            if (!user) {
                return {
                    success: false,
                    message: 'User not found or inactive',
                    error: 'USER_NOT_FOUND'
                };
            }
            const tokens = { accessToken: 'temp-token', refreshToken: 'temp-refresh' };
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
            const tokenPayload = null;
            if (!tokenPayload) {
                return null;
            }
            const user = null;
            if (!user) {
                return null;
            }
            return { user, tokenPayload };
        }
        catch (error) {
            console.error('Error in verifyToken:', error);
            return null;
        }
    }
    async getSystemStats() {
        try {
            const stats = await this.dynamoService.getSystemStats();
            return stats;
        }
        catch (error) {
            console.error('Error getting system stats:', error);
            return {
                totalSchools: 0,
                totalUsers: 0,
                activeUsers: 0,
                totalCourses: 0,
                completedCourses: 0,
                totalWatchTime: 0,
                supportTickets: 0,
                systemUptime: 99.9
            };
        }
    }
    async getAllSchools() {
        try {
            const schools = await this.dynamoService.getAllSchools();
            return schools;
        }
        catch (error) {
            console.error('Error getting schools:', error);
            return [];
        }
    }
    async updateSchoolStatus(schoolId, isActive) {
        try {
            const school = await this.dynamoService.updateSchoolStatus(schoolId, isActive);
            return school;
        }
        catch (error) {
            console.error('Error updating school status:', error);
            throw error;
        }
    }
    async getAllUsersWithActivity() {
        try {
            const users = await this.dynamoService.getAllUsersWithActivity();
            return users;
        }
        catch (error) {
            console.error('Error getting users with activity:', error);
            return [];
        }
    }
    async updateUserStatus(userId, isActive) {
        try {
            const user = await this.dynamoService.updateUserStatus(userId, isActive);
            return user;
        }
        catch (error) {
            console.error('Error updating user status:', error);
            throw error;
        }
    }
    async getSupportTickets() {
        try {
            const tickets = await this.dynamoService.getSupportTickets();
            return tickets;
        }
        catch (error) {
            console.error('Error getting support tickets:', error);
            return [];
        }
    }
    async updateSupportTicket(ticketId, status, assignedTo) {
        try {
            const ticket = await this.dynamoService.updateSupportTicket(ticketId, status, assignedTo);
            return ticket;
        }
        catch (error) {
            console.error('Error updating support ticket:', error);
            throw error;
        }
    }
    async createSystemAdmin(request) {
        try {
            const existingUser = await this.dynamoService.getUserByEmail(request.email);
            if (existingUser) {
                throw new Error('User already exists');
            }
            const cognitoUser = await this.cognitoService.registerUser({
                email: request.email,
                password: request.password,
                firstName: request.firstName,
                lastName: request.lastName,
                role: auth_1.UserRole.SYSTEM_ADMIN
            });
            const user = {
                userId: (0, uuid_1.v4)(),
                email: request.email,
                firstName: request.firstName,
                lastName: request.lastName,
                role: auth_1.UserRole.SYSTEM_ADMIN,
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                cognitoSub: cognitoUser.Username
            };
            await this.dynamoService.createUser(user);
            return user;
        }
        catch (error) {
            console.error('Error creating system admin:', error);
            throw error;
        }
    }
    async getSchoolById(schoolId) {
        try {
            return await this.dynamoService.getSchoolById(schoolId);
        }
        catch (error) {
            console.error('Error getting school by ID:', error);
            throw error;
        }
    }
    async getSchoolTeachers(schoolId) {
        try {
            return await this.dynamoService.getSchoolTeachers(schoolId);
        }
        catch (error) {
            console.error('Error getting school teachers:', error);
            throw error;
        }
    }
    async createTeacher(teacherData) {
        try {
            const existingUser = await this.dynamoService.getUserByEmail(teacherData.email);
            if (existingUser) {
                throw new Error('User with this email already exists');
            }
            const newUser = await this.dynamoService.createUser({
                userId: '',
                email: teacherData.email,
                firstName: teacherData.firstName,
                lastName: teacherData.lastName,
                role: teacherData.role,
                schoolId: teacherData.schoolId,
                isActive: true,
                createdAt: '',
                updatedAt: ''
            });
            await this.cognitoService.registerUser({
                email: teacherData.email,
                password: 'TempPassword123!',
                firstName: teacherData.firstName,
                lastName: teacherData.lastName,
                role: teacherData.role
            });
            return newUser;
        }
        catch (error) {
            console.error('Error creating teacher:', error);
            throw error;
        }
    }
    async resetUserPassword(userId, newPassword) {
        try {
            const user = await this.dynamoService.getUserById(userId);
            if (!user) {
                throw new Error('User not found');
            }
            await this.cognitoService.resetUserPassword(user.email, newPassword);
        }
        catch (error) {
            console.error('Error resetting user password:', error);
            throw error;
        }
    }
    async getProspectsByState(stateCode) {
        try {
            const prospects = await this.dynamoService.getProspectsByState(stateCode);
            return prospects;
        }
        catch (error) {
            console.error('Error getting prospects by state:', error);
            return [];
        }
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=authService.js.map