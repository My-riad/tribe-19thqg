# Tribe Platform Disaster Recovery Procedures

This document provides comprehensive procedures for recovering the Tribe platform in various disaster scenarios. These procedures are designed to meet the defined Recovery Time Objectives (RTO) and Recovery Point Objectives (RPO) while ensuring data integrity and service continuity.

## Prerequisites

Before initiating any recovery procedure, ensure the following prerequisites are met:

### Access Requirements
- AWS Console access with appropriate IAM permissions
- Kubernetes cluster administrative access
- Velero CLI installed and configured
- AWS CLI installed and configured
- Access to backup storage locations
- Encryption keys and credentials for secured backups

### Documentation and Resources
- Latest infrastructure diagrams
- Current backup inventory and status
- Service dependency maps
- Emergency contact list
- Runbooks for individual services

## Recovery Scenarios

The following sections detail recovery procedures for specific disaster scenarios. Follow the appropriate procedure based on the nature of the incident.

### Service Outage Recovery

**RTO: < 15 minutes**

Use this procedure when a specific service is unavailable but the underlying infrastructure is intact.

1. **Identify Affected Service**
   ```bash
   kubectl get pods -n <namespace> | grep -i <service-name>
   ```

2. **Check Service Logs**
   ```bash
   kubectl logs -n <namespace> <pod-name>
   ```

3. **Restart Service**
   ```bash
   kubectl rollout restart deployment -n <namespace> <deployment-name>
   ```

4. **Verify Recovery**
   ```bash
   kubectl get pods -n <namespace> | grep -i <service-name>
   curl -k https://<service-endpoint>/health
   ```

5. **If Restart Fails, Scale Up Resources**
   ```bash
   kubectl scale deployment -n <namespace> <deployment-name> --replicas=<increased-number>
   ```

6. **Post-Recovery Validation**
   - Verify service health endpoints
   - Check service metrics in monitoring dashboard
   - Validate dependent services are functioning correctly

#### Example: API Gateway Recovery
```bash
# Check API Gateway status
kubectl get pods -n api-services -l app=api-gateway

# Restart API Gateway
kubectl rollout restart deployment -n api-services api-gateway

# Verify recovery
kubectl get pods -n api-services -l app=api-gateway
curl -k https://api-gateway.api-services.svc.cluster.local/health
```

### Database Failure Recovery

**RTO: < 1 hour, RPO: < 5 minutes**

Use this procedure when the primary database instance fails.

1. **Verify Database Failure**
   ```bash
   kubectl get pods -n <database-namespace> | grep -i <database-name>
   ```

2. **Check Database Status in AWS**
   ```bash
   aws rds describe-db-instances --db-instance-identifier <db-instance-id> --query 'DBInstances[0].DBInstanceStatus'
   ```

3. **Initiate Failover to Read Replica**
   ```bash
   aws rds failover-db-cluster --db-cluster-identifier <db-cluster-id>
   ```

4. **For Manual Failover to Replica**
   ```bash
   # Promote read replica to primary
   aws rds promote-read-replica --db-instance-identifier <replica-instance-id>
   ```

5. **Update Connection Strings if Necessary**
   ```bash
   kubectl create configmap -n api-services database-config --from-literal=DB_HOST=<new-endpoint> --dry-run=client -o yaml | kubectl apply -f -
   ```

6. **Restart Dependent Services**
   ```bash
   kubectl rollout restart deployment -n api-services -l db-dependent=true
   ```

7. **Verify Database Connectivity**
   ```bash
   kubectl exec -it -n api-services <pod-name> -- curl -s http://localhost:<port>/db-health
   ```

8. **Post-Recovery Validation**
   - Verify data integrity with sample queries
   - Check replication status for new primary
   - Validate application functionality
   - Monitor database performance metrics

