// Cognito service for user authentication
import {
    CognitoIdentityProviderClient,
    AdminCreateUserCommand,
    AdminDeleteUserCommand,
    AdminGetUserCommand,
    AdminUpdateUserAttributesCommand,
    AdminSetUserPasswordCommand,
    InitiateAuthCommand,
    RespondToAuthChallengeCommand,
    ForgotPasswordCommand,
    ConfirmForgotPasswordCommand,
    ChangePasswordCommand,
    GlobalSignOutCommand,
    ListUsersCommand,
    UserType
} from '@aws-sdk/client-cognito-identity-provider';
import { config } from '../config/environment';
import {
    AuthRequest,
    RegisterRequest,
    CognitoTokens,
    CognitoUser,
    PasswordResetRequest,
    PasswordResetConfirm,
    ChangePasswordRequest,
    UserRole
} from '../types/auth';

export class CognitoService {
    private client: CognitoIdentityProviderClient;
    private userPoolId: string;
    private clientId: string;

    constructor() {
        // In Lambda, use IAM role - don't specify credentials
        this.client = new CognitoIdentityProviderClient({
            region: config.awsRegion
        });
        this.userPoolId = config.cognitoUserPoolId;
        this.clientId = config.cognitoClientId;
    }

    /**
     * Register a new user in Cognito
     */
    async registerUser(request: RegisterRequest): Promise<CognitoUser> {
        try {
            const command = new AdminCreateUserCommand({
                UserPoolId: this.userPoolId,
                Username: request.email,
                UserAttributes: [
                    { Name: 'email', Value: request.email },
                    { Name: 'email_verified', Value: 'true' },
                    { Name: 'given_name', Value: request.firstName },
                    { Name: 'family_name', Value: request.lastName },
                    { Name: 'custom:role', Value: request.role },
                    ...(request.schoolId ? [{ Name: 'custom:school_id', Value: request.schoolId }] : [])
                ],
                TemporaryPassword: this.generateTemporaryPassword(),
                MessageAction: 'SUPPRESS' // Don't send welcome email
            });

            const response = await this.client.send(command);

            if (!response.User) {
                throw new Error('Failed to create user in Cognito');
            }

            // Set permanent password
            await this.setUserPassword(request.email, request.password);

            return this.mapCognitoUser(response.User);
        } catch (error) {
            console.error('Error registering user:', error);
            throw new Error(`Failed to register user: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Authenticate user with email and password
     */
    async authenticateUser(request: AuthRequest): Promise<CognitoTokens> {
        try {
            const command = new InitiateAuthCommand({
                AuthFlow: 'USER_PASSWORD_AUTH',
                ClientId: this.clientId,
                AuthParameters: {
                    USERNAME: request.email,
                    PASSWORD: request.password
                }
            });

            const response = await this.client.send(command);

            if (!response.AuthenticationResult) {
                throw new Error('Authentication failed');
            }

            return {
                AccessToken: response.AuthenticationResult.AccessToken!,
                RefreshToken: response.AuthenticationResult.RefreshToken!,
                IdToken: response.AuthenticationResult.IdToken!
            };
        } catch (error) {
            console.error('Error authenticating user:', error);
            throw new Error(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Get user information from Cognito
     */
    async getUser(email: string): Promise<CognitoUser> {
        try {
            const command = new AdminGetUserCommand({
                UserPoolId: this.userPoolId,
                Username: email
            });

            const response = await this.client.send(command);
            return this.mapCognitoUser(response);
        } catch (error) {
            console.error('Error getting user:', error);
            throw new Error(`Failed to get user: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Update user attributes
     */
    async updateUserAttributes(email: string, attributes: Record<string, string>): Promise<void> {
        try {
            const userAttributes = Object.entries(attributes).map(([name, value]) => ({
                Name: name,
                Value: value
            }));

            const command = new AdminUpdateUserAttributesCommand({
                UserPoolId: this.userPoolId,
                Username: email,
                UserAttributes: userAttributes
            });

            await this.client.send(command);
        } catch (error) {
            console.error('Error updating user attributes:', error);
            throw new Error(`Failed to update user: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Change user password
     */
    async changePassword(email: string, request: ChangePasswordRequest): Promise<void> {
        try {
            // First authenticate to get access token
            const authResult = await this.authenticateUser({
                email,
                password: request.currentPassword
            });

            const command = new ChangePasswordCommand({
                AccessToken: authResult.AccessToken,
                PreviousPassword: request.currentPassword,
                ProposedPassword: request.newPassword
            });

            await this.client.send(command);
        } catch (error) {
            console.error('Error changing password:', error);
            throw new Error(`Failed to change password: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Initiate password reset
     */
    async initiatePasswordReset(request: PasswordResetRequest): Promise<void> {
        try {
            const command = new ForgotPasswordCommand({
                ClientId: this.clientId,
                Username: request.email
            });

            await this.client.send(command);
        } catch (error) {
            console.error('Error initiating password reset:', error);
            throw new Error(`Failed to initiate password reset: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Confirm password reset
     */
    async confirmPasswordReset(request: PasswordResetConfirm): Promise<void> {
        try {
            const command = new ConfirmForgotPasswordCommand({
                ClientId: this.clientId,
                Username: request.email,
                ConfirmationCode: request.code,
                Password: request.newPassword
            });

            await this.client.send(command);
        } catch (error) {
            console.error('Error confirming password reset:', error);
            throw new Error(`Failed to confirm password reset: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Sign out user globally
     */
    async signOutUser(accessToken: string): Promise<void> {
        try {
            const command = new GlobalSignOutCommand({
                AccessToken: accessToken
            });

            await this.client.send(command);
        } catch (error) {
            console.error('Error signing out user:', error);
            throw new Error(`Failed to sign out user: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Delete user from Cognito
     */
    async deleteUser(email: string): Promise<void> {
        try {
            const command = new AdminDeleteUserCommand({
                UserPoolId: this.userPoolId,
                Username: email
            });

            await this.client.send(command);
        } catch (error) {
            console.error('Error deleting user:', error);
            throw new Error(`Failed to delete user: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Set user password (admin operation)
     */
    private async setUserPassword(email: string, password: string): Promise<void> {
        const command = new AdminSetUserPasswordCommand({
            UserPoolId: this.userPoolId,
            Username: email,
            Password: password,
            Permanent: true
        });

        await this.client.send(command);
    }

    /**
     * Generate a temporary password
     */
    private generateTemporaryPassword(): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        let password = '';
        for (let i = 0; i < 12; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
    }

    /**
     * Map Cognito user to our User interface
     */
    private mapCognitoUser(cognitoUser: any): CognitoUser {
        const attributes = cognitoUser.Attributes || [];
        const attributeMap: Record<string, string> = {};

        attributes.forEach((attr: any) => {
            attributeMap[attr.Name] = attr.Value;
        });

        return {
            Username: cognitoUser.Username,
            UserStatus: cognitoUser.UserStatus,
            Attributes: {
                email: attributeMap.email || '',
                given_name: attributeMap.given_name || '',
                family_name: attributeMap.family_name || '',
                'custom:role': attributeMap['custom:role'] || UserRole.STUDENT,
                'custom:school_id': attributeMap['custom:school_id']
            }
        };
    }
}
