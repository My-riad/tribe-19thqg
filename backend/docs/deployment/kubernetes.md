# Kubernetes Deployment Architecture for Tribe Platform

## Introduction

This document provides comprehensive guidance on the Kubernetes deployment architecture for the Tribe platform. It covers cluster setup, service deployment strategies, monitoring, scaling, and operational procedures to ensure a reliable and maintainable production environment.

### Purpose

The purpose of this document is to provide developers, DevOps engineers, and system administrators with the necessary information to understand, deploy, and maintain the Tribe platform on Kubernetes.

### Scope

This document covers the Kubernetes deployment aspects of the Tribe platform, including cluster configuration, service deployment, monitoring, scaling, and operational procedures. It does not cover application-specific details or development workflows.

## Kubernetes Cluster Architecture

The Tribe platform uses Amazon EKS (Elastic Kubernetes Service) as the managed Kubernetes service, with a multi-environment approach for development, staging, and production.

### Cluster Configuration

The EKS cluster is provisioned using Terraform with the following configuration:

- Kubernetes version: 1.27+
- Control plane: AWS-managed in multiple availability zones
- Node groups: Separate node groups for system, application, and data processing workloads
- Networking: VPC with private subnets for worker nodes and public subnets for load balancers
- Security: AWS IAM integration for authentication, network policies for pod-to-pod communication

### Node Groups

The cluster uses three distinct node groups to optimize resource allocation:

1. **System Node Group**:
   - Purpose: Runs system components like monitoring tools and ingress controllers
   - Instance types: t3.medium
   - Scaling: 2-4 nodes

2. **Application Node Group**:
   - Purpose: Runs API services and frontend services
   - Instance types: t3.large
   - Scaling: 2-10 nodes based on load

3. **Data Processing Node Group**:
   - Purpose: Runs AI services and data-intensive workloads
   - Instance types: t3.xlarge
   - Scaling: 1-6 nodes based on processing requirements

### Namespace Organization

The cluster resources are organized into the following namespaces:

- **tribe-system**: System-level components of the Tribe platform
- **api-services**: Backend API services
- **frontend-services**: Client-facing services
- **ai-services**: AI processing services
- **monitoring**: Monitoring tools (Prometheus, Grafana, Loki)
- **ingress-nginx**: Ingress controllers

Each namespace has resource quotas and default resource limits to ensure fair resource allocation and prevent resource starvation.

## Service Deployment

The Tribe platform follows a microservices architecture with each service deployed as a separate Kubernetes deployment.

### Deployment Strategies

Different deployment strategies are used based on the criticality and nature of each service:

1. **Rolling Updates** (Default):
   - Used for most services
   - Zero-downtime deployments with gradual replacement of pods
   - Configuration: `maxSurge: 1, maxUnavailable: 0`

2. **Blue-Green Deployments**:
   - Used for critical services like payment processing
   - Creates a complete new deployment before switching traffic
   - Implemented using service switching

3. **Canary Deployments**:
   - Used for high-risk changes
   - Gradually shifts traffic to the new version
   - Implemented using service with weighted routing

### Resource Allocation

Resource requests and limits are defined for all containers to ensure proper scheduling and prevent resource contention:

- **API Services**:
  - Requests: CPU: 250m, Memory: 256Mi
  - Limits: CPU: 500m, Memory: 512Mi

- **Frontend Services**:
  - Requests: CPU: 250m, Memory: 256Mi
  - Limits: CPU: 500m, Memory: 512Mi

- **AI Services**:
  - Requests: CPU: 1, Memory: 1Gi
  - Limits: CPU: 2, Memory: 2Gi

- **Background Workers**:
  - Requests: CPU: 500m, Memory: 512Mi
  - Limits: CPU: 1, Memory: 1Gi

### Health Checks

All services implement both liveness and readiness probes to ensure proper health monitoring:

