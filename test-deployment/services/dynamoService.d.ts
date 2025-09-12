import { User, UserRole, UpdateProfileRequest } from '../types/auth';
export declare class DynamoService {
    private client;
    private tableName;
    constructor();
    createUser(user: User): Promise<User>;
    getUserById(userId: string): Promise<User | null>;
    getUserByEmail(email: string): Promise<User | null>;
    updateUser(userId: string, updates: UpdateProfileRequest): Promise<User>;
    updateLastLogin(userId: string): Promise<void>;
    deleteUser(userId: string): Promise<void>;
    getUsersBySchool(schoolId: string): Promise<User[]>;
    getUsersByRole(role: UserRole): Promise<User[]>;
    searchUsers(searchTerm: string, limit?: number): Promise<User[]>;
}
//# sourceMappingURL=dynamoService.d.ts.map