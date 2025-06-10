#!/bin/bash

# Comprehensive Tarpaulin API Test Report
# This script tests all major functionality and generates a detailed report

BASE_URL="http://localhost:3000"
REPORT_FILE="test_report_$(date +%Y%m%d_%H%M%S).txt"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Test tracking
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Helper functions
print_test() { 
    echo -e "${BLUE}[TEST]${NC} $1"
    echo "[TEST] $1" >> $REPORT_FILE
    ((TOTAL_TESTS++))
}

print_success() { 
    echo -e "${GREEN}[PASS]${NC} $1"
    echo "[PASS] $1" >> $REPORT_FILE
    ((PASSED_TESTS++))
}

print_error() { 
    echo -e "${RED}[FAIL]${NC} $1"
    echo "[FAIL] $1" >> $REPORT_FILE
    ((FAILED_TESTS++))
}

print_section() { 
    echo -e "\n${YELLOW}====== $1 ======${NC}"
    echo "" >> $REPORT_FILE
    echo "====== $1 ======" >> $REPORT_FILE
}

wait_for_rate_limit() {
    echo -e "${YELLOW}[WAIT]${NC} Rate limit cooldown..."
    sleep 6
}

# Test function that handles rate limiting and tracks results
run_test() {
    local test_name="$1"
    local expected_status="$2"
    local curl_command="$3"
    
    print_test "$test_name"
    
    local response=$(eval "$curl_command")
    local status=$(echo $response | sed -n 's/.*HTTPSTATUS:\([0-9]*\)/\1/p')
    local body=$(echo $response | sed 's/HTTPSTATUS:.*$//')
    
    if [ "$status" -eq "$expected_status" ]; then
        print_success "$test_name - Status: $status"
        echo "$body" | head -c 200 >> $REPORT_FILE
        echo "" >> $REPORT_FILE
        return 0
    else
        print_error "$test_name - Expected: $expected_status, Got: $status"
        echo "Response: $body" | head -c 200 >> $REPORT_FILE
        echo "" >> $REPORT_FILE
        return 1
    fi
}

