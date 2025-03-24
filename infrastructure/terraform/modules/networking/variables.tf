# Variables for networking module
# Defines configuration parameters for VPC, subnets, and networking components for the Tribe platform

# General variables
variable "environment" {
  type        = string
  description = "Deployment environment (development, staging, production)"
  
  validation {
    condition     = contains(["development", "staging", "production"], var.environment)
    error_message = "Environment must be one of: development, staging, production."
  }
}

variable "region" {
  type        = string
  description = "AWS region for network resources"
}

# VPC and subnet variables
variable "vpc_cidr" {
  type        = string
  description = "CIDR block for the VPC"
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  type        = list(string)
  description = "List of availability zones to use in the region"
}

variable "private_subnet_cidrs" {
  type        = list(string)
  description = "CIDR blocks for private subnets (one per availability zone)"
}

variable "public_subnet_cidrs" {
  type        = list(string)
  description = "CIDR blocks for public subnets (one per availability zone)"
}

# Gateway variables
variable "enable_nat_gateway" {
  type        = bool
  description = "Whether to create NAT gateways for private subnets"
  default     = true
}

variable "single_nat_gateway" {
  type        = bool
  description = "Whether to use a single NAT gateway for all private subnets"
  default     = false
}

# VPC endpoint variables
variable "enable_vpc_endpoints" {
  type        = bool
  description = "Whether to create VPC endpoints for AWS services (S3, ECR, etc.)"
  default     = true
}

# Flow logs variables
variable "enable_flow_logs" {
  type        = bool
  description = "Whether to enable VPC flow logs for network traffic analysis"
  default     = true
}

variable "flow_logs_retention_days" {
  type        = number
  description = "Number of days to retain VPC flow logs"
  default     = 30
}

variable "tags" {
  type        = map(string)
  description = "Additional tags to apply to networking resources"
  default     = {}
}

locals {
  az_count = length(var.availability_zones)
}