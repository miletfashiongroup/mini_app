from uuid import UUID

from fastapi import APIRouter, Body, Depends, Path, Query, Request, status

from brace_backend.api.deps import get_current_user, get_uow
from brace_backend.core.exceptions import AccessDeniedError, ValidationError
from brace_backend.core.limiter import limiter
from brace_backend.db.uow import UnitOfWork
from brace_backend.domain.support import SupportTicket
from brace_backend.domain.support_message import SupportMessage
from brace_backend.domain.user import User
from brace_backend.schemas.common import SuccessResponse
from brace_backend.schemas.support import SupportTicketCreate, SupportTicketRead, SupportTicketStatusUpdate
from brace_backend.schemas.support_message import SupportMessageCreate, SupportMessageRead
from brace_backend.services.support_service import support_service
from brace_backend.services.support_chat_service import support_chat_service

router = APIRouter(prefix="/support", tags=["Support"])


def _to_ticket_read(ticket: SupportTicket) -> SupportTicketRead:
    return SupportTicketRead(
        id=ticket.id,
        user_id=ticket.user_id,
        order_id=ticket.order_id,
        status=ticket.status,
        priority=ticket.priority,
        subject=ticket.subject,
        message=ticket.message,
        manager_comment=ticket.manager_comment,
        meta=ticket.meta,
        created_at=ticket.created_at,
        updated_at=ticket.updated_at,
    )


def _to_message_read(message: SupportMessage) -> SupportMessageRead:
    return SupportMessageRead(
        id=message.id,
        ticket_id=message.ticket_id,
        sender=message.sender,
        text=message.text,
        meta=message.meta,
        created_at=message.created_at,
        updated_at=message.updated_at,
    )


def _ensure_ticket_access(ticket: SupportTicket | None, user: User) -> SupportTicket:
    if ticket is None:
        raise AccessDeniedError("Ticket not found")
    if (user.role or "").lower() == "admin":
        return ticket
    if ticket.user_id != user.id:
        raise AccessDeniedError("Forbidden")
    return ticket


@router.post(
    "/tickets",
    response_model=SuccessResponse[SupportTicketRead],
    status_code=status.HTTP_201_CREATED,
)
@limiter.limit("10/minute")
async def create_support_ticket(
    request: Request,
    payload: SupportTicketCreate = Body(...),
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_uow),
) -> SuccessResponse[SupportTicketRead]:
    ticket = await support_service.create_ticket(
        uow,
        user_id=current_user.id,
        subject=payload.subject,
        message=payload.message,
        order_id=payload.order_id,
        priority=payload.priority or "normal",
        contact=payload.contact,
        category=payload.category,
    )
    return SuccessResponse[SupportTicketRead](data=_to_ticket_read(ticket))


@router.get("/tickets", response_model=SuccessResponse[list[SupportTicketRead]])
@limiter.limit("30/minute")
async def list_support_tickets(
    request: Request,
    status: str | None = Query(default=None),
    limit: int = Query(default=100, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_uow),
) -> SuccessResponse[list[SupportTicketRead]]:
    if (current_user.role or "").lower() == "admin":
        tickets = await support_service.list_tickets(uow, status=status, limit=limit, offset=offset)
    else:
        tickets = await uow.support_tickets.list_for_user(
            user_id=current_user.id, limit=limit, offset=offset
        )
    data = [_to_ticket_read(ticket) for ticket in tickets]
    return SuccessResponse[list[SupportTicketRead]](data=data)


@router.post(
    "/tickets/{ticket_id}/status",
    response_model=SuccessResponse[SupportTicketRead],
)
@limiter.limit("20/minute")
async def update_ticket_status(
    request: Request,
    ticket_id: UUID = Path(...),
    payload: SupportTicketStatusUpdate = Body(...),
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_uow),
) -> SuccessResponse[SupportTicketRead]:
    ticket = await uow.support_tickets.session.get(SupportTicket, ticket_id)
    ticket = _ensure_ticket_access(ticket, current_user)

    # users can toggle только open/closed; админ может любой разрешенный статус
    allowed = {"open", "closed"} if (current_user.role or "").lower() != "admin" else None
    new_status = payload.status.lower().strip()
    if allowed is not None and new_status not in allowed:
        raise ValidationError("Недоступный статус")

    ticket = await support_service.update_status(uow, ticket=ticket, status=new_status)
    return SuccessResponse[SupportTicketRead](data=_to_ticket_read(ticket))


@router.get(
    "/tickets/{ticket_id}/messages",
    response_model=SuccessResponse[list[SupportMessageRead]],
)
@limiter.limit("60/minute")
async def list_support_messages(
    request: Request,
    ticket_id: UUID = Path(...),
    limit: int = Query(default=200, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_uow),
) -> SuccessResponse[list[SupportMessageRead]]:
    ticket = await uow.support_tickets.session.get(SupportTicket, ticket_id)
    ticket = _ensure_ticket_access(ticket, current_user)
    messages = await support_chat_service.list_messages(uow, ticket_id=ticket.id, limit=limit, offset=offset)
    data = [_to_message_read(m) for m in messages]
    if not data and ticket.message:
        # Fallback: include original message as history if no stored messages (legacy tickets)
        data.append(
            SupportMessageRead(
                id=ticket.id,
                ticket_id=ticket.id,
                sender="user",
                text=ticket.message,
                meta=None,
                created_at=ticket.created_at,
                updated_at=ticket.updated_at,
            )
        )
    return SuccessResponse[list[SupportMessageRead]](data=data)


@router.post(
    "/tickets/{ticket_id}/messages",
    response_model=SuccessResponse[SupportMessageRead],
    status_code=status.HTTP_201_CREATED,
)
@limiter.limit("30/minute")
async def add_support_message(
    request: Request,
    ticket_id: UUID = Path(...),
    payload: SupportMessageCreate = Body(...),
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_uow),
) -> SuccessResponse[SupportMessageRead]:
    ticket = await uow.support_tickets.session.get(SupportTicket, ticket_id)
    ticket = _ensure_ticket_access(ticket, current_user)
    if ticket.status == "closed":
        raise ValidationError("Тикет закрыт. Создайте новое обращение.")
    message = await support_chat_service.send_user_message(
        uow, ticket=ticket, user_id=current_user.id, text=payload.text
    )
    return SuccessResponse[SupportMessageRead](data=_to_message_read(message))


__all__ = ["router"]
