# CS 493 | Spring 2025 |

## Description
Tarpaulin is a lightweight course management API that serves as an alternative to Canvas. This RESTful API enables educational institutions to manage courses, users, assignments, and student submissions with role-based access control and comprehensive authentication.

## Components

### Database
- **MongoDB**: Primary database for storing users, courses, assignments, and metadata
- **GridFS**: MongoDB's file storage system for handling assignment submissions
- **Redis**: In-memory cache for rate limiting and session management

### Authentication & Authorization
- **JWT Tokens**: Stateless authentication with 24-hour expiration
- **Role-Based Access Control**: Three distinct user roles with specific permissions:
  - **Admin**: Full system access, user management, course creation
  - **Instructor**: Course and assignment management for owned courses
  - **Student**: Course enrollment, assignment submission, own data access

### Rate Limiting
- **IP-based Rate Limiting**: Prevents API abuse using Redis-backed rate limiting
- **Configurable Limits**: Adjustable rate limits per endpoint

### File Handling
- **Secure Upload**: Multipart file uploads with proper validation
- **Access Control**: Submission downloads restricted to authorized users
- **Metadata Storage**: File information stored with submission records


## Starting The Project
1. **Clone and Navigate**:
   ```bash
   git clone <repository-url>
   cd tarpaulin-api
   ```

2. **Build and Start**:
   ```bash
   docker compose up -d --build
   ```

3. **Verify Installation**:
   ```bash
   sh runtests.sh
   ```

The test script will run a comprehensive suite of tests covering:
- API connectivity and health checks
- Authentication for all user roles
- Course management operations
- Authorization and access control
- User management functionality
- Error handling and edge cases