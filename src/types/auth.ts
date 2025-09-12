// Authentication types and interfaces for AngelWatch Auth Service

export interface User {
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    schoolId?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    lastLoginAt?: string;
    cognitoSub?: string;
    googleId?: string;
}

export enum UserRole {
    STUDENT = 'student',
    TEACHER = 'teacher',
    ADMIN = 'admin',
    SCHOOL_ADMIN = 'school_admin'
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
}
