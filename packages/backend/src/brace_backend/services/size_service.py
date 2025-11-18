from __future__ import annotations

from brace_backend.core.logging import logger
from brace_backend.schemas.main_screen import (
    SizeCalculationRequest,
    SizeCalculationResponse,
)


class SizeService:
    def calculate(self, payload: SizeCalculationRequest) -> SizeCalculationResponse:
        size = self._determine_size(payload.waist, payload.hip)
        logger.info(
            "size calculation completed",
            waist_bucket=self._bucket_value(payload.waist),
            hip_bucket=self._bucket_value(payload.hip),
            size=size,
        )
        return SizeCalculationResponse(size=size)

    def _determine_size(self, waist: float, hip: float) -> str:
        score = (waist + hip) / 2
        if score < 80:
            return "XS"
        if score < 90:
            return "S"
        if score < 100:
            return "M"
        if score < 110:
            return "L"
        return "XL"

    def _bucket_value(self, value: float) -> str:
        bucket = int(value // 5) * 5
        return f"{bucket}-{bucket + 5}"


size_service = SizeService()

__all__ = ["size_service", "SizeService"]
