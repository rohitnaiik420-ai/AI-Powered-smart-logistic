import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.all_models import Alert, AlertSeverity, AlertStatus
from ..schemas.all_schemas import AlertResponse, AlertStatusUpdate

router = APIRouter(prefix="/alerts", tags=["Smart Alert Management"])

@router.get("/", response_model=List[AlertResponse])
def list_alerts(
    status: Optional[str] = None, # ACTIVE, ACKNOWLEDGED, RESOLVED, ALL
    severity: Optional[str] = None, # CRITICAL, HIGH, MEDIUM, LOW, ALL
    db: Session = Depends(get_db)
):
    query = db.query(Alert)
    if status and status != "ALL":
        query = query.filter(Alert.status == status)
    if severity and severity != "ALL":
        query = query.filter(Alert.severity == severity)
    return query.order_by(Alert.timestamp.desc()).all()

@router.put("/{alert_id}/status")
def update_alert_status(alert_id: int, payload: AlertStatusUpdate, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.status = payload.status
    if payload.status == AlertStatus.ACKNOWLEDGED:
        alert.acknowledged_by = payload.user_name or "Logistics Officer"
    elif payload.status == AlertStatus.RESOLVED:
        alert.resolved_by = payload.user_name or "Logistics Officer"
        alert.resolved_at = datetime.datetime.utcnow()
        if payload.action_notes:
            alert.recommended_action += f" | Resolution Note: {payload.action_notes}"

    db.commit()
    db.refresh(alert)
    return {
        "status": "SUCCESS",
        "alert_id": alert.id,
        "new_status": alert.status,
        "message": f"Alert {alert.alert_code} marked as {alert.status}."
    }
