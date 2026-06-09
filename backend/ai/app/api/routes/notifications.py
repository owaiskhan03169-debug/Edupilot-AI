from datetime import date

from fastapi import APIRouter

from app.core.database import get_db


# ─────────────────────────────────────────────
#  Notifications Router
# ─────────────────────────────────────────────

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("/pending", summary="Get Pending Notifications")
async def get_pending_notifications() -> list:
    """
    Returns all pending notifications from the queue.
    Includes student absence alerts and fee reminders.
    """
    db = get_db()
    notifications = await db.notification_queue.find(
        {"status": "pending"},
        {"_id": 0}
    ).sort("_id", -1).to_list(100)

    return notifications


@router.post("/mark-sent/{notification_id}", summary="Mark Notification as Sent")
async def mark_notification_sent(notification_id: str) -> dict:
    """
    Marks a notification as sent.

    Path Params:
        notification_id: MongoDB document ID
    """
    from bson import ObjectId
    db = get_db()

    await db.notification_queue.update_one(
        {"_id": ObjectId(notification_id)},
        {"$set": {"status": "sent"}}
    )
    return {"status": "marked as sent", "notification_id": notification_id}


@router.get("/alerts", summary="Get All Alerts")
async def get_all_alerts() -> list:
    """
    Returns all principal alerts — repeated absences,
    fee delays, and AI activity warnings.
    """
    db     = get_db()
    alerts = await db.alerts.find(
        {},
        {"_id": 0}
    ).sort("_id", -1).to_list(50)

    return alerts


@router.get("/alerts/today", summary="Get Today's Alerts")
async def get_today_alerts() -> list:
    """
    Returns today's alerts only.
    """
    db     = get_db()
    today  = str(date.today())
    alerts = await db.alerts.find(
        {"date": today},
        {"_id": 0}
    ).to_list(50)

    return alerts


@router.delete("/clear-sent", summary="Clear Sent Notifications")
async def clear_sent_notifications() -> dict:
    """
    Removes all sent notifications from the queue
    to keep the queue clean.
    """
    db     = get_db()
    result = await db.notification_queue.delete_many({"status": "sent"})

    return {
        "status":  "cleared",
        "deleted": result.deleted_count
    }


@router.get("/summary", summary="Notification Summary")
async def notification_summary() -> dict:
    """
    Returns a summary of all notifications
    for the principal dashboard.
    """
    db = get_db()

    pending_total    = await db.notification_queue.count_documents({"status": "pending"})
    sent_total       = await db.notification_queue.count_documents({"status": "sent"})
    absent_alerts    = await db.notification_queue.count_documents({"type": "student_absent", "status": "pending"})
    fee_reminders    = await db.notification_queue.count_documents({"type": "fee_reminder",   "status": "pending"})
    critical_alerts  = await db.alerts.count_documents({"severity": "warning"})

    return {
        "pending_notifications": pending_total,
        "sent_notifications":    sent_total,
        "absent_alerts":         absent_alerts,
        "fee_reminders":         fee_reminders,
        "critical_alerts":       critical_alerts,
    }  