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
        print_success "Student authentication - Token obtained"
    else
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
        print_success "Instructor authentication - Token obtained"
    else
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
        print_success "Admin authentication - Token obtained"
    else
        print_error "Admin authentication failed - Status: $status"
    fi
    
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
    
    # Test 4: Authorization Tests
    print_section "AUTHORIZATION TESTS"
    
    run_test "Unauthorized course creation" 401 \
        'curl -s -w "HTTPSTATUS:%{http_code}" -X POST \
         -H "Content-Type: application/json" \
         -d "{\"subject\":\"TEST\",\"number\":\"101\",\"title\":\"Test\",\"term\":\"fa23\",\"instructorId\":100}" \
         "$BASE_URL/courses"'
    wait_for_rate_limit
    
    # Test 5: User Endpoints (if tokens available)
    print_section "USER ENDPOINTS"
    
    if [ ! -z "$STUDENT_TOKEN" ]; then
        run_test "Get student user details" 200 \
            'curl -s -w "HTTPSTATUS:%{http_code}" -H "Authorization: Bearer '$STUDENT_TOKEN'" "$BASE_URL/users/1"'
        wait_for_rate_limit
        
        run_test "Student accessing other user (should fail)" 403 \
            'curl -s -w "HTTPSTATUS:%{http_code}" -H "Authorization: Bearer '$STUDENT_TOKEN'" "$BASE_URL/users/100"'
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
        
        run_test "Create assignment as instructor" 201 \
            'curl -s -w "HTTPSTATUS:%{http_code}" -X POST \
             -H "Content-Type: application/json" \
             -H "Authorization: Bearer '$INSTRUCTOR_TOKEN'" \
             -d "{\"courseId\":0,\"title\":\"Test Assignment\",\"points\":100,\"due\":\"2024-12-31T23:59:59-08:00\"}" \
             "$BASE_URL/assignments"'
        wait_for_rate_limit
    fi
    
    # Test 7: Admin Functionality
    print_section "ADMIN FUNCTIONALITY"
    
    if [ ! -z "$ADMIN_TOKEN" ]; then
        run_test "Create user as admin" 201 \
            'curl -s -w "HTTPSTATUS:%{http_code}" -X POST \
             -H "Content-Type: application/json" \
             -H "Authorization: Bearer '$ADMIN_TOKEN'" \
             -d "{\"name\":\"Test User\",\"email\":\"testuser@test.com\",\"password\":\"testpass\",\"role\":\"student\"}" \
             "$BASE_URL/users"'
        wait_for_rate_limit
        
        run_test "Create course as admin" 201 \
            'curl -s -w "HTTPSTATUS:%{http_code}" -X POST \
             -H "Content-Type: application/json" \
             -H "Authorization: Bearer '$ADMIN_TOKEN'" \
             -d "{\"subject\":\"TEST\",\"number\":\"101\",\"title\":\"Test Course\",\"term\":\"fa23\",\"instructorId\":100}" \
             "$BASE_URL/courses"'
        wait_for_rate_limit
    fi
    
    # Test 8: Error Handling
    print_section "ERROR HANDLING"
    
    run_test "Invalid endpoint" 404 \
        'curl -s -w "HTTPSTATUS:%{http_code}" "$BASE_URL/invalid/endpoint"'
    wait_for_rate_limit
    
    run_test "Malformed request body" 400 \
        'curl -s -w "HTTPSTATUS:%{http_code}" -X POST \
         -H "Content-Type: application/json" \
         -H "Authorization: Bearer '$ADMIN_TOKEN'" \
         -d "{\"invalid\":\"data\"}" \
         "$BASE_URL/courses"'
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