- **Liveness Probe**:
  - Checks if the container is running properly
  - Failure results in container restart
  - Configuration: initialDelaySeconds: 30, periodSeconds: 15, timeoutSeconds: 5

- **Readiness Probe**:
  - Checks if the container is ready to receive traffic
  - Failure results in removing the pod from service endpoints
  - Configuration: initialDelaySeconds: 10, periodSeconds: 10, timeoutSeconds: 3

### Configuration Management

Service configuration is managed using Kubernetes ConfigMaps and Secrets:

- **ConfigMaps**: Store non-sensitive configuration data
  - Environment-specific settings
  - Feature flags
  - Service endpoints

- **Secrets**: Store sensitive configuration data
  - API keys
  - Database credentials
  - OAuth client secrets

All configuration is version-controlled and managed through GitOps workflows.

## Scaling and High Availability

The Tribe platform is designed for high availability and scalability to handle varying loads and ensure resilience against failures.

### Horizontal Pod Autoscaling

Horizontal Pod Autoscalers (HPA) are configured for all services to automatically scale based on metrics:

- **API Services**:
  - Min replicas: 2
  - Max replicas: 10
  - Target CPU utilization: 70%

- **Frontend Services**:
  - Min replicas: 2
  - Max replicas: 8
  - Target CPU utilization: 70%

- **AI Services**:
  - Min replicas: 1
  - Max replicas: 6
  - Target CPU utilization: 60%

- **Background Workers**:
  - Min replicas: 1
  - Max replicas: 8
  - Target metric: Queue depth > 100

### Cluster Autoscaling

The Kubernetes Cluster Autoscaler is deployed to automatically adjust the number of nodes based on pod scheduling requirements:

- Monitors for pending pods that cannot be scheduled due to resource constraints
- Automatically adds nodes to node groups when needed
- Removes underutilized nodes when possible
- Configured with scan interval of 10 seconds and scale-down delay of 10 minutes

### Pod Disruption Budgets

Pod Disruption Budgets (PDBs) are configured for all services to ensure high availability during voluntary disruptions:

- Ensures that a minimum number of pods are always available
- Prevents all pods of a service from being down simultaneously during node drains or upgrades
- Configuration: `minAvailable: 1` for most services

### Multi-AZ Deployment

The cluster and workloads are distributed across multiple AWS Availability Zones for high availability:

- EKS control plane is automatically deployed across multiple AZs
- Worker nodes are distributed across multiple AZs
- Pod anti-affinity rules ensure pods of the same service are spread across nodes in different AZs
- Configuration: `podAntiAffinity` with `preferredDuringSchedulingIgnoredDuringExecution`

## Networking and Ingress

The Tribe platform uses a combination of Kubernetes services and AWS load balancers to manage network traffic.

### Service Types

Different Kubernetes service types are used based on the exposure requirements:

- **ClusterIP**: Default type for internal services
- **NodePort**: Used for services that need to be exposed on a specific port
- **LoadBalancer**: Used for services that need to be exposed externally with their own load balancer

### Ingress Configuration

The AWS Load Balancer Controller is used to manage ingress resources:

- Creates and manages AWS Application Load Balancers (ALBs)
- Terminates TLS using ACM certificates
- Implements path-based routing to direct traffic to appropriate services
- Configures health checks, security groups, and WAF integration

### External Access

The platform exposes three main endpoints externally:

1. **API Endpoint** (api.${DOMAIN_NAME}):
   - Routes to the API Gateway service
   - Secured with TLS and WAF
   - Health check path: /health

2. **Web Endpoint** (${DOMAIN_NAME}):
   - Routes to the web frontend service
   - Secured with TLS and WAF
   - Health check path: /

3. **Monitoring Endpoint** (monitoring.${DOMAIN_NAME}):
   - Routes to Grafana for monitoring dashboards
   - Secured with TLS and Cognito authentication
   - Health check path: /api/health

### Network Policies

Network policies are implemented to control pod-to-pod communication:

