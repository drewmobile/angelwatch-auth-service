import { User, UserRole, UpdateProfileRequest, SystemStats, School, UserActivity, SupportTicket } from '../types/auth';
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
    getSystemStats(): Promise<SystemStats>;
    getAllSchools(): Promise<School[]>;
    updateSchoolStatus(schoolId: string, isActive: boolean): Promise<School>;
    getAllUsersWithActivity(): Promise<UserActivity[]>;
    updateUserStatus(userId: string, isActive: boolean): Promise<User>;
    getSupportTickets(): Promise<SupportTicket[]>;
    updateSupportTicket(ticketId: string, status: string, assignedTo?: string): Promise<SupportTicket>;
    getSchoolById(schoolId: string): Promise<School | null>;
    getSchoolTeachers(schoolId: string): Promise<any[]>;
    private unmarshallUser;
    getProspectsByState(stateCode: string): Promise<any[]>;
    private unmarshallSchool;
}
//# sourceMappingURL=dynamoService.d.ts.map