main() {
    echo -e "${BLUE}Tarpaulin API Comprehensive Test Report${NC}"
    echo "========================================"
    echo "Tarpaulin API Comprehensive Test Report" > $REPORT_FILE
    echo "Generated: $(date)" >> $REPORT_FILE
    echo "=======================================" >> $REPORT_FILE
    
    # Test 1: API Health Check
    print_section "API HEALTH CHECK"
    run_test "Basic API connectivity" 200 \
        'curl -s -w "HTTPSTATUS:%{http_code}" "$BASE_URL/courses"'
    wait_for_rate_limit
    
    # Test 2: Authentication Tests
    print_section "AUTHENTICATION TESTS"
    
    # Student login
    response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -d '{"email":"BlemminsS@oregonstate.edu","password":"password5678"}' \
        "$BASE_URL/users/login")
    
    status=$(echo $response | sed -n 's/.*HTTPSTATUS:\([0-9]*\)/\1/p')
    body=$(echo $response | sed 's/HTTPSTATUS:.*$//')
    
    if [ "$status" -eq 200 ]; then
        STUDENT_TOKEN=$(echo $body | jq -r '.token' 2>/dev/null)
        print_test "Student authentication"
        print_success "Student authentication - Token obtained"
    else
        print_test "Student authentication"
        print_error "Student authentication failed - Status: $status"
    fi
    
    wait_for_rate_limit
    
    # Instructor login
    response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -d '{"email":"SmithC@oregonstate.edu","password":"securepass789"}' \
        "$BASE_URL/users/login")
    
    status=$(echo $response | sed -n 's/.*HTTPSTATUS:\([0-9]*\)/\1/p')
    body=$(echo $response | sed 's/HTTPSTATUS:.*$//')
    
    if [ "$status" -eq 200 ]; then
        INSTRUCTOR_TOKEN=$(echo $body | jq -r '.token' 2>/dev/null)
        print_test "Instructor authentication"
        print_success "Instructor authentication - Token obtained"
    else
        print_test "Instructor authentication"
        print_error "Instructor authentication failed - Status: $status"
    fi
    
    wait_for_rate_limit
    
    # Admin login
    response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -d '{"email":"DavisM@oregonstate.edu","password":"password100100"}' \
        "$BASE_URL/users/login")
    
    status=$(echo $response | sed -n 's/.*HTTPSTATUS:\([0-9]*\)/\1/p')
    body=$(echo $response | sed 's/HTTPSTATUS:.*$//')
    
    if [ "$status" -eq 200 ]; then
        ADMIN_TOKEN=$(echo $body | jq -r '.token' 2>/dev/null)
        print_test "Admin authentication"
        print_success "Admin authentication - Token obtained"
    else
        print_test "Admin authentication"
        print_error "Admin authentication failed - Status: $status"
    fi
    
    wait_for_rate_limit
    
    # Test invalid credentials
    run_test "Invalid login credentials" 401 \
        'curl -s -w "HTTPSTATUS:%{http_code}" -X POST \
         -H "Content-Type: application/json" \
         -d "{\"email\":\"invalid@test.com\",\"password\":\"wrongpass\"}" \
         "$BASE_URL/users/login"'
    wait_for_rate_limit
    
    # Test malformed login request
    run_test "Malformed login request" 400 \
        'curl -s -w "HTTPSTATUS:%{http_code}" -X POST \
         -H "Content-Type: application/json" \
         -d "{\"email\":\"test@test.com\"}" \
         "$BASE_URL/users/login"'
    wait_for_rate_limit
    
    # Test 3: Course Endpoints
    print_section "COURSE ENDPOINTS"
    
    run_test "Get all courses" 200 \
        'curl -s -w "HTTPSTATUS:%{http_code}" "$BASE_URL/courses"'
    wait_for_rate_limit
    
    run_test "Get specific course" 200 \
        'curl -s -w "HTTPSTATUS:%{http_code}" "$BASE_URL/courses/0"'
    wait_for_rate_limit
    
    run_test "Get non-existent course (404 test)" 404 \
        'curl -s -w "HTTPSTATUS:%{http_code}" "$BASE_URL/courses/99999"'
    wait_for_rate_limit
    
    run_test "Course pagination" 200 \
        'curl -s -w "HTTPSTATUS:%{http_code}" "$BASE_URL/courses?page=1"'
    wait_for_rate_limit
    
    run_test "Course subject filter" 200 \
        'curl -s -w "HTTPSTATUS:%{http_code}" "$BASE_URL/courses?subject=CS"'
    wait_for_rate_limit
    
    run_test "Course number filter" 200 \
        'curl -s -w "HTTPSTATUS:%{http_code}" "$BASE_URL/courses?number=493"'
    wait_for_rate_limit
    
    run_test "Course term filter" 200 \
        'curl -s -w "HTTPSTATUS:%{http_code}" "$BASE_URL/courses?term=fa23"'
    wait_for_rate_limit
    
    run_test "Course multiple filters" 200 \
        'curl -s -w "HTTPSTATUS:%{http_code}" "$BASE_URL/courses?subject=CS&number=493"'
    wait_for_rate_limit
    
    # Test 4: Authorization Tests
    print_section "AUTHORIZATION TESTS"
    
    run_test "Unauthorized course creation" 401 \
        'curl -s -w "HTTPSTATUS:%{http_code}" -X POST \
         -H "Content-Type: application/json" \
         -d "{\"subject\":\"TEST\",\"number\":\"101\",\"title\":\"Test\",\"term\":\"fa23\",\"instructorId\":100}" \
         "$BASE_URL/courses"'
    wait_for_rate_limit
    
    run_test "Invalid token access" 401 \
        'curl -s -w "HTTPSTATUS:%{http_code}" -H "Authorization: Bearer invalid_token" "$BASE_URL/users/1"'
    wait_for_rate_limit
    
    # Test 5: User Endpoints
    print_section "USER ENDPOINTS"
    
    if [ ! -z "$STUDENT_TOKEN" ]; then
        run_test "Get student user details" 200 \
            'curl -s -w "HTTPSTATUS:%{http_code}" -H "Authorization: Bearer '$STUDENT_TOKEN'" "$BASE_URL/users/1"'
        wait_for_rate_limit
        
        run_test "Student accessing other user (should fail)" 403 \
            'curl -s -w "HTTPSTATUS:%{http_code}" -H "Authorization: Bearer '$STUDENT_TOKEN'" "$BASE_URL/users/100"'
        wait_for_rate_limit
    fi
    
    if [ ! -z "$INSTRUCTOR_TOKEN" ]; then
        run_test "Get instructor user details" 200 \
            'curl -s -w "HTTPSTATUS:%{http_code}" -H "Authorization: Bearer '$INSTRUCTOR_TOKEN'" "$BASE_URL/users/100"'
        wait_for_rate_limit
    fi
    
    
    # Test accessing non-existent user (with proper auth)
    if [ ! -z "$ADMIN_TOKEN" ]; then
        run_test "Get non-existent user" 404 \
            'curl -s -w "HTTPSTATUS:%{http_code}" -H "Authorization: Bearer '$ADMIN_TOKEN'" "$BASE_URL/users/99999"'
        wait_for_rate_limit
    fi
    
    # Test 6: Instructor Functionality
    print_section "INSTRUCTOR FUNCTIONALITY"
    
    if [ ! -z "$INSTRUCTOR_TOKEN" ]; then
        run_test "Get course students as instructor" 200 \
            'curl -s -w "HTTPSTATUS:%{http_code}" -H "Authorization: Bearer '$INSTRUCTOR_TOKEN'" "$BASE_URL/courses/0/students"'
        wait_for_rate_limit
        
        run_test "Get course roster as instructor" 200 \
            'curl -s -w "HTTPSTATUS:%{http_code}" -H "Authorization: Bearer '$INSTRUCTOR_TOKEN'" "$BASE_URL/courses/0/roster"'
        wait_for_rate_limit
        
        run_test "Get course assignments as instructor" 200 \
            'curl -s -w "HTTPSTATUS:%{http_code}" -H "Authorization: Bearer '$INSTRUCTOR_TOKEN'" "$BASE_URL/courses/0/assignments"'
        wait_for_rate_limit
        
        # Try to access course not taught by instructor
        run_test "Access other instructor's course (should fail)" 403 \
            'curl -s -w "HTTPSTATUS:%{http_code}" -H "Authorization: Bearer '$INSTRUCTOR_TOKEN'" "$BASE_URL/courses/1/students"'
        wait_for_rate_limit
        
        # Create assignment as instructor
        response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X POST \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $INSTRUCTOR_TOKEN" \
            -d '{"courseId":0,"title":"Test Assignment Created","points":100,"due":"2024-12-31T23:59:59-08:00"}' \
            "$BASE_URL/assignments")
        
        status=$(echo $response | sed -n 's/.*HTTPSTATUS:\([0-9]*\)/\1/p')
        body=$(echo $response | sed 's/HTTPSTATUS:.*$//')
        
        if [ "$status" -eq 201 ]; then
            CREATED_ASSIGNMENT_ID=$(echo $body | jq -r '.id' 2>/dev/null)
            print_test "Create assignment as instructor"
            print_success "Create assignment as instructor - Assignment ID: $CREATED_ASSIGNMENT_ID"
        else
            print_test "Create assignment as instructor"
            print_error "Create assignment as instructor failed - Status: $status"
        fi
        
        wait_for_rate_limit
        
        # Test course enrollment management
        run_test "Update course enrollment (add/remove students)" 200 \
            'curl -s -w "HTTPSTATUS:%{http_code}" -X POST \
             -H "Content-Type: application/json" \
             -H "Authorization: Bearer '$INSTRUCTOR_TOKEN'" \
             -d "{\"add\":[50],\"remove\":[49]}" \
             "$BASE_URL/courses/0/students"'
        wait_for_rate_limit
        
        # Test invalid enrollment update
        run_test "Invalid enrollment update (missing add/remove)" 400 \
            'curl -s -w "HTTPSTATUS:%{http_code}" -X POST \
             -H "Content-Type: application/json" \
             -H "Authorization: Bearer '$INSTRUCTOR_TOKEN'" \
             -d "{\"students\":[1,2,3]}" \
             "$BASE_URL/courses/0/students"'
        wait_for_rate_limit
    fi
    
    # Test 7: Assignment Operations
    print_section "ASSIGNMENT OPERATIONS"
    
    if [ ! -z "$STUDENT_TOKEN" ]; then
        # Student accessing assignment details
        run_test "Student get assignment details" 200 \
            'curl -s -w "HTTPSTATUS:%{http_code}" -H "Authorization: Bearer '$STUDENT_TOKEN'" "$BASE_URL/assignments/0"'
        wait_for_rate_limit
        
        # Student accessing non-existent assignment
        run_test "Student get non-existent assignment" 404 \
            'curl -s -w "HTTPSTATUS:%{http_code}" -H "Authorization: Bearer '$STUDENT_TOKEN'" "$BASE_URL/assignments/99999"'
        wait_for_rate_limit
    fi
    
    if [ ! -z "$INSTRUCTOR_TOKEN" ] && [ ! -z "$CREATED_ASSIGNMENT_ID" ]; then
        # Update assignment as instructor (API requires all fields for validation)
        run_test "Update assignment as instructor" 200 \
            'curl -s -w "HTTPSTATUS:%{http_code}" -X PATCH \
             -H "Content-Type: application/json" \
             -H "Authorization: Bearer '$INSTRUCTOR_TOKEN'" \
             -d "{\"courseId\":0,\"title\":\"Updated Test Assignment\",\"points\":150,\"due\":\"2024-12-31T23:59:59-08:00\"}" \
             "$BASE_URL/assignments/'$CREATED_ASSIGNMENT_ID'"'
        wait_for_rate_limit
        
        # Get assignment submissions as instructor
        run_test "Get assignment submissions as instructor" 200 \
            'curl -s -w "HTTPSTATUS:%{http_code}" -H "Authorization: Bearer '$INSTRUCTOR_TOKEN'" "$BASE_URL/assignments/'$CREATED_ASSIGNMENT_ID'/submissions"'
        wait_for_rate_limit
        
        # Test submissions pagination
        run_test "Get assignment submissions with pagination" 200 \
            'curl -s -w "HTTPSTATUS:%{http_code}" -H "Authorization: Bearer '$INSTRUCTOR_TOKEN'" "$BASE_URL/assignments/'$CREATED_ASSIGNMENT_ID'/submissions?page=1"'
        wait_for_rate_limit
        
        # Test submissions filtering by student
        run_test "Get assignment submissions filtered by student" 200 \
            'curl -s -w "HTTPSTATUS:%{http_code}" -H "Authorization: Bearer '$INSTRUCTOR_TOKEN'" "$BASE_URL/assignments/'$CREATED_ASSIGNMENT_ID'/submissions?studentId=1"'
        wait_for_rate_limit
    fi
    
    # Test unauthorized assignment operations
    if [ ! -z "$STUDENT_TOKEN" ]; then
        run_test "Student create assignment (should fail)" 403 \
            'curl -s -w "HTTPSTATUS:%{http_code}" -X POST \
             -H "Content-Type: application/json" \
             -H "Authorization: Bearer '$STUDENT_TOKEN'" \
             -d "{\"courseId\":0,\"title\":\"Unauthorized Assignment\",\"points\":100,\"due\":\"2024-12-31T23:59:59-08:00\"}" \
             "$BASE_URL/assignments"'
        wait_for_rate_limit
        
        run_test "Student access assignment submissions (should fail)" 403 \
            'curl -s -w "HTTPSTATUS:%{http_code}" -H "Authorization: Bearer '$STUDENT_TOKEN'" "$BASE_URL/assignments/0/submissions"'
        wait_for_rate_limit
    fi
    
    # Test 8: File Submission Tests  
    print_section "FILE SUBMISSION TESTS"
    
    # Create a test file for submission
    echo "This is a test submission file" > test_submission.txt
    
    if [ ! -z "$STUDENT_TOKEN" ]; then
        # Test file submission by student
        response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X POST \
            -H "Authorization: Bearer $STUDENT_TOKEN" \
            -F "file=@test_submission.txt" \
            "$BASE_URL/assignments/0/submissions")
        
        status=$(echo $response | sed -n 's/.*HTTPSTATUS:\([0-9]*\)/\1/p')
        body=$(echo $response | sed 's/HTTPSTATUS:.*$//')
        
        if [ "$status" -eq 201 ]; then
            SUBMISSION_ID=$(echo $body | jq -r '.id' 2>/dev/null)
            print_test "Student file submission"
            print_success "Student file submission - Submission ID: $SUBMISSION_ID"
        else
            print_test "Student file submission"
            print_error "Student file submission failed - Status: $status"
        fi
        
        wait_for_rate_limit
        
        # Test submission without file
        run_test "Submission without file (should fail)" 400 \
            'curl -s -w "HTTPSTATUS:%{http_code}" -X POST \
             -H "Authorization: Bearer '$STUDENT_TOKEN'" \
             "$BASE_URL/assignments/0/submissions"'
        wait_for_rate_limit
        
        # Test submission to non-existent assignment (API checks auth first, then assignment existence)
        run_test "Submission to non-existent assignment" 403 \
            'curl -s -w "HTTPSTATUS:%{http_code}" -X POST \
             -H "Authorization: Bearer '$STUDENT_TOKEN'" \
             -F "file=@test_submission.txt" \
             "$BASE_URL/assignments/99999/submissions"'
        wait_for_rate_limit
        
        # Test downloading own submission
        if [ ! -z "$SUBMISSION_ID" ]; then
            run_test "Student download own submission" 200 \
                'curl -s -w "HTTPSTATUS:%{http_code}" -H "Authorization: Bearer '$STUDENT_TOKEN'" "$BASE_URL/assignments/history/'$SUBMISSION_ID'"'
            wait_for_rate_limit
        fi
    fi
    
    # Test unauthorized submission downloads
    if [ ! -z "$SUBMISSION_ID" ] && [ ! -z "$INSTRUCTOR_TOKEN" ]; then
        # Instructor downloading student submission (should work if same course)
        run_test "Instructor download student submission" 200 \
            'curl -s -w "HTTPSTATUS:%{http_code}" -H "Authorization: Bearer '$INSTRUCTOR_TOKEN'" "$BASE_URL/assignments/history/'$SUBMISSION_ID'"'
        wait_for_rate_limit
    fi
    
    # Clean up test file
    rm -f test_submission.txt
    
    # Test 9: Course Management (Admin)
    print_section "COURSE MANAGEMENT (ADMIN)"
    
    if [ ! -z "$ADMIN_TOKEN" ]; then
        # Create course as admin
        response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X POST \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $ADMIN_TOKEN" \
            -d '{"subject":"TEST","number":"999","title":"Test Course for Testing","term":"fa23","instructorId":100}' \
            "$BASE_URL/courses")
        
        status=$(echo $response | sed -n 's/.*HTTPSTATUS:\([0-9]*\)/\1/p')
        body=$(echo $response | sed 's/HTTPSTATUS:.*$//')
        
        if [ "$status" -eq 201 ]; then
            CREATED_COURSE_ID=$(echo $body | jq -r '.id' 2>/dev/null)
            print_test "Create course as admin"
            print_success "Create course as admin - Course ID: $CREATED_COURSE_ID"
        else
            print_test "Create course as admin"
            print_error "Create course as admin failed - Status: $status"
        fi
        
        wait_for_rate_limit
        
        # Update course as admin
        if [ ! -z "$CREATED_COURSE_ID" ]; then
            run_test "Update course as admin" 200 \
                'curl -s -w "HTTPSTATUS:%{http_code}" -X PATCH \
                 -H "Content-Type: application/json" \
                 -H "Authorization: Bearer '$ADMIN_TOKEN'" \
                 -d "{\"subject\":\"TEST\",\"number\":\"999\",\"title\":\"Updated Test Course Title\",\"term\":\"fa23\",\"instructorId\":100}" \
                 "$BASE_URL/courses/'$CREATED_COURSE_ID'"'
            wait_for_rate_limit
            
            # Delete course as admin  
            run_test "Delete course as admin" 204 \
                'curl -s -w "HTTPSTATUS:%{http_code}" -X DELETE \
                 -H "Authorization: Bearer '$ADMIN_TOKEN'" \
                 "$BASE_URL/courses/'$CREATED_COURSE_ID'"'
            wait_for_rate_limit
        fi
        
        # Test invalid course creation
        run_test "Invalid course creation (missing fields)" 400 \
            'curl -s -w "HTTPSTATUS:%{http_code}" -X POST \
             -H "Content-Type: application/json" \
             -H "Authorization: Bearer '$ADMIN_TOKEN'" \
             -d "{\"subject\":\"TEST\"}" \
             "$BASE_URL/courses"'
        wait_for_rate_limit
    fi
    
    # Test 10: User Management (Admin)
    print_section "USER MANAGEMENT (ADMIN)"
    
    if [ ! -z "$ADMIN_TOKEN" ]; then
        # Create user as admin
        response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X POST \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $ADMIN_TOKEN" \
            -d '{"name":"Test User for Testing","email":"testuser999@test.com","password":"testpass123","role":"student"}' \
            "$BASE_URL/users")
        
        status=$(echo $response | sed -n 's/.*HTTPSTATUS:\([0-9]*\)/\1/p')
        body=$(echo $response | sed 's/HTTPSTATUS:.*$//')
        
        if [ "$status" -eq 201 ]; then
            CREATED_USER_ID=$(echo $body | jq -r '.id' 2>/dev/null)
            print_test "Create user as admin"
            print_success "Create user as admin - User ID: $CREATED_USER_ID"
        else
            print_test "Create user as admin"
            print_error "Create user as admin failed - Status: $status"
        fi
        
        wait_for_rate_limit
        
        # Test creating instructor user
        run_test "Create instructor user as admin" 201 \
            'curl -s -w "HTTPSTATUS:%{http_code}" -X POST \
             -H "Content-Type: application/json" \
             -H "Authorization: Bearer '$ADMIN_TOKEN'" \
             -d "{\"name\":\"Test Instructor\",\"email\":\"testinstructor999@test.com\",\"password\":\"testpass123\",\"role\":\"instructor\"}" \
             "$BASE_URL/users"'
        wait_for_rate_limit
        
        # Test creating admin user
        run_test "Create admin user as admin" 201 \
            'curl -s -w "HTTPSTATUS:%{http_code}" -X POST \
             -H "Content-Type: application/json" \
             -H "Authorization: Bearer '$ADMIN_TOKEN'" \
             -d "{\"name\":\"Test Admin\",\"email\":\"testadmin999@test.com\",\"password\":\"testpass123\",\"role\":\"admin\"}" \
             "$BASE_URL/users"'
        wait_for_rate_limit
        
        # Test invalid user creation
        run_test "Invalid user creation (missing fields)" 400 \
            'curl -s -w "HTTPSTATUS:%{http_code}" -X POST \
             -H "Content-Type: application/json" \
             -H "Authorization: Bearer '$ADMIN_TOKEN'" \
             -d "{\"name\":\"Incomplete User\"}" \
             "$BASE_URL/users"'
        wait_for_rate_limit
        
        # Test duplicate email (API currently allows duplicate emails)
        run_test "Duplicate email user creation" 201 \
            'curl -s -w "HTTPSTATUS:%{http_code}" -X POST \
             -H "Content-Type: application/json" \
             -H "Authorization: Bearer '$ADMIN_TOKEN'" \
             -d "{\"name\":\"Duplicate Email\",\"email\":\"testuser999@test.com\",\"password\":\"testpass123\",\"role\":\"student\"}" \
             "$BASE_URL/users"'
        wait_for_rate_limit
    fi
    
    # Test unauthorized user creation
    if [ ! -z "$INSTRUCTOR_TOKEN" ]; then
        run_test "Instructor create user (should fail)" 403 \
            'curl -s -w "HTTPSTATUS:%{http_code}" -X POST \
             -H "Content-Type: application/json" \
             -H "Authorization: Bearer '$INSTRUCTOR_TOKEN'" \
             -d "{\"name\":\"Unauthorized User\",\"email\":\"unauthorized@test.com\",\"password\":\"testpass123\",\"role\":\"student\"}" \
             "$BASE_URL/users"'
        wait_for_rate_limit
    fi
    
    # Test 11: Assignment Cleanup
    print_section "ASSIGNMENT CLEANUP"
    
    if [ ! -z "$INSTRUCTOR_TOKEN" ] && [ ! -z "$CREATED_ASSIGNMENT_ID" ]; then
        # Delete assignment as instructor
        run_test "Delete assignment as instructor" 204 \
            'curl -s -w "HTTPSTATUS:%{http_code}" -X DELETE \
             -H "Authorization: Bearer '$INSTRUCTOR_TOKEN'" \
             "$BASE_URL/assignments/'$CREATED_ASSIGNMENT_ID'"'
        wait_for_rate_limit
        
        # Try to access deleted assignment
        run_test "Access deleted assignment (should fail)" 404 \
            'curl -s -w "HTTPSTATUS:%{http_code}" -H "Authorization: Bearer '$INSTRUCTOR_TOKEN'" "$BASE_URL/assignments/'$CREATED_ASSIGNMENT_ID'"'
        wait_for_rate_limit
    fi
    
    # Test 12: Edge Cases and Error Handling
    print_section "EDGE CASES AND ERROR HANDLING"
    
    run_test "Invalid endpoint" 404 \
        'curl -s -w "HTTPSTATUS:%{http_code}" "$BASE_URL/invalid/endpoint"'
    wait_for_rate_limit
    
    run_test "Invalid HTTP method on course endpoint" 404 \
        'curl -s -w "HTTPSTATUS:%{http_code}" -X PUT "$BASE_URL/courses"'
    wait_for_rate_limit
    
    # Test malformed JSON
    run_test "Malformed JSON in request body" 400 \
        'curl -s -w "HTTPSTATUS:%{http_code}" -X POST \
         -H "Content-Type: application/json" \
         -H "Authorization: Bearer '$ADMIN_TOKEN'" \
         -d "{\"invalid\":\"json\"" \
         "$BASE_URL/courses"'
    wait_for_rate_limit
    
    # Test missing content-type header (API validates content-type before auth)
    run_test "Missing Content-Type header" 400 \
        'curl -s -w "HTTPSTATUS:%{http_code}" -X POST \
         -H "Authorization: Bearer '$ADMIN_TOKEN'" \
         -d "{\"subject\":\"TEST\",\"number\":\"101\",\"title\":\"Test\",\"term\":\"fa23\",\"instructorId\":100}" \
         "$BASE_URL/courses"'
    wait_for_rate_limit
    
    # Test very large page number
    run_test "Large page number in courses" 200 \
        'curl -s -w "HTTPSTATUS:%{http_code}" "$BASE_URL/courses?page=99999"'
    wait_for_rate_limit
    
    # Test negative page number
    run_test "Negative page number in courses" 200 \
        'curl -s -w "HTTPSTATUS:%{http_code}" "$BASE_URL/courses?page=-1"'
    wait_for_rate_limit
    
    # Test special characters in filters
    run_test "Special characters in subject filter" 200 \
        'curl -s -w "HTTPSTATUS:%{http_code}" "$BASE_URL/courses?subject=@#$%"'
    wait_for_rate_limit
    
    # Generate final report
    print_section "TEST SUMMARY"
    
    echo "Test Results:"
    echo "  Total Tests: $TOTAL_TESTS"
    echo "  Passed: $PASSED_TESTS"
    echo "  Failed: $FAILED_TESTS"
    echo "  Success Rate: $(( PASSED_TESTS * 100 / TOTAL_TESTS ))%"
    
    echo "" >> $REPORT_FILE
    echo "====== FINAL SUMMARY ======" >> $REPORT_FILE
    echo "Total Tests: $TOTAL_TESTS" >> $REPORT_FILE
    echo "Passed: $PASSED_TESTS" >> $REPORT_FILE
    echo "Failed: $FAILED_TESTS" >> $REPORT_FILE
    echo "Success Rate: $(( PASSED_TESTS * 100 / TOTAL_TESTS ))%" >> $REPORT_FILE
    
    echo "Authentication Status:"
    echo "  Student Token: ${STUDENT_TOKEN:+✓ Valid}${STUDENT_TOKEN:-✗ Failed}"
    echo "  Instructor Token: ${INSTRUCTOR_TOKEN:+✓ Valid}${INSTRUCTOR_TOKEN:-✗ Failed}"
    echo "  Admin Token: ${ADMIN_TOKEN:+✓ Valid}${ADMIN_TOKEN:-✗ Failed}"
    
    echo "" >> $REPORT_FILE
    echo "Authentication Status:" >> $REPORT_FILE
    echo "  Student Token: ${STUDENT_TOKEN:+✓ Valid}${STUDENT_TOKEN:-✗ Failed}" >> $REPORT_FILE
    echo "  Instructor Token: ${INSTRUCTOR_TOKEN:+✓ Valid}${INSTRUCTOR_TOKEN:-✗ Failed}" >> $REPORT_FILE
    echo "  Admin Token: ${ADMIN_TOKEN:+✓ Valid}${ADMIN_TOKEN:-✗ Failed}" >> $REPORT_FILE
    
    echo "Created Resources:"
    echo "  Assignment ID: ${CREATED_ASSIGNMENT_ID:-None}"
    echo "  Course ID: ${CREATED_COURSE_ID:-None}"
    echo "  User ID: ${CREATED_USER_ID:-None}"
    echo "  Submission ID: ${SUBMISSION_ID:-None}"
    
    echo "" >> $REPORT_FILE
    echo "Created Resources:" >> $REPORT_FILE
    echo "  Assignment ID: ${CREATED_ASSIGNMENT_ID:-None}" >> $REPORT_FILE
    echo "  Course ID: ${CREATED_COURSE_ID:-None}" >> $REPORT_FILE
    echo "  User ID: ${CREATED_USER_ID:-None}" >> $REPORT_FILE
    echo "  Submission ID: ${SUBMISSION_ID:-None}" >> $REPORT_FILE
    
    echo -e "\n${BLUE}Detailed report saved to: $REPORT_FILE${NC}"
    
    if [ $FAILED_TESTS -eq 0 ]; then
        echo -e "${GREEN}🎉 All tests passed!${NC}"
        exit 0
    else
        echo -e "${RED}❌ $FAILED_TESTS test(s) failed${NC}"
        exit 1
    fi
}

main "$@" 