- Default deny-all policy to restrict unauthorized communication
- Allow same-namespace policy to permit communication within the same namespace
- Specific policies for cross-namespace communication where needed
- Egress policies to control outbound traffic to external services

## Monitoring and Observability

The Tribe platform implements a comprehensive monitoring and observability stack to ensure system health and performance.

### Prometheus Monitoring

Prometheus is deployed for metrics collection and monitoring:

- Scrapes metrics from all services via annotations
- Stores time-series data with 15-day retention
- Configured with service discovery for automatic target detection
- Implements alerting rules for various failure scenarios

### Grafana Dashboards

Grafana is deployed for visualization and dashboards:

- System dashboards for cluster and node metrics
- Service dashboards for API performance and error rates
- Business dashboards for user engagement and conversion metrics
- SLO dashboards for tracking service level objectives

### Logging

Centralized logging is implemented using Loki:

- Collects logs from all containers
- Implements structured logging with JSON format
- Provides log exploration and search capabilities
- Retains logs for 30 days

### Alerting

Alerting is configured for various failure scenarios:

- High error rates (>5% for 5 minutes)
- API high latency (95th percentile >500ms for 5 minutes)
- High CPU/memory usage (>80% for 10 minutes)
- Pod crash looping (>5 restarts in 1 hour)
- Service down (for 5 minutes)
- Database latency (95th percentile >100ms)
- AI processing latency (95th percentile >5 seconds)

## GitOps Deployment

The Tribe platform uses ArgoCD for GitOps-based continuous delivery.

### ArgoCD Setup

ArgoCD is deployed in the cluster to manage deployments:

- Monitors Git repository for changes
- Automatically syncs changes to the cluster
- Provides visualization of deployment status
- Supports manual and automated sync policies

### Application Configuration

ArgoCD applications are configured for different components:

1. **Platform Application**:
   - Deploys core platform infrastructure
   - Automated sync with pruning and self-healing
   - Environment-specific configuration via value files

2. **Monitoring Application**:
   - Deploys monitoring stack (Prometheus, Grafana, etc.)
   - Automated sync with pruning and self-healing

3. **Service Applications**:
   - Dynamically generated for each microservice
   - Configured with appropriate deployment strategies
   - Automated sync with pruning and self-healing

### Deployment Workflow

The GitOps deployment workflow follows these steps:

1. Developers submit changes via pull requests
2. CI pipeline builds, tests, and creates container images
3. Images are tagged with semantic version or Git SHA
4. CI updates Kubernetes manifests with new image tags
5. ArgoCD detects changes and syncs to the cluster
6. Changes are promoted through environments (dev → staging → prod)

### Environment-Specific Configuration

Different environments have different sync policies:

- **Development**:
  - Continuous sync
  - Auto-sync enabled
  - No manual approval required
  - Prune resources enabled

- **Staging**:
  - Continuous sync
  - Auto-sync enabled
  - No manual approval required
  - Prune resources enabled

- **Production**:
  - On-demand sync
  - Auto-sync disabled
  - Manual approval required
  - Prune resources enabled

## Security Considerations

The Kubernetes deployment implements various security measures to protect the platform.

### Pod Security

Pod security is enforced through security contexts and policies:

- Non-root containers with specific user/group IDs
- Read-only root filesystem where possible
- Dropped capabilities and restricted seccomp profiles
- Resource limits to prevent DoS attacks

### Secret Management

Sensitive information is managed securely:

- Kubernetes Secrets for sensitive configuration
- AWS Secrets Manager for external secrets
- Encryption at rest using AWS KMS
- Restricted access to secrets through RBAC

### Network Security

Network security is implemented at multiple levels:

- VPC security groups for cluster-level protection
- Network policies for pod-to-pod communication control
- TLS termination at load balancer
- WAF rules for API protection

### Authentication and Authorization

Access control is implemented using:

