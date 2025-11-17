from typing import Generic, TypeVar

from pydantic import BaseModel, Field


class Pagination(BaseModel):
    page: int = Field(ge=1)
    page_size: int = Field(ge=1, le=200)
    total: int = Field(ge=0)
    pages: int = Field(ge=1)


class InitDataPayload(BaseModel):
    init_data: str


T = TypeVar("T")


class ErrorResponse(BaseModel):
    type: str
    message: str


class BaseResponse(BaseModel, Generic[T]):
    data: T | None = None
    error: ErrorResponse | None = None
    pagination: Pagination | None = None


class SuccessResponse(BaseResponse[T], Generic[T]):
    data: T
    error: ErrorResponse | None = None
