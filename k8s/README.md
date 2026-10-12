# Pegasus Frontend - Kubernetes Manifests

ชุด Manifest สำหรับ Deploy ระบบ Frontend (`pegasus-tcg-web`) อ้างอิงตามเนื้อหาใน **Class Week 8 (Kubernetes 101)** และ **Class Week 9 (Kubernetes 102)**

---

## โครงสร้างไฟล์
* `deployment.yaml`: จัดการ ReplicaSet, Rolling Update, Resource Requests/Limits และ Probes
* `service.yaml`: ClusterIP Service สำหรับเป็นตัวกลางกระจาย Traffic ไปยัง Pods

---

## คำสั่งสำหรับใช้งาน (kubectl)

### 1. Apply Manifests ทั้งหมด
```bash
kubectl apply -f k8s/
```

### 2. ตรวจสอบสถานะการทำงาน
```bash
# ตรวจสอบ Deployment
kubectl get deployments -l app=pegasus-frontend

# ตรวจสอบ Pods
kubectl get pods -l app=pegasus-frontend

# ตรวจสอบ Service
kubectl get services pegasus-frontend-service
```

### 3. ตรวจสอบการ Rollout และประวัติ Revision (Class Week 9 - สไลด์หน้า 12)
```bash
# ดูสถานะการ Rollout
kubectl rollout status deployment/pegasus-frontend-deployment

# ดูประวัติ Revision
kubectl rollout history deployment/pegasus-frontend-deployment

# Rollback ไปยังเวอร์ชันก่อนหน้าหากเกิดปัญหา
kubectl rollout undo deployment/pegasus-frontend-deployment
```

---

## สรุปคอนเซปต์สำคัญที่นำมาใช้จากสไลด์

| คุณสมบัติ | สไลด์อ้างอิง | คำอธิบาย |
| :--- | :--- | :--- |
| **Replicas (3)** | Week 8 (หน้า 7), Week 9 (หน้า 8-11) | ช่วยเรื่อง High Availability และ Self-healing เมื่อ Pod ใดตาย Kubelet/Controller จะสร้างใหม่ขึ้นมาทดแทน |
| **RollingUpdate Strategy** | Week 9 (หน้า 11, 13-16) | ตั้งค่า `maxSurge: 1` และ `maxUnavailable: 0` เพื่อการันตี Zero-Downtime ระหว่าง Deploy เวอร์ชันใหม่ |
| **Resource Requests & Limits** | Week 8 (หน้า 34) | กำหนด CPU/Memory ขั้นต่ำที่ Pod ต้องการ (Requests) และเพดานสูงสุดที่อนุญาตให้ใช้ (Limits) ป้องกันการแย่งทรัพยากรบน Node |
| **Liveness & Readiness Probes** | Week 9 (หน้า 24-25) | `livenessProbe` ตรวจสอบเพื่อ Restart Pod หากค้าง, `readinessProbe` ตรวจสอบความพร้อมก่อนที่ Service จะส่ง Traffic เข้ามา |
| **ClusterIP Service** | Week 8 (หน้า 40-42) | Static virtual IP และ internal DNS ภายใน Cluster สำหรับเข้าถึง Pods อย่างมีเสถียรภาพ |