#### Example: PostgreSQL RDS Failover
```bash
# Check RDS status
aws rds describe-db-instances --db-instance-identifier tribe-postgres-primary --query 'DBInstances[0].DBInstanceStatus'

# Initiate failover
aws rds failover-db-cluster --db-cluster-identifier tribe-postgres-cluster

# Update connection string
NEW_ENDPOINT=$(aws rds describe-db-instances --db-instance-identifier tribe-postgres-replica --query 'DBInstances[0].Endpoint.Address' --output text)
kubectl create configmap -n api-services database-config --from-literal=DB_HOST=$NEW_ENDPOINT --dry-run=client -o yaml | kubectl apply -f -

# Restart services
kubectl rollout restart deployment -n api-services -l db-dependent=true
```

### Availability Zone Failure Recovery

**RTO: < 30 minutes, RPO: < 5 minutes**

Use this procedure when an entire AWS Availability Zone becomes unavailable.

1. **Verify AZ Failure**
   ```bash
   kubectl get nodes -o wide | grep <availability-zone>
   ```

2. **Cordon and Drain Affected Nodes**
   ```bash
   # Get nodes in the affected AZ
   AFFECTED_NODES=$(kubectl get nodes -o jsonpath='{.items[?(@.metadata.labels.topology\.kubernetes\.io/zone=="<affected-zone>")].metadata.name}')
   
   # Cordon affected nodes
   for NODE in $AFFECTED_NODES; do kubectl cordon $NODE; done
   
   # Drain affected nodes
   for NODE in $AFFECTED_NODES; do kubectl drain $NODE --ignore-daemonsets --delete-emptydir-data; done
   ```

3. **Scale Up Node Groups in Healthy AZs**
   ```bash
   aws eks update-nodegroup-config --cluster-name <cluster-name> --nodegroup-name <nodegroup-name> --scaling-config desiredSize=<increased-size>
   ```

4. **Verify Pod Rescheduling**
   ```bash
   kubectl get pods -A -o wide | grep -v <affected-zone>
   ```

5. **Update DNS if Necessary**
   ```bash
   aws route53 change-resource-record-sets --hosted-zone-id <hosted-zone-id> --change-batch file://dns-changes.json
   ```

6. **Post-Recovery Validation**
   - Verify all critical services are running in healthy AZs
   - Check load balancer health checks
   - Validate application functionality
   - Monitor performance metrics for signs of degradation

#### Example: us-east-1a Failure
```bash
# Identify affected nodes
kubectl get nodes -o wide | grep us-east-1a

# Cordon and drain nodes
AFFECTED_NODES=$(kubectl get nodes -o jsonpath='{.items[?(@.metadata.labels.topology\.kubernetes\.io/zone=="us-east-1a")].metadata.name}')
for NODE in $AFFECTED_NODES; do kubectl cordon $NODE; done
for NODE in $AFFECTED_NODES; do kubectl drain $NODE --ignore-daemonsets --delete-emptydir-data; done

# Scale up nodes in healthy AZs
aws eks update-nodegroup-config --cluster-name tribe-cluster --nodegroup-name tribe-nodes-1b --scaling-config desiredSize=5
aws eks update-nodegroup-config --cluster-name tribe-cluster --nodegroup-name tribe-nodes-1c --scaling-config desiredSize=5
```

### Region Failure Recovery

**RTO: < 4 hours, RPO: < 1 hour**

Use this procedure when an entire AWS Region becomes unavailable.

1. **Activate DR Region**
   ```bash
   # Update kubeconfig to point to DR cluster
   aws eks update-kubeconfig --name <dr-cluster-name> --region <dr-region>
   ```

2. **Verify DR Cluster Status**
   ```bash
   kubectl get nodes
   kubectl get namespaces
   ```

3. **Restore from Cross-Region Backups**
   ```bash
   # List available backups in DR region
   velero backup get
   
   # Restore latest backup
   velero restore create --from-backup <latest-backup-name> --wait
   ```

