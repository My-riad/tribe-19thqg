# Backend configuration for Tribe platform infrastructure
# S3 backend for remote state storage with DynamoDB for state locking

terraform {
  # Specifies the required Terraform version
  required_version = ">= 1.0.0"

  backend "s3" {
    # The state bucket should be created manually before applying this configuration
    bucket = "tribe-terraform-state"
    key    = "terraform/tribe/infrastructure.tfstate"
    region = "us-east-1"
    
    # State is encrypted at rest and access is controlled via IAM policies
    encrypt = true
    acl     = "private"
    
    # DynamoDB table for state locking to prevent concurrent modifications
    dynamodb_table = "tribe-terraform-locks"
    
    # When using workspaces, Terraform will store state at:
    # env:/WORKSPACE_NAME/terraform/tribe/infrastructure.tfstate
  }
}