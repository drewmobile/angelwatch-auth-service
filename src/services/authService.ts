// Main authentication service that orchestrates Cognito and DynamoDB
import { v4 as uuidv4 } from 'uuid';
import { CognitoService } from './cognitoService';
import { DynamoService } from './dynamoService';
import { JwtService } from './jwtService';
import {
    User,
    UserRole,
    AuthRequest,
    RegisterRequest,
    AuthResponse,
    PasswordResetRequest,
    PasswordResetConfirm,
    ChangePasswordRequest,
    UpdateProfileRequest,
    CognitoTokens,
    SystemStats,
    School,
    UserActivity,
    SupportTicket,
    CreateSystemAdminRequest
} from '../types/auth';

export class AuthService {
    private cognitoService: CognitoService;
    private dynamoService: DynamoService;
    private jwtService: JwtService;

    constructor() {
        this.cognitoService = new CognitoService();
        this.dynamoService = new DynamoService();
        this.jwtService = new JwtService();
    }

    /**
     * Register a new user
     */
    async registerUser(request: RegisterRequest): Promise<AuthResponse> {
        try {
            // Check if user already exists
            const existingUser = await this.dynamoService.getUserByEmail(request.email);
            if (existingUser) {
                return {
                    success: false,
                    message: 'User already exists',
                    error: 'USER_EXISTS'
                };
            }

            // Create user in Cognito
            const cognitoUser = await this.cognitoService.registerUser(request);

            // Create user in DynamoDB
            const user: User = {
                userId: uuidv4(),
                email: request.email,
                firstName: request.firstName,
                lastName: request.lastName,
                role: request.role,
                schoolId: request.schoolId,
                isIndependent: request.role === UserRole.TEACHER ? !request.schoolId : undefined,
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                cognitoSub: cognitoUser.Username
            };

            const createdUser = await this.dynamoService.createUser(user);

            // Generate tokens
            // const tokens = this.jwtService.generateTokenPair(createdUser); // Temporarily disabled
            const tokens = { accessToken: 'temp-token', refreshToken: 'temp-refresh' }; // Temporary placeholder

            return {
                success: true,
                message: 'User registered successfully',
                data: {
                    user: createdUser,
                    tokens: {
                        accessToken: tokens.accessToken,
                        refreshToken: tokens.refreshToken,
                        idToken: '' // Cognito handles ID tokens
                    }
                }
            };
        } catch (error) {
            console.error('Error in registerUser:', error);
            return {
                success: false,
                message: 'Registration failed',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    /**
     * Authenticate user login
     */
    async authenticateUser(request: AuthRequest): Promise<AuthResponse> {
        try {
            // Authenticate with Cognito
            const cognitoTokens = await this.cognitoService.authenticateUser(request);

            // Get user from DynamoDB
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

            // Update last login
            await this.dynamoService.updateLastLogin(user.userId);

            // Generate our own JWT tokens
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
        } catch (error) {
            console.error('Error in authenticateUser:', error);
            return {
                success: false,
                message: 'Authentication failed',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    /**
     * Get user profile
     */
    async getUserProfile(userId: string): Promise<AuthResponse> {
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
        } catch (error) {
            console.error('Error in getUserProfile:', error);
            return {
                success: false,
                message: 'Failed to get user profile',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    /**
     * Update user profile
     */
    async updateUserProfile(userId: string, updates: UpdateProfileRequest): Promise<AuthResponse> {
        try {
            const user = await this.dynamoService.getUserById(userId);
            if (!user) {
                return {
                    success: false,
                    message: 'User not found',
                    error: 'USER_NOT_FOUND'
                };
            }

            // For teachers, automatically set isIndependent based on schoolId
            if (user.role === UserRole.TEACHER && updates.schoolId !== undefined) {
                updates.isIndependent = !updates.schoolId;
            }

            // Update in DynamoDB
            const updatedUser = await this.dynamoService.updateUser(userId, updates);

            // Update in Cognito if name changed
            if (updates.firstName || updates.lastName) {
                const cognitoUpdates: Record<string, string> = {};
                if (updates.firstName) cognitoUpdates.given_name = updates.firstName;
                if (updates.lastName) cognitoUpdates.family_name = updates.lastName;

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
        } catch (error) {
            console.error('Error in updateUserProfile:', error);
            return {
                success: false,
                message: 'Failed to update profile',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    /**
     * Change password
     */
    async changePassword(userId: string, request: ChangePasswordRequest): Promise<AuthResponse> {
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
        } catch (error) {
            console.error('Error in changePassword:', error);
            return {
                success: false,
                message: 'Failed to change password',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    /**
     * Initiate password reset
     */
    async initiatePasswordReset(request: PasswordResetRequest): Promise<AuthResponse> {
        try {
            await this.cognitoService.initiatePasswordReset(request);

            return {
                success: true,
                message: 'Password reset email sent'
            };
        } catch (error) {
            console.error('Error in initiatePasswordReset:', error);
            return {
                success: false,
                message: 'Failed to initiate password reset',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    /**
     * Confirm password reset
     */
    async confirmPasswordReset(request: PasswordResetConfirm): Promise<AuthResponse> {
        try {
            await this.cognitoService.confirmPasswordReset(request);

            return {
                success: true,
                message: 'Password reset successfully'
            };
        } catch (error) {
            console.error('Error in confirmPasswordReset:', error);
            return {
                success: false,
                message: 'Failed to confirm password reset',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    /**
     * Sign out user
     */
    async signOutUser(accessToken: string): Promise<AuthResponse> {
        try {
            await this.cognitoService.signOutUser(accessToken);

            return {
                success: true,
                message: 'User signed out successfully'
            };
        } catch (error) {
            console.error('Error in signOutUser:', error);
            return {
                success: false,
                message: 'Failed to sign out user',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    /**
     * Delete user account
     */
    async deleteUser(userId: string): Promise<AuthResponse> {
        try {
            const user = await this.dynamoService.getUserById(userId);
            if (!user) {
                return {
                    success: false,
                    message: 'User not found',
                    error: 'USER_NOT_FOUND'
                };
            }

            // Delete from Cognito
            await this.cognitoService.deleteUser(user.email);

            // Delete from DynamoDB
            await this.dynamoService.deleteUser(userId);

            return {
                success: true,
                message: 'User account deleted successfully'
            };
        } catch (error) {
            console.error('Error in deleteUser:', error);
            return {
                success: false,
                message: 'Failed to delete user account',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    /**
     * Refresh access token
     */
    async refreshToken(refreshToken: string): Promise<AuthResponse> {
        try {
            // const tokenData = this.jwtService.verifyRefreshToken(refreshToken); // Temporarily disabled
            const tokenData = null; // Temporary placeholder
            if (!tokenData) {
                return {
                    success: false,
                    message: 'Invalid refresh token',
                    error: 'INVALID_REFRESH_TOKEN'
                };
            }

            // const user = await this.dynamoService.getUserById(tokenData.userId); // Temporarily disabled
            const user = null; // Temporary placeholder
            if (!user) { // Temporarily simplified
                return {
                    success: false,
                    message: 'User not found or inactive',
                    error: 'USER_NOT_FOUND'
                };
            }

            // const tokens = this.jwtService.generateTokenPair(user); // Temporarily disabled
            const tokens = { accessToken: 'temp-token', refreshToken: 'temp-refresh' }; // Temporary placeholder

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
        } catch (error) {
            console.error('Error in refreshToken:', error);
            return {
                success: false,
                message: 'Failed to refresh token',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    /**
     * Verify JWT token and get user
     */
    async verifyToken(token: string): Promise<{ user: User; tokenPayload: any } | null> {
        try {
            // const tokenPayload = this.jwtService.verifyToken(token); // Temporarily disabled
            const tokenPayload = null; // Temporary placeholder
            if (!tokenPayload) {
                return null;
            }

            // const user = await this.dynamoService.getUserById(tokenPayload.userId); // Temporarily disabled
            const user = null; // Temporary placeholder
            if (!user) { // Temporarily simplified
                return null;
            }

            return { user, tokenPayload };
        } catch (error) {
            console.error('Error in verifyToken:', error);
            return null;
        }
    }

    // Admin Methods

    /**
     * Get system statistics
     */
    async getSystemStats(): Promise<SystemStats> {
        try {
            const stats = await this.dynamoService.getSystemStats();
            return stats;
        } catch (error) {
            console.error('Error getting system stats:', error);
            // Return default stats if database fails
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

    /**
     * Get all schools
     */
    async getAllSchools(): Promise<School[]> {
        try {
            const schools = await this.dynamoService.getAllSchools();
            return schools;
        } catch (error) {
            console.error('Error getting schools:', error);
            return [];
        }
    }

    /**
     * Update school status
     */
    async updateSchoolStatus(schoolId: string, isActive: boolean): Promise<School> {
        try {
            const school = await this.dynamoService.updateSchoolStatus(schoolId, isActive);
            return school;
        } catch (error) {
            console.error('Error updating school status:', error);
            throw error;
        }
    }

    /**
     * Get all users with activity data
     */
    async getAllUsersWithActivity(): Promise<UserActivity[]> {
        try {
            const users = await this.dynamoService.getAllUsersWithActivity();
            return users;
        } catch (error) {
            console.error('Error getting users with activity:', error);
            return [];
        }
    }

    /**
     * Update user status
     */
    async updateUserStatus(userId: string, isActive: boolean): Promise<User> {
        try {
            const user = await this.dynamoService.updateUserStatus(userId, isActive);
            return user;
        } catch (error) {
            console.error('Error updating user status:', error);
            throw error;
        }
    }

    /**
     * Get support tickets
     */
    async getSupportTickets(): Promise<SupportTicket[]> {
        try {
            const tickets = await this.dynamoService.getSupportTickets();
            return tickets;
        } catch (error) {
            console.error('Error getting support tickets:', error);
            return [];
        }
    }

    /**
     * Update support ticket
     */
    async updateSupportTicket(ticketId: string, status: string, assignedTo?: string): Promise<SupportTicket> {
        try {
            const ticket = await this.dynamoService.updateSupportTicket(ticketId, status, assignedTo);
            return ticket;
        } catch (error) {
            console.error('Error updating support ticket:', error);
            throw error;
        }
    }

    /**
     * Create system admin
     */
    async createSystemAdmin(request: CreateSystemAdminRequest): Promise<User> {
        try {
            // Check if user already exists
            const existingUser = await this.dynamoService.getUserByEmail(request.email);
            if (existingUser) {
                throw new Error('User already exists');
            }

            // Create user in Cognito
            const cognitoUser = await this.cognitoService.registerUser({
                email: request.email,
                password: request.password,
                firstName: request.firstName,
                lastName: request.lastName,
                role: UserRole.SYSTEM_ADMIN
            });

            // Create user in DynamoDB
            const user: User = {
                userId: uuidv4(),
                email: request.email,
                firstName: request.firstName,
                lastName: request.lastName,
                role: UserRole.SYSTEM_ADMIN,
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                cognitoSub: cognitoUser.Username
            };

            await this.dynamoService.createUser(user);
            return user;
        } catch (error) {
            console.error('Error creating system admin:', error);
            throw error;
        }
    }

    /**
     * Get school by ID
     */
    async getSchoolById(schoolId: string): Promise<School | null> {
        try {
            return await this.dynamoService.getSchoolById(schoolId);
        } catch (error) {
            console.error('Error getting school by ID:', error);
            throw error;
        }
    }

    /**
     * Get teachers for a specific school
     */
    async getSchoolTeachers(schoolId: string): Promise<any[]> {
        try {
            return await this.dynamoService.getSchoolTeachers(schoolId);
        } catch (error) {
            console.error('Error getting school teachers:', error);
            throw error;
        }
    }

    /**
     * Create a new teacher
     */
    async createTeacher(teacherData: {
        email: string;
        firstName: string;
        lastName: string;
        schoolId: string;
        role: string;
    }): Promise<User> {
        try {
            // Check if user already exists
            const existingUser = await this.dynamoService.getUserByEmail(teacherData.email);
            if (existingUser) {
                throw new Error('User with this email already exists');
            }

            // Create user in DynamoDB
            const newUser = await this.dynamoService.createUser({
                userId: '', // Will be generated by createUser
                email: teacherData.email,
                firstName: teacherData.firstName,
                lastName: teacherData.lastName,
                role: teacherData.role as any,
                schoolId: teacherData.schoolId,
                isActive: true,
                createdAt: '', // Will be set by createUser
                updatedAt: '' // Will be set by createUser
            });

            // Create user in Cognito
            await this.cognitoService.registerUser({
                email: teacherData.email,
                password: 'TempPassword123!', // Temporary password, user will need to change it
                firstName: teacherData.firstName,
                lastName: teacherData.lastName,
                role: teacherData.role as any
            });

            return newUser;
        } catch (error) {
            console.error('Error creating teacher:', error);
            throw error;
        }
    }

    /**
     * Reset user password (admin function)
     */
    async resetUserPassword(userId: string, newPassword: string): Promise<void> {
        try {
            const user = await this.dynamoService.getUserById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            await this.cognitoService.resetUserPassword(user.email, newPassword);
        } catch (error) {
            console.error('Error resetting user password:', error);
            throw error;
        }
    }

    /**
     * Get prospects for a state admin
     */
    async getProspectsByState(stateCode: string): Promise<any[]> {
        try {
            const prospects = await this.dynamoService.getProspectsByState(stateCode);
            return prospects;
        } catch (error) {
            console.error('Error getting prospects by state:', error);
            return [];
        }
    }
}