4. **Verify Database Restoration**
   ```bash
   # Check RDS status in DR region
   aws rds describe-db-instances --region <dr-region> --db-instance-identifier <dr-db-instance-id>
   ```

5. **Update DNS to Point to DR Region**
   ```bash
   # Update Route53 records
   aws route53 change-resource-record-sets --hosted-zone-id <hosted-zone-id> --change-batch file://dr-dns-changes.json
   ```

6. **Verify External Service Configurations**
   ```bash
   # Update external service configurations if necessary
   kubectl apply -f updated-external-services-config.yaml
   ```

7. **Post-Recovery Validation**
   - Verify DNS propagation
   - Test application functionality
   - Validate data integrity
   - Check integration with external services
   - Monitor system performance

#### Example: us-east-1 to us-west-2 Failover
```bash
# Switch to DR cluster
aws eks update-kubeconfig --name tribe-cluster-dr --region us-west-2

# Verify DR cluster
kubectl get nodes
kubectl get namespaces

# Restore from latest backup
LATEST_BACKUP=$(velero backup get | grep -v NAME | sort -k3 -r | head -n1 | awk '{print $1}')
velero restore create --from-backup $LATEST_BACKUP --wait

# Update DNS
cat > dr-dns-changes.json << EOF
{
  "Changes": [
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "api.tribe.com",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "Z2FDTNDATAQYW2",
          "DNSName": "tribe-api-dr-1234567890.us-west-2.elb.amazonaws.com",
          "EvaluateTargetHealth": true
        }
      }
    }
  ]
}
EOF

aws route53 change-resource-record-sets --hosted-zone-id Z0123456789ABCDEF --change-batch file://dr-dns-changes.json
```

### Data Corruption Recovery

**RTO: < 2 hours, RPO: Depends on corruption timestamp**

Use this procedure when data corruption is detected.

1. **Identify Scope of Corruption**
   - Determine affected services and data stores
   - Identify the time period of corruption

2. **Isolate Affected Services**
   ```bash
   # Scale down affected services
   kubectl scale deployment -n <namespace> <deployment-name> --replicas=0
   ```

3. **Identify Appropriate Backup**
   ```bash
   # List available backups
   velero backup get
   
   # Find backup before corruption timestamp
   velero backup get | grep -v NAME | awk '$3 < "<corruption-timestamp>"' | sort -k3 -r | head -n1
   ```

4. **Restore Specific Resources from Backup**
   ```bash
   # Restore specific namespace or resources
   velero restore create --from-backup <backup-name> --include-namespaces <namespace> --wait
   ```

5. **For Database Corruption**
   ```bash
   # Restore database to point-in-time before corruption
   aws rds restore-db-instance-to-point-in-time \
     --source-db-instance-identifier <source-instance-id> \
     --target-db-instance-identifier <target-instance-id> \
     --restore-time <timestamp-before-corruption> \
     --use-latest-restorable-time
   ```

6. **Update Connection Strings if Necessary**
   ```bash
   kubectl create configmap -n api-services database-config --from-literal=DB_HOST=<new-endpoint> --dry-run=client -o yaml | kubectl apply -f -
   ```

7. **Restart Services**
   ```bash
   kubectl scale deployment -n <namespace> <deployment-name> --replicas=<original-count>
   ```

8. **Post-Recovery Validation**
   - Verify data integrity
   - Check for signs of continued corruption
   - Validate application functionality
   - Monitor system for anomalies

