import { TokenPayload, User, UserRole } from '../types/auth';
export declare class JwtService {
    private secret;
    private expiresIn;
    constructor();
    generateToken(user: User): string;
    verifyToken(token: string): TokenPayload | null;
    decodeToken(token: string): TokenPayload | null;
    isTokenExpired(token: string): boolean;
    extractTokenFromHeader(authHeader: string | undefined): string | null;
    generateRefreshToken(user: User): string;
    verifyRefreshToken(token: string): {
        userId: string;
        email: string;
    } | null;
    generateTokenPair(user: User): {
        accessToken: string;
        refreshToken: string;
    };
    private parseExpiresIn;
    getTokenExpiration(token: string): Date | null;
    hasRole(tokenPayload: TokenPayload, requiredRole: UserRole): boolean;
    belongsToSchool(tokenPayload: TokenPayload, schoolId: string): boolean;
    isAdmin(tokenPayload: TokenPayload): boolean;
    isSchoolAdmin(tokenPayload: TokenPayload): boolean;
    isTeacher(tokenPayload: TokenPayload): boolean;
    isStudent(tokenPayload: TokenPayload): boolean;
}
//# sourceMappingURL=jwtService.d.ts.map