- AWS IAM integration for cluster authentication
- RBAC for fine-grained authorization within the cluster
- Service accounts with limited permissions
- OIDC integration for external identity providers

## Operational Procedures

This section covers common operational procedures for managing the Kubernetes deployment.

### Cluster Access

To access the Kubernetes cluster:

```bash
# Configure kubectl for EKS cluster
aws eks update-kubeconfig --name tribe-${ENVIRONMENT} --region ${AWS_REGION}

# Verify access
kubectl get nodes
```

### Deployment Rollback

To rollback a deployment to a previous version:

```bash
# Using kubectl
kubectl rollout undo deployment/${SERVICE_NAME} -n ${NAMESPACE}

# Using ArgoCD
argocd app rollback ${APP_NAME}
```

### Scaling Operations

To manually scale a deployment:

```bash
# Scale a deployment
kubectl scale deployment/${SERVICE_NAME} --replicas=${REPLICA_COUNT} -n ${NAMESPACE}

# Update HPA configuration
kubectl edit hpa/${SERVICE_NAME} -n ${NAMESPACE}
```

### Log Access

To access logs for troubleshooting:

```bash
# Get logs for a specific pod
kubectl logs ${POD_NAME} -n ${NAMESPACE}

# Get logs for a deployment
kubectl logs -l app=${APP_LABEL} -n ${NAMESPACE}

# Stream logs
kubectl logs -f ${POD_NAME} -n ${NAMESPACE}
```

### Monitoring Access

To access monitoring dashboards:

1. Navigate to https://monitoring.${DOMAIN_NAME}
2. Authenticate using Cognito credentials
3. Access Grafana dashboards for system and service monitoring

## Troubleshooting

This section provides guidance for troubleshooting common issues in the Kubernetes deployment.

### Pod Issues

For pods that are not running properly:

```bash
# Check pod status
kubectl get pods -n ${NAMESPACE}

# Describe pod for detailed information
kubectl describe pod ${POD_NAME} -n ${NAMESPACE}

# Check pod logs
kubectl logs ${POD_NAME} -n ${NAMESPACE}
```

### Service Connectivity

For service connectivity issues:

```bash
# Check service endpoints
kubectl get endpoints ${SERVICE_NAME} -n ${NAMESPACE}

# Test connectivity from another pod
kubectl exec -it ${DEBUG_POD_NAME} -n ${NAMESPACE} -- curl ${SERVICE_NAME}.${NAMESPACE}.svc.cluster.local
```

### Resource Constraints

For issues related to resource constraints:

```bash
# Check node resource usage
kubectl top nodes

# Check pod resource usage
kubectl top pods -n ${NAMESPACE}

# Check resource quotas
kubectl get resourcequota -n ${NAMESPACE}
```

### Common Issues

Common issues and their solutions:

1. **ImagePullBackOff**: Check image name, repository access, and pull secrets
2. **CrashLoopBackOff**: Check application logs and ensure the application is configured correctly
3. **Pending Pods**: Check for resource constraints or node selector issues
4. **Service Unavailable**: Check endpoints, selectors, and pod readiness

## References

Additional resources for Kubernetes deployment:

### Internal Documentation
- [Tribe Architecture Overview](../architecture/overview.md)
- [CI/CD Pipeline](ci-cd.md)
- [Monitoring Setup](../operations/monitoring.md)
- [Disaster Recovery Procedures](../operations/disaster-recovery.md)

### External Documentation
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [AWS EKS Documentation](https://docs.aws.amazon.com/eks/)
- [ArgoCD Documentation](https://argo-cd.readthedocs.io/)
- [Prometheus Documentation](https://prometheus.io/docs/)

### Configuration Files
- [Namespace Configuration](../../infrastructure/kubernetes/namespace.yaml)
- [Service Deployments](../../infrastructure/kubernetes/)
- [Ingress Configuration](../../infrastructure/kubernetes/ingress.yaml)
- [Monitoring Configuration](../../infrastructure/monitoring/)