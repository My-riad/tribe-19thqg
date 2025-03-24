# Provider configuration for Tribe platform infrastructure

terraform {
  required_version = ">= 1.0.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.0"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
    tls = {
      source  = "hashicorp/tls"
      version = "~> 3.0"
    }
  }
}

# AWS is the primary cloud provider for the Tribe platform
provider "aws" {
  region = var.region
  
  default_tags {
    tags = {
      Project     = "Tribe"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# Secondary AWS provider for global resources like Route53 and ACM
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
  
  default_tags {
    tags = {
      Project     = "Tribe"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# Kubernetes provider for managing EKS cluster resources
provider "kubernetes" {
  host                   = module.kubernetes.cluster_endpoint
  cluster_ca_certificate = base64decode(module.kubernetes.cluster_certificate_authority_data)
  
  exec {
    api_version = "client.authentication.k8s.io/v1beta1"
    args        = ["eks", "get-token", "--cluster-name", module.kubernetes.cluster_name]
    command     = "aws"
  }
}

# Helm provider for deploying applications to Kubernetes
provider "helm" {
  kubernetes {
    host                   = module.kubernetes.cluster_endpoint
    cluster_ca_certificate = base64decode(module.kubernetes.cluster_certificate_authority_data)
    
    exec {
      api_version = "client.authentication.k8s.io/v1beta1"
      args        = ["eks", "get-token", "--cluster-name", module.kubernetes.cluster_name]
      command     = "aws"
    }
  }
}

provider "random" {
}

provider "tls" {
}

data "aws_region" "current" {}