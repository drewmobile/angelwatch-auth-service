# Variables for AngelWatch Auth Service Lambda

variable "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  type        = string
}

variable "cognito_client_id" {
  description = "Cognito Client ID"
  type        = string
}

variable "cognito_domain" {
  description = "Cognito Domain"
  type        = string
}

variable "dynamodb_users_table" {
  description = "DynamoDB Users Table Name"
  type        = string
}

variable "jwt_secret" {
  description = "JWT Secret Key"
  type        = string
  sensitive   = true
}

variable "api_gateway_execution_arn" {
  description = "API Gateway Execution ARN"
  type        = string
}
