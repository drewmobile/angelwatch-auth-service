#!/bin/bash

# AngelWatch Auth Service API Gateway Integration Script
set -e

echo "🚀 Setting up API Gateway integration for Auth Service..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Configuration
API_GATEWAY_ID="xa89fa9t75"
LAMBDA_FUNCTION_NAME="angelwatch-production-auth-service"
LAMBDA_FUNCTION_ARN="arn:aws:lambda:us-east-1:227830417626:function:angelwatch-production-auth-service"
REGION="us-east-1"

# Check AWS credentials
print_status "Checking AWS credentials..."
if ! aws sts get-caller-identity --profile angelwatch &> /dev/null; then
    print_error "AWS credentials not configured for profile 'angelwatch'"
    exit 1
fi

print_success "AWS credentials verified"

# Create auth resource
print_status "Creating /auth resource..."
AUTH_RESOURCE_ID=$(aws apigateway create-resource \
    --rest-api-id $API_GATEWAY_ID \
    --parent-id $(aws apigateway get-resources --rest-api-id $API_GATEWAY_ID --profile angelwatch --query 'items[?path==`/`].id' --output text) \
    --path-part auth \
    --profile angelwatch \
    --query 'id' \
    --output text)

print_success "Created /auth resource: $AUTH_RESOURCE_ID"

# Function to create endpoint
create_endpoint() {
    local method=$1
    local path_part=$2
    local resource_path=$3
    
    print_status "Creating $method $resource_path endpoint..."
    
    # Create resource if it doesn't exist
    local resource_id
    if [ "$path_part" = "auth" ]; then
        resource_id=$AUTH_RESOURCE_ID
    else
        # Check if resource already exists
        resource_id=$(aws apigateway get-resources \
            --rest-api-id $API_GATEWAY_ID \
            --profile angelwatch \
            --query "items[?pathPart=='$path_part' && parentId=='$AUTH_RESOURCE_ID'].id" \
            --output text)
        
        if [ -z "$resource_id" ] || [ "$resource_id" = "None" ]; then
            resource_id=$(aws apigateway create-resource \
                --rest-api-id $API_GATEWAY_ID \
                --parent-id $AUTH_RESOURCE_ID \
                --path-part $path_part \
                --profile angelwatch \
                --query 'id' \
                --output text)
        fi
    fi
    
    # Create method
    aws apigateway put-method \
        --rest-api-id $API_GATEWAY_ID \
        --resource-id $resource_id \
        --http-method $method \
        --authorization-type NONE \
        --profile angelwatch > /dev/null
    
    # Create integration
    aws apigateway put-integration \
        --rest-api-id $API_GATEWAY_ID \
        --resource-id $resource_id \
        --http-method $method \
        --type AWS_PROXY \
        --integration-http-method POST \
        --uri "arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/$LAMBDA_FUNCTION_ARN/invocations" \
        --profile angelwatch > /dev/null
    
    print_success "Created $method $resource_path endpoint"
}

# Create all auth endpoints
print_status "Creating authentication endpoints..."

# OPTIONS for CORS
create_endpoint "OPTIONS" "auth" "/auth"

# Registration
create_endpoint "POST" "register" "/auth/register"

# Login
create_endpoint "POST" "login" "/auth/login"

# Profile management
create_endpoint "GET" "profile" "/auth/profile"
create_endpoint "PUT" "profile" "/auth/profile"

# Password management
create_endpoint "POST" "change-password" "/auth/change-password"
create_endpoint "POST" "forgot-password" "/auth/forgot-password"
create_endpoint "POST" "confirm-password-reset" "/auth/confirm-password-reset"

# Token management
create_endpoint "POST" "refresh-token" "/auth/refresh-token"

# Account management
create_endpoint "POST" "signout" "/auth/signout"
create_endpoint "DELETE" "account" "/auth/account"

print_success "All authentication endpoints created!"

# Deploy API Gateway
print_status "Deploying API Gateway..."
aws apigateway create-deployment \
    --rest-api-id $API_GATEWAY_ID \
    --stage-name production \
    --profile angelwatch > /dev/null

print_success "API Gateway deployed!"

# Test the endpoints
print_status "Testing API Gateway endpoints..."

API_URL="https://xa89fa9t75.execute-api.us-east-1.amazonaws.com/production"

# Test CORS
print_status "Testing CORS..."
curl -s -X OPTIONS "$API_URL/auth/test" \
    -H "Origin: http://localhost:3000" \
    -H "Access-Control-Request-Method: POST" \
    -H "Access-Control-Request-Headers: Content-Type" \
    -w "Status: %{http_code}\n" | head -1

# Test registration endpoint
print_status "Testing registration endpoint..."
curl -s -X POST "$API_URL/auth/register" \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"password123","firstName":"John","lastName":"Doe","role":"student"}' \
    -w "Status: %{http_code}\n" | head -1

echo ""
print_success "🎉 API Gateway integration complete!"
echo ""
print_status "API Endpoints:"
echo "- Registration: POST $API_URL/auth/register"
echo "- Login: POST $API_URL/auth/login"
echo "- Profile: GET/PUT $API_URL/auth/profile"
echo "- Password: POST $API_URL/auth/change-password"
echo "- Forgot Password: POST $API_URL/auth/forgot-password"
echo "- Confirm Reset: POST $API_URL/auth/confirm-password-reset"
echo "- Refresh Token: POST $API_URL/auth/refresh-token"
echo "- Sign Out: POST $API_URL/auth/signout"
echo "- Delete Account: DELETE $API_URL/auth/account"
echo ""
print_status "Next steps:"
echo "1. Test all endpoints with proper data"
echo "2. Configure frontend to use new API"
echo "3. Set up DynamoDB indexes for better performance"
