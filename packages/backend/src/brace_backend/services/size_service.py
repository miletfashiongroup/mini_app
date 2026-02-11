from __future__ import annotations

from brace_backend.core.logging import logger
from brace_backend.schemas.main_screen import (
    SizeCalculationRequest,
    SizeCalculationResponse,
)


class SizeService:
    _SIZE_TABLE = [
        {"size": "1", "waist": (74, 78), "hip": (92, 96)},
        {"size": "2", "waist": (78, 82), "hip": (96, 100)},
        {"size": "3", "waist": (82, 86), "hip": (100, 104)},
        {"size": "4", "waist": (86, 90), "hip": (104, 108)},
        {"size": "5", "waist": (90, 94), "hip": (108, 112)},
        {"size": "6", "waist": (94, 98), "hip": (112, 116)},
        {"size": "7", "waist": (98, 103), "hip": (116, 120)},
        {"size": "8", "waist": (103, 107), "hip": (120, 124)},
        {"size": "9", "waist": (107, 112), "hip": (124, 128)},
        {"size": "10", "waist": (112, 117), "hip": (128, 132)},
        {"size": "11", "waist": (117, 121), "hip": (132, 136)},
        {"size": "12", "waist": (121, 126), "hip": (136, 140)},
        {"size": "13", "waist": (126, 130), "hip": (140, 144)},
        {"size": "14", "waist": (130, 134), "hip": (144, 148)},
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
