# Variables for Kubernetes module

# General cluster configuration
variable "environment" {
  description = "Deployment environment (development, staging, production)"
  type        = string
  default     = "development"
  
  validation {
    condition     = contains(["development", "staging", "production"], var.environment)
    error_message = "Environment must be one of: development, staging, production."
  }
}

variable "vpc_id" {
  description = "ID of the VPC where the EKS cluster will be deployed"
  type        = string
}

variable "subnet_ids" {
  description = "List of subnet IDs where the EKS cluster and nodes will be deployed"
  type        = list(string)
}

variable "security_group_id" {
  description = "ID of the security group for the EKS cluster"
  type        = string
}

variable "cluster_name" {
  description = "Name of the EKS cluster"
  type        = string
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

variable "cluster_log_types" {
  description = "List of the desired control plane logging to enable"
  type        = list(string)
  default     = ["api", "audit", "authenticator", "controllerManager", "scheduler"]
}

variable "endpoint_private_access" {
  description = "Whether the Amazon EKS private API server endpoint is enabled"
  type        = bool
  default     = true
}

variable "endpoint_public_access" {
  description = "Whether the Amazon EKS public API server endpoint is enabled"
  type        = bool
  default     = true
}

variable "public_access_cidrs" {
  description = "List of CIDR blocks that can access the Amazon EKS public API server endpoint"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

# Node group configuration
variable "node_groups" {
  description = "Map of EKS node group configurations with instance types, disk size, and scaling parameters"
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

# Add-on configuration
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

variable "enable_load_balancer_controller" {
  description = "Whether to enable the AWS Load Balancer Controller"
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

# Tags
variable "tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
}

locals {
  common_tags = merge(var.tags, { Environment = var.environment })
}