#### Example: Profile Data Corruption
```bash
# Scale down profile service
kubectl scale deployment -n api-services profile-service --replicas=0

# Find appropriate backup
velero backup get | grep -v NAME | awk '$3 < "2023-07-15T10:00:00Z"' | sort -k3 -r | head -n1

# Restore profile service data
velero restore create --from-backup daily-full-backup-20230715-010000 --include-namespaces api-services --include-resources deployments.apps/profile-service,configmaps,secrets,pvc --wait

# Restore database to point-in-time
aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier tribe-postgres-primary \
  --target-db-instance-identifier tribe-postgres-restored \
  --restore-time 2023-07-15T09:00:00Z

# Update connection string
NEW_ENDPOINT=$(aws rds describe-db-instances --db-instance-identifier tribe-postgres-restored --query 'DBInstances[0].Endpoint.Address' --output text)
kubectl create configmap -n api-services database-config --from-literal=DB_HOST=$NEW_ENDPOINT --dry-run=client -o yaml | kubectl apply -f -

# Restart profile service
kubectl scale deployment -n api-services profile-service --replicas=3
```

### Complete System Failure Recovery

**RTO: < 8 hours, RPO: < 1 hour**

Use this procedure for catastrophic failure requiring complete system rebuild.

1. **Provision New Infrastructure**
   ```bash
   # Apply Terraform configuration
   cd infrastructure/terraform
   terraform init
   terraform apply -var-file=<environment>.tfvars
   ```

2. **Configure New Kubernetes Cluster**
   ```bash
   # Update kubeconfig
   aws eks update-kubeconfig --name <new-cluster-name> --region <region>
   
   # Verify cluster access
   kubectl get nodes
   ```

3. **Install Velero on New Cluster**
   ```bash
   # Install Velero with appropriate plugins
   velero install \
     --provider aws \
     --plugins velero/velero-plugin-for-aws:v1.5.0 \
     --bucket <backup-bucket> \
     --backup-location-config region=<region> \
     --snapshot-location-config region=<region> \
     --secret-file ./credentials-velero
   ```

4. **Restore from Latest Backup**
   ```bash
   # List available backups
   velero backup get
   
   # Restore latest backup
   LATEST_BACKUP=$(velero backup get | grep -v NAME | sort -k3 -r | head -n1 | awk '{print $1}')
   velero restore create --from-backup $LATEST_BACKUP --wait
   ```

5. **Restore Databases**
   ```bash
   # Restore RDS from snapshot
   aws rds restore-db-instance-from-db-snapshot \
     --db-instance-identifier <new-instance-id> \
     --db-snapshot-identifier <snapshot-id>
   ```

6. **Update DNS Records**
   ```bash
   # Update Route53 records
   aws route53 change-resource-record-sets --hosted-zone-id <hosted-zone-id> --change-batch file://new-dns-records.json
   ```

7. **Verify External Service Configurations**
   ```bash
   # Update external service configurations
   kubectl apply -f updated-external-services-config.yaml
   ```

8. **Post-Recovery Validation**
   - Comprehensive system testing
   - Verify all services are operational
   - Validate data integrity across all systems
   - Test external integrations
   - Monitor system performance

#### Example: Complete System Rebuild
```bash
# Provision new infrastructure
cd infrastructure/terraform
terraform init
terraform apply -var-file=production.tfvars

# Configure new cluster
aws eks update-kubeconfig --name tribe-cluster-new --region us-east-1

# Install Velero
velero install \
  --provider aws \
  --plugins velero/velero-plugin-for-aws:v1.5.0 \
  --bucket tribe-backups \
  --backup-location-config region=us-east-1 \
  --snapshot-location-config region=us-east-1 \
  --secret-file ./credentials-velero

# Restore from latest backup
LATEST_BACKUP=$(velero backup get | grep -v NAME | sort -k3 -r | head -n1 | awk '{print $1}')
velero restore create --from-backup $LATEST_BACKUP --wait

# Restore database
LATEST_SNAPSHOT=$(aws rds describe-db-snapshots --db-instance-identifier tribe-postgres-primary --query 'sort_by(DBSnapshots, &SnapshotCreateTime)[-1].DBSnapshotIdentifier' --output text)
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier tribe-postgres-new \
  --db-snapshot-identifier $LATEST_SNAPSHOT
```

## Verification Procedures

After completing a recovery procedure, perform the following verification steps to ensure the system is fully operational.

### Service Health Verification

