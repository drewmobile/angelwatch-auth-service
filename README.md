# AngelWatch Authentication Service

AWS Lambda microservice for user authentication and management with Amazon Cognito integration and Google OAuth support.

## 🎯 Overview

This service handles all authentication-related functionality for the AngelWatch platform, including:

- User registration and login
- Google OAuth 2.0 integration
- JWT token management
- Role-based access control
- Password reset functionality
- School and teacher registration

## 🏗️ Architecture

- **AWS Lambda** - Serverless compute
- **Amazon Cognito** - User pool management
- **Amazon DynamoDB** - User data storage
- **AWS API Gateway** - HTTP endpoints
- **Google OAuth 2.0** - Social login integration

## 📁 Project Structure

```
angelwatch-auth-service/
├── src/
│   ├── handlers/           # Lambda handlers
│   │   ├── login.ts
│   │   ├── register.ts
│   │   ├── school-register.ts
│   │   ├── teacher-register.ts
│   │   └── profile.ts
│   ├── services/          # Business logic
│   │   ├── auth.service.ts
│   │   ├── user.service.ts
│   │   └── school.service.ts
│   ├── models/            # Data models
│   │   ├── user.model.ts
│   │   └── school.model.ts
│   ├── utils/            # Utilities
│   │   ├── validation.ts
│   │   ├── response.ts
│   │   └── jwt.ts
│   └── types/            # TypeScript types
│       ├── auth.types.ts
│       └── user.types.ts
├── tests/                 # Unit tests
├── infrastructure/        # CDK/Terraform
├── package.json
├── tsconfig.json
└── README.md
```

## 🚀 API Endpoints

### Authentication Routes
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/school-register` - School registration
- `POST /auth/teacher-register` - Teacher registration
- `POST /auth/reset-password` - Password reset

### User Management Routes
- `GET /auth/profile` - Get user profile
- `PUT /auth/profile` - Update user profile
- `GET /auth/verify-token` - Verify JWT token

## 🔧 Development Setup

### Prerequisites
- Node.js 18+
- AWS CLI configured
- Terraform or AWS CDK

### Installation
```bash
npm install
```

### Local Development
```bash
npm run dev
```

### Testing
```bash
npm test
```

### Deployment
```bash
npm run deploy
```

## 🔐 Authentication Flow

### 1. Email/Password Authentication
```typescript
// User registration
POST /auth/register
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword",
  "type_id": "teacher",
  "stateid": "12345"
}

// User login
POST /auth/login
{
  "email": "john@example.com",
  "password": "securepassword",
  "isteacher": true
}
```

### 2. Google OAuth Authentication
```typescript
// Frontend integration with AWS Amplify
import { signIn } from 'aws-amplify/auth';

const handleGoogleSignIn = async () => {
  try {
    await signIn({
      provider: 'Google',
    });
  } catch (error) {
    console.error('Google sign-in error:', error);
  }
};
```

## 📊 Data Models

### User Model
```typescript
interface User {
  userId: string;           // Email address
  timestamp: string;        // 'profile' for main record
  name: string;
  email: string;
  password: string;         // Hashed
  type_id: string;          // 'teacher', 'school', 'admin'
  stateid: string;
  school_id?: string;       // For teachers
  issignup: boolean;
  signupdate: string;
  createdAt: string;
  updatedAt: string;
}
```

### School Model
```typescript
interface School {
  schoolId: string;
  timestamp: string;
  name: string;
  email: string;
  address: string;
  phone: string;
  stateid: string;
  createdAt: string;
  updatedAt: string;
}
```

## 🔒 Security Features

- **Password Hashing** - bcrypt with salt rounds
- **JWT Tokens** - Secure token-based authentication
- **Cognito Integration** - AWS-managed user pools
- **Google OAuth** - Industry-standard OAuth 2.0
- **Input Validation** - Comprehensive request validation
- **Rate Limiting** - API Gateway throttling

## 🧪 Testing

### Unit Tests
```bash
npm run test:unit
```

### Integration Tests
```bash
npm run test:integration
```

### Load Tests
```bash
npm run test:load
```

## 📈 Monitoring

- **CloudWatch Logs** - Function execution logs
- **CloudWatch Metrics** - Performance metrics
- **X-Ray Tracing** - Distributed tracing
- **Custom Dashboards** - Service monitoring

## 🚀 Deployment

### Infrastructure
```bash
cd infrastructure
terraform init
terraform plan
terraform apply
```

### Lambda Functions
```bash
npm run build
npm run deploy
```

## 🔗 Related Services

- **Content Service** - Course and quiz management
- **Payment Service** - Subscription and billing
- **Notification Service** - Email communications
- **Infrastructure** - AWS resource management

## 📚 Documentation

- [API Documentation](docs/api.md)
- [Authentication Guide](docs/auth-guide.md)
- [Deployment Guide](docs/deployment.md)
- [Troubleshooting](docs/troubleshooting.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

---

*Part of the AngelWatch AWS microservices migration project.*
