# Terraform configuration for AngelWatch Auth Service Lambda
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.0"
    }
  }
}

provider "aws" {
  region  = "us-east-1"
  profile = "angelwatch"
}

# Data sources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# Local variables
locals {
  project_name = "angelwatch"
  environment  = "production"
  service_name = "auth-service"
  
  common_tags = {
    Project     = local.project_name
    Environment = local.environment
    Service     = local.service_name
    ManagedBy   = "terraform"
  }
}

# Create deployment package
data "archive_file" "lambda_zip" {
  type        = "zip"
  source_dir  = "../../dist"
  output_path = "lambda-deployment.zip"
}

# Lambda function
resource "aws_lambda_function" "auth_service" {
  filename         = data.archive_file.lambda_zip.output_path
  function_name    = "${local.project_name}-${local.environment}-${local.service_name}"
  role            = aws_iam_role.lambda_role.arn
  handler         = "index.handler"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  runtime         = "nodejs18.x"
  timeout         = 30
  memory_size     = 256

  environment {
    variables = {
      NODE_ENV                = "production"
      COGNITO_USER_POOL_ID   = var.cognito_user_pool_id
      COGNITO_CLIENT_ID      = var.cognito_client_id
      COGNITO_DOMAIN         = var.cognito_domain
      DYNAMODB_USERS_TABLE   = var.dynamodb_users_table
      JWT_SECRET             = var.jwt_secret
      SERVICE_NAME           = local.service_name
      SERVICE_VERSION        = "1.0.0"
      LOG_LEVEL              = "info"
    }
  }

  tags = local.common_tags
}

# IAM role for Lambda
resource "aws_iam_role" "lambda_role" {
  name = "${local.project_name}-${local.environment}-${local.service_name}-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

# IAM policy for Lambda
resource "aws_iam_role_policy" "lambda_policy" {
  name = "${local.project_name}-${local.environment}-${local.service_name}-policy"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "cognito-idp:AdminCreateUser",
          "cognito-idp:AdminDeleteUser",
          "cognito-idp:AdminGetUser",
          "cognito-idp:AdminUpdateUserAttributes",
          "cognito-idp:AdminSetUserPassword",
          "cognito-idp:InitiateAuth",
          "cognito-idp:RespondToAuthChallenge",
          "cognito-idp:ForgotPassword",
          "cognito-idp:ConfirmForgotPassword",
          "cognito-idp:ChangePassword",
          "cognito-idp:GlobalSignOut",
          "cognito-idp:ListUsers"
        ]
        Resource = [
          "arn:aws:cognito-idp:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:userpool/${var.cognito_user_pool_id}"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = [
          "arn:aws:dynamodb:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:table/${var.dynamodb_users_table}",
          "arn:aws:dynamodb:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:table/${var.dynamodb_users_table}/index/*"
        ]
      }
    ]
  })
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "lambda_logs" {
  name              = "/aws/lambda/${aws_lambda_function.auth_service.function_name}"
  retention_in_days = 14

  tags = local.common_tags
}

# Lambda permission for API Gateway
resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.auth_service.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${var.api_gateway_execution_arn}/*/*"
}

# Outputs are defined in outputs.tf
