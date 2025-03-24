# Variables for the database module
# This file defines the input parameters required to provision and configure
# AWS RDS PostgreSQL instances and ElastiCache Redis clusters for the Tribe platform.

# Required variables
variable "environment" {
  description = "Deployment environment (development, staging, production)"
  type        = string
  validation {
    condition     = contains(["development", "staging", "production"], var.environment)
    error_message = "Environment must be one of: development, staging, production."
  }
}

variable "vpc_id" {
  description = "ID of the VPC where database resources will be created"
  type        = string
}

variable "subnet_ids" {
  description = "List of subnet IDs where database resources will be deployed"
  type        = list(string)
}

variable "security_group_ids" {
  description = "Map of security group IDs for database resources (keys: database, redis)"
  type        = map(string)
  default     = {}
}

# PostgreSQL variables
variable "postgres_instance_class" {
  description = "Instance class for PostgreSQL RDS"
  type        = string
  default     = "db.t3.medium"
}

variable "postgres_allocated_storage" {
  description = "Allocated storage for PostgreSQL RDS in GB"
  type        = number
  default     = 50
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
  default     = null
  sensitive   = true
}

# Redis variables
variable "redis_node_type" {
  description = "Node type for Redis ElastiCache cluster"
  type        = string
  default     = "cache.t3.small"
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

# High availability and backup variables
variable "multi_az" {
  description = "Whether to enable Multi-AZ deployment for high availability by environment"
  type        = map(bool)
  default     = {
    development = false
    staging     = false
    production  = true
  }
}

variable "backup_retention_period" {
  description = "Number of days to retain database backups by environment"
  type        = map(number)
  default     = {
    development = 7
    staging     = 7
    production  = 30
  }
}

variable "deletion_protection" {
  description = "Whether to enable deletion protection for the database by environment"
  type        = map(bool)
  default     = {
    development = false
    staging     = false
    production  = true
  }
}

variable "skip_final_snapshot" {
  description = "Whether to skip the final snapshot when the database is deleted by environment"
  type        = map(bool)
  default     = {
    development = true
    staging     = true
    production  = false
  }
}

variable "performance_insights_enabled" {
  description = "Whether to enable Performance Insights for PostgreSQL"
  type        = bool
  default     = true
}

variable "performance_insights_retention_period" {
  description = "Retention period for Performance Insights in days (7 or 731)"
  type        = number
  default     = 7
}

variable "monitoring_interval" {
  description = "Interval in seconds for enhanced monitoring (0, 1, 5, 10, 15, 30, 60)"
  type        = number
  default     = 60
}

# Security variables
variable "at_rest_encryption_enabled" {
  description = "Whether to enable encryption at rest for Redis"
  type        = bool
  default     = true
}

variable "transit_encryption_enabled" {
  description = "Whether to enable encryption in transit for Redis"
  type        = bool
  default     = true
}

variable "redis_automatic_failover_enabled" {
  description = "Whether to enable automatic failover for Redis by environment"
  type        = map(bool)
  default     = {
    development = false
    staging     = true
    production  = true
  }
}

variable "redis_multi_az_enabled" {
  description = "Whether to enable Multi-AZ for Redis by environment"
  type        = map(bool)
  default     = {
    development = false
    staging     = false
    production  = true
  }
}

variable "redis_num_cache_clusters" {
  description = "Number of cache clusters for Redis by environment"
  type        = map(number)
  default     = {
    development = 1
    staging     = 2
    production  = 3
  }
}

variable "redis_snapshot_retention_limit" {
  description = "Number of days to retain Redis snapshots by environment"
  type        = map(number)
  default     = {
    development = 1
    staging     = 5
    production  = 15
  }
}

variable "tags" {
  description = "Additional tags to apply to database resources"
  type        = map(string)
  default     = {}
}