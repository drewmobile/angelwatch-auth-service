import { AuthRequest, RegisterRequest, CognitoTokens, CognitoUser, PasswordResetRequest, PasswordResetConfirm, ChangePasswordRequest } from '../types/auth';
export declare class CognitoService {
    private client;
    private userPoolId;
    private clientId;
    constructor();
    registerUser(request: RegisterRequest): Promise<CognitoUser>;
    authenticateUser(request: AuthRequest): Promise<CognitoTokens>;
    getUser(email: string): Promise<CognitoUser>;
    updateUserAttributes(email: string, attributes: Record<string, string>): Promise<void>;
    changePassword(email: string, request: ChangePasswordRequest): Promise<void>;
    initiatePasswordReset(request: PasswordResetRequest): Promise<void>;
    confirmPasswordReset(request: PasswordResetConfirm): Promise<void>;
    signOutUser(accessToken: string): Promise<void>;
    deleteUser(email: string): Promise<void>;
    private setUserPassword;
    private generateTemporaryPassword;
    private mapCognitoUser;
    resetUserPassword(email: string, newPassword: string): Promise<void>;
}
//# sourceMappingURL=cognitoService.d.ts.map