1. **Check Service Status**
   ```bash
   kubectl get pods -A
   ```

2. **Verify API Endpoints**
   ```bash
   curl -k https://<api-endpoint>/health
   ```

3. **Check Database Connectivity**
   ```bash
   kubectl exec -it -n api-services <pod-name> -- curl -s http://localhost:<port>/db-health
   ```

4. **Verify External Service Integrations**
   ```bash
   kubectl exec -it -n api-services <pod-name> -- curl -s http://localhost:<port>/integration-health
   ```

### Data Integrity Verification

1. **Sample Data Queries**
   ```bash
   kubectl exec -it -n api-services <pod-name> -- curl -s http://localhost:<port>/data-sample
   ```

2. **Check Recent Transactions**
   ```bash
   kubectl exec -it -n api-services <pod-name> -- curl -s http://localhost:<port>/recent-transactions
   ```

3. **Verify User Authentication**
   ```bash
   curl -k -X POST https://<api-endpoint>/auth/test -d '{"test":true}'
   ```

4. **Check Data Consistency Across Services**
   ```bash
   kubectl exec -it -n api-services <pod-name> -- curl -s http://localhost:<port>/consistency-check
   ```

### Performance Verification

1. **Check Response Times**
   ```bash
   curl -k -w "\nTotal: %{time_total}s\n" https://<api-endpoint>/health
   ```

2. **Verify Resource Utilization**
   ```bash
   kubectl top pods -A
   kubectl top nodes
   ```

3. **Check Database Performance**
   ```bash
   kubectl exec -it -n api-services <pod-name> -- curl -s http://localhost:<port>/db-performance
   ```

4. **Load Testing (if time permits)**
   ```bash
   # Run basic load test
   kubectl apply -f load-test-job.yaml
   ```

### Security Verification

1. **Verify SSL/TLS Configuration**
   ```bash
   curl -k -v https://<api-endpoint>/health 2>&1 | grep -i "SSL"
   ```

2. **Check Authentication Services**
   ```bash
   curl -k -X POST https://<api-endpoint>/auth/test -d '{"test":true}'
   ```

3. **Verify Network Policies**
   ```bash
   kubectl get networkpolicies -A
   ```

4. **Check Secret Integrity**
   ```bash
   kubectl get secrets -A | grep -v default
   ```

## Post-Recovery Actions

After successful recovery and verification, complete the following post-recovery actions.

### Documentation and Reporting

1. **Document Recovery Process**
   - Record all actions taken during recovery
   - Note any deviations from standard procedures
   - Document time taken for each recovery step

2. **Update Recovery Documentation**
   - Update procedures based on lessons learned
   - Refine RTO and RPO estimates if necessary

3. **Prepare Incident Report**
   - Document incident timeline
   - Record impact assessment
   - Note root cause analysis
   - List preventive measures

### System Optimization

1. **Review Resource Allocation**
   ```bash
   kubectl top pods -A
   kubectl describe nodes | grep -A 5 "Allocated resources"
   ```

2. **Optimize Scaling Configuration**
   ```bash
   kubectl get hpa -A
   ```

3. **Review Backup Configuration**
   ```bash
   velero backup get
   velero schedule get
   ```

4. **Update Monitoring Alerts**
   - Adjust alert thresholds based on recovery experience
   - Add new alerts for detected failure modes

### Communication

1. **Internal Stakeholder Update**
   - Notify technical teams of recovery completion
   - Share incident report with relevant teams
   - Schedule post-mortem meeting

2. **External Communication**
   - Update status page
   - Notify affected customers
   - Provide transparency about incident and resolution

## Disaster Recovery Testing

Regular testing of disaster recovery procedures is essential to ensure their effectiveness. The following sections outline the testing approach.

### Testing Schedule

