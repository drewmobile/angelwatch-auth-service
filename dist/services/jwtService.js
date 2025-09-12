"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const environment_1 = require("../config/environment");
const auth_1 = require("../types/auth");
class JwtService {
    constructor() {
        this.secret = environment_1.config.jwtSecret;
        this.expiresIn = environment_1.config.jwtExpiresIn;
    }
    generateToken(user) {
        const payload = {
            userId: user.userId,
            email: user.email,
            role: user.role,
            schoolId: user.schoolId,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + this.parseExpiresIn(this.expiresIn)
        };
        return jsonwebtoken_1.default.sign(payload, this.secret);
    }
    verifyToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, this.secret);
            return decoded;
        }
        catch (error) {
            console.error('Error verifying token:', error);
            return null;
        }
    }
    decodeToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.decode(token);
            return decoded;
        }
        catch (error) {
            console.error('Error decoding token:', error);
            return null;
        }
    }
    isTokenExpired(token) {
        const decoded = this.decodeToken(token);
        if (!decoded)
            return true;
        return decoded.exp < Math.floor(Date.now() / 1000);
    }
    extractTokenFromHeader(authHeader) {
        if (!authHeader)
            return null;
        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            return null;
        }
        return parts[1];
    }
    generateRefreshToken(user) {
        const payload = {
            userId: user.userId,
            email: user.email,
            type: 'refresh',
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60)
        };
        return jsonwebtoken_1.default.sign(payload, this.secret);
    }
    verifyRefreshToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, this.secret);
            if (decoded.type !== 'refresh') {
                return null;
            }
            return {
                userId: decoded.userId,
                email: decoded.email
            };
        }
        catch (error) {
            console.error('Error verifying refresh token:', error);
            return null;
        }
    }
    generateTokenPair(user) {
        return {
            accessToken: this.generateToken(user),
            refreshToken: this.generateRefreshToken(user)
        };
    }
    parseExpiresIn(expiresIn) {
        const unit = expiresIn.slice(-1);
        const value = parseInt(expiresIn.slice(0, -1));
        switch (unit) {
            case 's': return value;
            case 'm': return value * 60;
            case 'h': return value * 60 * 60;
            case 'd': return value * 24 * 60 * 60;
            default: return 24 * 60 * 60;
        }
    }
    getTokenExpiration(token) {
        const decoded = this.decodeToken(token);
        if (!decoded)
            return null;
        return new Date(decoded.exp * 1000);
    }
    hasRole(tokenPayload, requiredRole) {
        const roleHierarchy = {
            [auth_1.UserRole.STUDENT]: 1,
            [auth_1.UserRole.TEACHER]: 2,
            [auth_1.UserRole.SCHOOL_ADMIN]: 3,
            [auth_1.UserRole.ADMIN]: 4
        };
        const userRoleLevel = roleHierarchy[tokenPayload.role] || 0;
        const requiredRoleLevel = roleHierarchy[requiredRole] || 0;
        return userRoleLevel >= requiredRoleLevel;
    }
    belongsToSchool(tokenPayload, schoolId) {
        return tokenPayload.schoolId === schoolId;
    }
    isAdmin(tokenPayload) {
        return tokenPayload.role === auth_1.UserRole.ADMIN;
    }
    isSchoolAdmin(tokenPayload) {
        return tokenPayload.role === auth_1.UserRole.SCHOOL_ADMIN;
    }
    isTeacher(tokenPayload) {
        return tokenPayload.role === auth_1.UserRole.TEACHER;
    }
    isStudent(tokenPayload) {
        return tokenPayload.role === auth_1.UserRole.STUDENT;
    }
}
exports.JwtService = JwtService;
//# sourceMappingURL=jwtService.js.map