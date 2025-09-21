import { User, AuthRequest, RegisterRequest, AuthResponse, PasswordResetRequest, PasswordResetConfirm, ChangePasswordRequest, UpdateProfileRequest, SystemStats, School, UserActivity, SupportTicket, CreateSystemAdminRequest } from '../types/auth';
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
    getSystemStats(): Promise<SystemStats>;
    getAllSchools(): Promise<School[]>;
    updateSchoolStatus(schoolId: string, isActive: boolean): Promise<School>;
    getAllUsersWithActivity(): Promise<UserActivity[]>;
    updateUserStatus(userId: string, isActive: boolean): Promise<User>;
    getSupportTickets(): Promise<SupportTicket[]>;
    updateSupportTicket(ticketId: string, status: string, assignedTo?: string): Promise<SupportTicket>;
    createSystemAdmin(request: CreateSystemAdminRequest): Promise<User>;
    getSchoolById(schoolId: string): Promise<School | null>;
    getSchoolTeachers(schoolId: string): Promise<any[]>;
    createTeacher(teacherData: {
        email: string;
        firstName: string;
        lastName: string;
        schoolId: string;
        role: string;
    }): Promise<User>;
    resetUserPassword(userId: string, newPassword: string): Promise<void>;
    getProspectsByState(stateCode: string): Promise<any[]>;
}
//# sourceMappingURL=authService.d.ts.map