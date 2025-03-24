# Variables for Tribe platform infrastructure

#
# Environment variables
#
variable "environment" {
  description = "Deployment environment (development, staging, production)"
  type        = string
  default     = "development"

  validation {
    condition     = contains(["development", "staging", "production"], var.environment)
    error_message = "Environment must be one of: development, staging, production."
  }
}

variable "region" {
  description = "AWS region for primary deployment"
  type        = string
  default     = "us-east-2"
}

variable "domain_name" {
  description = "Domain name for the Tribe platform"
  type        = string
  default     = "tribe-app.com"
}

#
# Networking variables
#
variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones to use in the region"
  type        = list(string)
  default     = ["us-east-2a", "us-east-2b", "us-east-2c"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets (one per availability zone)"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets (one per availability zone)"
  type        = list(string)
  default     = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
}

#
# Kubernetes variables
#
variable "cluster_name" {
  description = "Name of the EKS cluster"
  type        = string
  default     = "tribe-eks-cluster"
}

variable "kubernetes_version" {
  description = "Kubernetes version to use for the EKS cluster"
  type        = string
  default     = "1.27"

  validation {
    condition     = contains(["1.26", "1.27", "1.28"], var.kubernetes_version)
    error_message = "Kubernetes version must be one of the supported versions: 1.26, 1.27, 1.28."
  }
}

variable "node_groups" {
  description = "Configuration for EKS node groups"
  type = map(object({
    instance_types = list(string)
    disk_size      = number
    desired_size   = number
    min_size       = number
    max_size       = number
  }))
  default = {
    system = {
      instance_types = ["t3.medium"]
      disk_size      = 50
      desired_size   = 2
      min_size       = 2
      max_size       = 4
    }
    application = {
      instance_types = ["t3.large"]
      disk_size      = 50
      desired_size   = 3
      min_size       = 2
      max_size       = 10
    }
    data_processing = {
      instance_types = ["t3.xlarge"]
      disk_size      = 100
      desired_size   = 2
      min_size       = 1
      max_size       = 6
    }
  }
}

#
# Database variables
#
variable "postgres_instance_class" {
  description = "Instance class for PostgreSQL RDS"
  type        = map(string)
  default = {
    development = "db.t3.medium"
    staging     = "db.t3.large"
    production  = "db.r5.large"
  }
}

variable "postgres_allocated_storage" {
  description = "Allocated storage for PostgreSQL RDS in GB"
  type        = map(number)
  default = {
    development = 50
    staging     = 100
    production  = 500
  }
}

variable "postgres_engine_version" {
  description = "PostgreSQL engine version"
  type        = string
  default     = "15.3"
}

variable "postgres_database_name" {
  description = "Name of the PostgreSQL database"
  type        = string
  default     = "tribe"
}

variable "postgres_username" {
  description = "Username for PostgreSQL database"
  type        = string
  default     = "tribeadmin"
}

variable "postgres_password" {
  description = "Password for PostgreSQL database (will be generated if not provided)"
  type        = string
  sensitive   = true
  default     = null
}

variable "redis_node_type" {
  description = "Node type for Redis ElastiCache cluster"
  type        = map(string)
  default = {
    development = "cache.t3.small"
    staging     = "cache.t3.medium"
    production  = "cache.r5.large"
  }
}

variable "redis_engine_version" {
  description = "Redis engine version"
  type        = string
  default     = "7.0"
}

variable "redis_parameter_group_name" {
  description = "Parameter group name for Redis"
  type        = string
  default     = "default.redis7"
}

variable "backup_retention_period" {
  description = "Number of days to retain database backups"
  type        = map(number)
  default = {
    development = 7
    staging     = 7
    production  = 30
  }
}

variable "multi_az" {
  description = "Whether to enable Multi-AZ deployment for high availability"
  type        = map(bool)
  default = {
    development = false
    staging     = false
    production  = true
  }
}

#
# Monitoring variables
#
variable "enable_cluster_autoscaler" {
  description = "Whether to enable the Kubernetes Cluster Autoscaler"
  type        = bool
  default     = true
}

variable "enable_metrics_server" {
  description = "Whether to enable the Kubernetes Metrics Server"
  type        = bool
  default     = true
}

variable "enable_prometheus_stack" {
  description = "Whether to enable the Prometheus monitoring stack"
  type        = bool
  default     = true
}

variable "prometheus_retention_days" {
  description = "Number of days to retain Prometheus metrics"
  type        = number
  default     = 15
}

#
# Security variables
#
variable "enable_vpc_endpoints" {
  description = "Whether to create VPC endpoints for AWS services (S3, ECR, etc.)"
  type        = bool
  default     = true
}

variable "enable_flow_logs" {
  description = "Whether to enable VPC flow logs for network traffic analysis"
  type        = bool
  default     = true
}

variable "flow_logs_retention_days" {
  description = "Number of days to retain VPC flow logs"
  type        = number
  default     = 30
}

variable "deletion_protection" {
  description = "Whether to enable deletion protection for the database"
  type        = map(bool)
  default = {
    development = false
    staging     = false
    production  = true
  }
}

variable "skip_final_snapshot" {
  description = "Whether to skip the final snapshot when the database is deleted"
  type        = map(bool)
  default = {
    development = true
    staging     = true
    production  = false
  }
}

#
# External API variables
#
variable "openrouter_api_key" {
  description = "API key for OpenRouter AI service"
  type        = string
  sensitive   = true
  default     = null
}

variable "stripe_api_key" {
  description = "API key for Stripe payment processing"
  type        = string
  sensitive   = true
  default     = null
}

variable "venmo_api_key" {
  description = "API key for Venmo payment processing"
  type        = string
  sensitive   = true
  default     = null
}

variable "google_places_api_key" {
  description = "API key for Google Places API"
  type        = string
  sensitive   = true
  default     = null
}

variable "firebase_api_key" {
  description = "API key for Firebase services"
  type        = string
  sensitive   = true
  default     = null
}

#
# Tagging variables
#
variable "tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default = {
    Project   = "Tribe"
    ManagedBy = "Terraform"
  }
}

locals {
  common_tags = merge(var.tags, { Environment = var.environment })
  is_production = var.environment == "production"
}