| Test Type | Frequency | Scope | Success Criteria |
|-----------|-----------|-------|------------------|
| Component Recovery | Monthly | Individual services | Service restored within RTO |
| Database Recovery | Quarterly | Database restoration | Data restored within RPO |
| AZ Failover | Quarterly | Traffic shifting | No service disruption |
| Full DR Test | Annually | Complete system | System operational in DR region |

### Testing Procedures

1. **Preparation**
   - Schedule maintenance window
   - Notify stakeholders
   - Prepare testing environment
   - Create test plan with specific scenarios

2. **Execution**
   - Follow recovery procedures exactly as documented
   - Record time taken for each step
   - Document any issues encountered

3. **Validation**
   - Verify system functionality post-recovery
   - Validate data integrity
   - Check performance metrics

4. **Documentation**
   - Record test results
   - Update procedures based on findings
   - Document lessons learned

### Automated Testing

Certain recovery scenarios can be tested automatically:

1. **Backup Verification**
   ```bash
   # Automated backup verification job
   kubectl apply -f backup-verification-job.yaml
   ```

2. **Restore Testing**
   ```bash
   # Test restore to isolated namespace
   velero restore create --from-backup <backup-name> --namespace-mappings api-services:api-services-test
   ```

3. **Database Recovery Testing**
   ```bash
   # Test database restore to temporary instance
   aws rds restore-db-instance-from-db-snapshot \
     --db-instance-identifier tribe-postgres-test \
     --db-snapshot-identifier <snapshot-id>
   ```

## Appendix

Additional reference information for disaster recovery operations.

### Recovery Team Contacts

| Role | Name | Contact | Backup Contact |
|------|------|---------|----------------|
| DR Coordinator | Jane Smith | jane.smith@example.com<br>+1-555-123-4567 | john.doe@example.com<br>+1-555-123-4568 |
| Database Administrator | Alex Johnson | alex.johnson@example.com<br>+1-555-123-4569 | sarah.williams@example.com<br>+1-555-123-4570 |
| Infrastructure Lead | Michael Brown | michael.brown@example.com<br>+1-555-123-4571 | lisa.davis@example.com<br>+1-555-123-4572 |
| Security Officer | David Wilson | david.wilson@example.com<br>+1-555-123-4573 | emily.taylor@example.com<br>+1-555-123-4574 |

### External Vendor Contacts

| Vendor | Service | Contact | SLA |
|--------|---------|---------|-----|
| AWS | Cloud Infrastructure | aws-support@amazon.com<br>+1-888-555-1234 | 1 hour response |
| Auth0 | Authentication | support@auth0.com<br>+1-888-555-5678 | 2 hour response |
| Stripe | Payment Processing | support@stripe.com<br>+1-888-555-9012 | 4 hour response |

### Backup Schedule Reference

| Backup Type | Schedule | Retention | Storage Location |
|-------------|----------|-----------|------------------|
| Full System | Daily at 1:00 AM | 30 days | S3 (primary region) |
| Database | Hourly | 7 days | RDS automated backups |
| Critical Services | Hourly | 7 days | S3 (primary region) |
| Configuration | On change | 90 days | S3 (primary and DR regions) |

### Recovery Time Objectives

| Component | Recovery Time Objective (RTO) | Recovery Point Objective (RPO) |
|-----------|-------------------------------|-------------------------------|
| Critical Services | < 1 hour | < 5 minutes |
| Non-critical Services | < 4 hours | < 1 hour |
| Data Stores | < 2 hours | < 15 minutes |
| Complete System | < 8 hours | < 1 hour |

### Glossary

| Term | Definition |
|------|------------|
| RTO | Recovery Time Objective - The maximum acceptable time to restore service |
| RPO | Recovery Point Objective - The maximum acceptable data loss measured in time |
| Failover | Switching from primary to backup system |
| Failback | Returning to primary system after recovery |
| Cold Backup | Backup that requires significant preparation to restore |
| Warm Backup | Backup that requires minimal preparation to restore |
| Hot Backup | Backup that is immediately available for failover |