// JWT service for token management
import jwt from 'jsonwebtoken';
import { config } from '../config/environment';
import { TokenPayload, User, UserRole } from '../types/auth';

export class JwtService {
    private secret: string;
    private expiresIn: string;

    constructor() {
        this.secret = config.jwtSecret;
        this.expiresIn = config.jwtExpiresIn;
    }

    /**
     * Generate JWT token for user
     */
    generateToken(user: User): string {
        const payload: TokenPayload = {
            userId: user.userId,
            email: user.email,
            role: user.role,
            schoolId: user.schoolId,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + this.parseExpiresIn(this.expiresIn)
        };

        return jwt.sign(payload, this.secret);
    }

    /**
     * Verify JWT token
     */
    verifyToken(token: string): TokenPayload | null {
        try {
            const decoded = jwt.verify(token, this.secret) as TokenPayload;
            return decoded;
        } catch (error) {
            console.error('Error verifying token:', error);
            return null;
        }
    }

    /**
     * Decode token without verification (for debugging)
     */
    decodeToken(token: string): TokenPayload | null {
        try {
            const decoded = jwt.decode(token) as TokenPayload;
            return decoded;
        } catch (error) {
            console.error('Error decoding token:', error);
            return null;
        }
    }

    /**
     * Check if token is expired
     */
    isTokenExpired(token: string): boolean {
        const decoded = this.decodeToken(token);
        if (!decoded) return true;

        return decoded.exp < Math.floor(Date.now() / 1000);
    }

    /**
     * Extract token from Authorization header
     */
    extractTokenFromHeader(authHeader: string | undefined): string | null {
        if (!authHeader) return null;

        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            return null;
        }

        return parts[1];
    }

    /**
     * Generate refresh token (longer expiration)
     */
    generateRefreshToken(user: User): string {
        const payload = {
            userId: user.userId,
            email: user.email,
            type: 'refresh',
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 days
        };

        return jwt.sign(payload, this.secret);
    }

    /**
     * Verify refresh token
     */
    verifyRefreshToken(token: string): { userId: string; email: string } | null {
        try {
            const decoded = jwt.verify(token, this.secret) as any;
            if (decoded.type !== 'refresh') {
                return null;
            }
            return {
                userId: decoded.userId,
                email: decoded.email
            };
        } catch (error) {
            console.error('Error verifying refresh token:', error);
            return null;
        }
    }

    /**
     * Generate token pair (access + refresh)
     */
    generateTokenPair(user: User): { accessToken: string; refreshToken: string } {
        return {
            accessToken: this.generateToken(user),
            refreshToken: this.generateRefreshToken(user)
        };
    }

    /**
     * Parse expires in string to seconds
     */
    private parseExpiresIn(expiresIn: string): number {
        const unit = expiresIn.slice(-1);
        const value = parseInt(expiresIn.slice(0, -1));

        switch (unit) {
            case 's': return value;
            case 'm': return value * 60;
            case 'h': return value * 60 * 60;
            case 'd': return value * 24 * 60 * 60;
            default: return 24 * 60 * 60; // Default to 24 hours
        }
    }

    /**
     * Get token expiration time
     */
    getTokenExpiration(token: string): Date | null {
        const decoded = this.decodeToken(token);
        if (!decoded) return null;

        return new Date(decoded.exp * 1000);
    }

    /**
     * Check if user has required role
     */
    hasRole(tokenPayload: TokenPayload, requiredRole: UserRole): boolean {
        const roleHierarchy = {
            [UserRole.STUDENT]: 1,
            [UserRole.TEACHER]: 2,
            [UserRole.SCHOOL_ADMIN]: 3,
            [UserRole.ADMIN]: 4
        };

        const userRoleLevel = roleHierarchy[tokenPayload.role] || 0;
        const requiredRoleLevel = roleHierarchy[requiredRole] || 0;

        return userRoleLevel >= requiredRoleLevel;
    }

    /**
     * Check if user belongs to school
     */
    belongsToSchool(tokenPayload: TokenPayload, schoolId: string): boolean {
        return tokenPayload.schoolId === schoolId;
    }

    /**
     * Check if user is admin
     */
    isAdmin(tokenPayload: TokenPayload): boolean {
        return tokenPayload.role === UserRole.ADMIN;
    }

    /**
     * Check if user is school admin
     */
    isSchoolAdmin(tokenPayload: TokenPayload): boolean {
        return tokenPayload.role === UserRole.SCHOOL_ADMIN;
    }

    /**
     * Check if user is teacher
     */
    isTeacher(tokenPayload: TokenPayload): boolean {
        return tokenPayload.role === UserRole.TEACHER;
    }

    /**
     * Check if user is student
     */
    isStudent(tokenPayload: TokenPayload): boolean {
        return tokenPayload.role === UserRole.STUDENT;
    }
}
