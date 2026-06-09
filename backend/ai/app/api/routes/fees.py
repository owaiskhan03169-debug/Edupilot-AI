import json
import re
from datetime import date, datetime

from fastapi import APIRouter

from app.ai.gemini_client import ask_gemini_json
from app.ai.prompts import fee_reminder_message
from app.core.database import get_db
from app.models.models import FeeRecord


# ─────────────────────────────────────────────
#  Fees Router
# ─────────────────────────────────────────────

router = APIRouter(prefix="/fees", tags=["Fees"])


@router.post("/add", summary="Add Fee Record")
async def add_fee_record(record: FeeRecord) -> dict:
    """
    Adds a new fee record for a student.

    Request Body:
        FeeRecord model with student_id, amount, due_date, etc.
    """
    db = get_db()
    await db.fees.insert_one(record.model_dump())
    return {"status": "added"}


@router.get("/pending", summary="Get Pending Fees")
async def get_pending_fees() -> dict:
    """
    Returns all unpaid fee records.
    """
    db   = get_db()
    fees = await db.fees.find(
        {"payment_status": "unpaid"},
        {"_id": 0}
    ).to_list(200)

    return {
        "pending_count": len(fees),
        "fees":          fees,
    }


@router.post("/mark-paid/{student_id}", summary="Mark Fee as Paid")
async def mark_fee_paid(student_id: str) -> dict:
    """
    Marks a student's fee as paid and removes
    any pending fee reminders from the notification queue.

    Path Params:
        student_id: Student's unique ID
    """
    db = get_db()

    # Update fee status
    await db.fees.update_one(
        {"student_id": student_id},
        {"$set": {"payment_status": "paid"}}
    )

    # Remove pending reminders
    await db.notification_queue.delete_many({
        "type":       "fee_reminder",
        "student_id": student_id,
    })

    return {"status": "marked as paid", "student_id": student_id}


@router.post("/scan-reminders", summary="Scan and Queue Fee Reminders")
async def scan_and_send_reminders() -> dict:
    """
    Scans all unpaid fees and queues AI-generated
    reminders for overdue payments based on grace period policy.
    """
    db     = get_db()
    today  = date.today()
    fees   = await db.fees.find({"payment_status": "unpaid"}, {"_id": 0}).to_list(500)
    queued = 0

    for fee in fees:
        try:
            due_date     = datetime.strptime(fee["due_date"], "%Y-%m-%d").date()
            days_overdue = (today - due_date).days
            grace        = fee.get("grace_period_days", 5)

            if days_overdue < grace:
                continue

            # Fetch student details
            student = await db.students.find_one({"student_id": fee["student_id"]})
            if not student:
                continue

            # Generate AI reminder message
            prompt    = fee_reminder_message(
                student["name"],
                fee["amount"],
                fee["due_date"],
                days_overdue,
            )
            ai_result = await ask_gemini_json(prompt)
            clean     = re.sub(r"```json|```", "", ai_result).strip()
            messages  = json.loads(clean)

            # Upsert reminder into notification queue
            await db.notification_queue.update_one(
                {"type": "fee_reminder", "student_id": fee["student_id"]},
                {"$set": {
                    "type":           "fee_reminder",
                    "student_id":     fee["student_id"],
                    "parent_contact": student.get("parent_contact"),
                    "message":        messages.get("urdu_message", ""),
                    "days_overdue":   days_overdue,
                    "status":         "pending",
                }},
                upsert=True,
            )
            queued += 1

        except Exception:
            continue

    return {"status": "scan complete", "reminders_queued": queued}


@router.get("/analytics", summary="Fee Analytics")
async def fee_analytics() -> dict:
    """
    Returns fee collection analytics for the principal dashboard.
    """
    db     = get_db()
    total  = await db.fees.count_documents({})
    paid   = await db.fees.count_documents({"payment_status": "paid"})
    unpaid = total - paid

    # Calculate total amount collected
    paid_records = await db.fees.find(
        {"payment_status": "paid"}, {"amount": 1}
    ).to_list(1000)
    collected = sum(r.get("amount", 0) for r in paid_records)

    return {
        "total_students":  total,
        "paid":            paid,
        "unpaid":          unpaid,
        "collection_rate": round((paid / total * 100), 1) if total else 0,
        "amount_collected": collected,
    }