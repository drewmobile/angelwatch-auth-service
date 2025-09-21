"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CognitoService = void 0;
const client_cognito_identity_provider_1 = require("@aws-sdk/client-cognito-identity-provider");
const environment_1 = require("../config/environment");
const auth_1 = require("../types/auth");
class CognitoService {
    constructor() {
        this.client = new client_cognito_identity_provider_1.CognitoIdentityProviderClient({
            region: environment_1.config.awsRegion
        });
        this.userPoolId = environment_1.config.cognitoUserPoolId;
        this.clientId = environment_1.config.cognitoClientId;
    }
    async registerUser(request) {
        try {
            const command = new client_cognito_identity_provider_1.AdminCreateUserCommand({
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
                MessageAction: 'SUPPRESS'
            });
            const response = await this.client.send(command);
            if (!response.User) {
                throw new Error('Failed to create user in Cognito');
            }
            await this.setUserPassword(request.email, request.password);
            return this.mapCognitoUser(response.User);
        }
        catch (error) {
            console.error('Error registering user:', error);
            throw new Error(`Failed to register user: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async authenticateUser(request) {
        try {
            const command = new client_cognito_identity_provider_1.InitiateAuthCommand({
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
                AccessToken: response.AuthenticationResult.AccessToken,
                RefreshToken: response.AuthenticationResult.RefreshToken,
                IdToken: response.AuthenticationResult.IdToken
            };
        }
        catch (error) {
            console.error('Error authenticating user:', error);
            throw new Error(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getUser(email) {
        try {
            const command = new client_cognito_identity_provider_1.AdminGetUserCommand({
                UserPoolId: this.userPoolId,
                Username: email
            });
            const response = await this.client.send(command);
            return this.mapCognitoUser(response);
        }
        catch (error) {
            console.error('Error getting user:', error);
            throw new Error(`Failed to get user: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async updateUserAttributes(email, attributes) {
        try {
            const userAttributes = Object.entries(attributes).map(([name, value]) => ({
                Name: name,
                Value: value
            }));
            const command = new client_cognito_identity_provider_1.AdminUpdateUserAttributesCommand({
                UserPoolId: this.userPoolId,
                Username: email,
                UserAttributes: userAttributes
            });
            await this.client.send(command);
        }
        catch (error) {
            console.error('Error updating user attributes:', error);
            throw new Error(`Failed to update user: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async changePassword(email, request) {
        try {
            const authResult = await this.authenticateUser({
                email,
                password: request.currentPassword
            });
            const command = new client_cognito_identity_provider_1.ChangePasswordCommand({
                AccessToken: authResult.AccessToken,
                PreviousPassword: request.currentPassword,
                ProposedPassword: request.newPassword
            });
            await this.client.send(command);
        }
        catch (error) {
            console.error('Error changing password:', error);
            throw new Error(`Failed to change password: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async initiatePasswordReset(request) {
        try {
            const command = new client_cognito_identity_provider_1.ForgotPasswordCommand({
                ClientId: this.clientId,
                Username: request.email
            });
            await this.client.send(command);
        }
        catch (error) {
            console.error('Error initiating password reset:', error);
            throw new Error(`Failed to initiate password reset: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async confirmPasswordReset(request) {
        try {
            const command = new client_cognito_identity_provider_1.ConfirmForgotPasswordCommand({
                ClientId: this.clientId,
                Username: request.email,
                ConfirmationCode: request.code,
                Password: request.newPassword
            });
            await this.client.send(command);
        }
        catch (error) {
            console.error('Error confirming password reset:', error);
            throw new Error(`Failed to confirm password reset: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async signOutUser(accessToken) {
        try {
            const command = new client_cognito_identity_provider_1.GlobalSignOutCommand({
                AccessToken: accessToken
            });
            await this.client.send(command);
        }
        catch (error) {
            console.error('Error signing out user:', error);
            throw new Error(`Failed to sign out user: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async deleteUser(email) {
        try {
            const command = new client_cognito_identity_provider_1.AdminDeleteUserCommand({
                UserPoolId: this.userPoolId,
                Username: email
            });
            await this.client.send(command);
        }
        catch (error) {
            console.error('Error deleting user:', error);
            throw new Error(`Failed to delete user: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async setUserPassword(email, password) {
        const command = new client_cognito_identity_provider_1.AdminSetUserPasswordCommand({
            UserPoolId: this.userPoolId,
            Username: email,
            Password: password,
            Permanent: true
        });
        await this.client.send(command);
    }
    generateTemporaryPassword() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        let password = '';
        for (let i = 0; i < 12; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
    }
    mapCognitoUser(cognitoUser) {
        const attributes = cognitoUser.Attributes || [];
        const attributeMap = {};
        attributes.forEach((attr) => {
            attributeMap[attr.Name] = attr.Value;
        });
        return {
            Username: cognitoUser.Username,
            UserStatus: cognitoUser.UserStatus,
            Attributes: {
                email: attributeMap.email || '',
                given_name: attributeMap.given_name || '',
                family_name: attributeMap.family_name || '',
                'custom:role': attributeMap['custom:role'] || auth_1.UserRole.STUDENT,
                'custom:school_id': attributeMap['custom:school_id']
            }
        };
    }
    async resetUserPassword(email, newPassword) {
        try {
            const listUsersCommand = new client_cognito_identity_provider_1.ListUsersCommand({
                UserPoolId: this.userPoolId,
                Filter: `email = "${email}"`
            });
            const listUsersResult = await this.client.send(listUsersCommand);
            if (!listUsersResult.Users || listUsersResult.Users.length === 0) {
                throw new Error('User not found');
            }
            const user = listUsersResult.Users[0];
            if (!user.Username) {
                throw new Error('User username not found');
            }
            const setPasswordCommand = new client_cognito_identity_provider_1.AdminSetUserPasswordCommand({
                UserPoolId: this.userPoolId,
                Username: user.Username,
                Password: newPassword,
                Permanent: true
            });
            await this.client.send(setPasswordCommand);
        }
        catch (error) {
            console.error('Error resetting user password:', error);
            throw error;
        }
    }
}
exports.CognitoService = CognitoService;
//# sourceMappingURL=cognitoService.js.map