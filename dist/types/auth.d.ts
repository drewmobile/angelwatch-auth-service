export interface User {
    userId: string;
    timestamp?: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    schoolId?: string;
    schoolIds?: string[];
    stateCode?: string;
    isIndependent?: boolean;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    lastLoginAt?: string;
    cognitoSub?: string;
    googleId?: string;
}
export declare enum UserRole {
    STUDENT = "student",
    TEACHER = "teacher",
    ADMIN = "admin",
    SCHOOL_ADMIN = "school_admin",
    STATE_ADMIN = "state_admin",
    SYSTEM_ADMIN = "system_admin"
}
export interface AuthRequest {
    email: string;
    password: string;
}
export interface RegisterRequest {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    schoolId?: string;
}
export interface AuthResponse {
    success: boolean;
    message: string;
    data?: {
        user: User;
        tokens: {
            accessToken: string;
            refreshToken: string;
            idToken: string;
        };
    };
    error?: string;
}
export interface TokenPayload {
    userId: string;
    email: string;
    role: UserRole;
    schoolId?: string;
    iat: number;
    exp: number;
}
export interface CognitoTokens {
    AccessToken: string;
    RefreshToken: string;
    IdToken: string;
}
export interface CognitoUser {
    Username: string;
    UserStatus: string;
    Attributes: {
        email: string;
        given_name: string;
        family_name: string;
        'custom:role': string;
        'custom:school_id'?: string;
    };
}
export interface GoogleOAuthUser {
    id: string;
    email: string;
    given_name: string;
    family_name: string;
    picture?: string;
}
export interface PasswordResetRequest {
    email: string;
}
export interface PasswordResetConfirm {
    email: string;
    code: string;
    newPassword: string;
}
export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
}
export interface UpdateProfileRequest {
    firstName?: string;
    lastName?: string;
    schoolId?: string;
    schoolIds?: string[];
    isIndependent?: boolean;
}
export interface AdminPasswordResetRequest {
    userId: string;
    adminUserId: string;
    sendEmail?: boolean;
    temporaryPassword?: string;
}
export interface AdminPasswordResetResponse {
    success: boolean;
    message: string;
    temporaryPassword?: string;
    resetToken?: string;
    error?: string;
}
export interface UserSearchRequest {
    schoolId?: string;
    role?: UserRole;
    searchTerm?: string;
    limit?: number;
    offset?: number;
}
export interface UserSearchResponse {
    success: boolean;
    users: User[];
    totalCount: number;
    message?: string;
    error?: string;
}
export interface SchoolAssignmentRequest {
    adminUserId: string;
    schoolId: string;
    action: 'add' | 'remove';
}
export interface SchoolAssignmentResponse {
    success: boolean;
    message: string;
    adminSchools?: string[];
    error?: string;
}
export interface AdminSchoolsResponse {
    success: boolean;
    schools: School[];
    message?: string;
    error?: string;
}
export interface School {
    schoolId: string;
    name: string;
    district?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    phone?: string;
    email?: string;
    contactPerson?: string;
    licenseType: 'individual' | 'school' | 'district';
    maxUsers: number;
    activeUsers: number;
    isActive: boolean;
    subscriptionStatus: 'active' | 'trial' | 'expired' | 'suspended';
    subscriptionEndDate?: string;
    createdAt: string;
    updatedAt: string;
}
export interface UserActivity {
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    schoolId?: string;
    schoolName?: string;
    lastLoginAt?: string;
    loginCount: number;
    coursesCompleted: number;
    totalWatchTime: number;
    isActive: boolean;
    createdAt: string;
}
export interface SystemStats {
    totalSchools: number;
    totalUsers: number;
    activeUsers: number;
    totalCourses: number;
    completedCourses: number;
    totalWatchTime: number;
    supportTickets: number;
    systemUptime: number;
}
export interface SupportTicket {
    ticketId: string;
    userId: string;
    userEmail: string;
    userName: string;
    schoolId?: string;
    schoolName?: string;
    subject: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'open' | 'in_progress' | 'resolved' | 'closed';
    category: 'technical' | 'billing' | 'training' | 'general';
    assignedTo?: string;
    createdAt: string;
    updatedAt: string;
    resolvedAt?: string;
}
export interface CreateSystemAdminRequest {
    email: string;
    firstName: string;
    lastName: string;
    password: string;
}
//# sourceMappingURL=auth.d.ts.map