import { User, AuthRequest, RegisterRequest, AuthResponse, PasswordResetRequest, PasswordResetConfirm, ChangePasswordRequest, UpdateProfileRequest } from '../types/auth';
export declare class AuthService {
    private cognitoService;
    private dynamoService;
    private jwtService;
    constructor();
    registerUser(request: RegisterRequest): Promise<AuthResponse>;
    authenticateUser(request: AuthRequest): Promise<AuthResponse>;
    getUserProfile(userId: string): Promise<AuthResponse>;
    updateUserProfile(userId: string, updates: UpdateProfileRequest): Promise<AuthResponse>;
    changePassword(userId: string, request: ChangePasswordRequest): Promise<AuthResponse>;
    initiatePasswordReset(request: PasswordResetRequest): Promise<AuthResponse>;
    confirmPasswordReset(request: PasswordResetConfirm): Promise<AuthResponse>;
    signOutUser(accessToken: string): Promise<AuthResponse>;
    deleteUser(userId: string): Promise<AuthResponse>;
    refreshToken(refreshToken: string): Promise<AuthResponse>;
    verifyToken(token: string): Promise<{
        user: User;
        tokenPayload: any;
    } | null>;
}
//# sourceMappingURL=authService.d.ts.map