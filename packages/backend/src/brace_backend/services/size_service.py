from __future__ import annotations

from brace_backend.core.logging import logger
from brace_backend.schemas.main_screen import (
    SizeCalculationRequest,
    SizeCalculationResponse,
)


class SizeService:
    _SIZE_TABLE = [
        {"size": "XS", "waist": (0, 75), "hip": (0, 80)},
        {"size": "S", "waist": (76, 90), "hip": (81, 95)},
        {"size": "M", "waist": (91, 100), "hip": (96, 105)},
        {"size": "L", "waist": (101, 110), "hip": (106, 120)},
        {"size": "XL", "waist": (111, 999), "hip": (121, 999)},
    ]

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
        waist_index = self._index_for_value(waist, "waist")
        hip_index = self._index_for_value(hip, "hip")
        return self._SIZE_TABLE[max(waist_index, hip_index)]["size"]

    def _index_for_value(self, value: float, key: str) -> int:
        if value <= self._SIZE_TABLE[0][key][0]:
            return 0
        if value >= self._SIZE_TABLE[-1][key][1]:
            return len(self._SIZE_TABLE) - 1
        for idx, row in enumerate(self._SIZE_TABLE):
            _, max_val = row[key]
            if value <= max_val:
                return idx
        return len(self._SIZE_TABLE) - 1

    def _bucket_value(self, value: float) -> str:
        bucket = int(value // 5) * 5
        return f"{bucket}-{bucket + 5}"


size_service = SizeService()

__all__ = ["size_service", "SizeService"]
