from __future__ import annotations

from brace_backend.core.logging import logger
from brace_backend.schemas.main_screen import (
    SizeCalculationRequest,
    SizeCalculationResponse,
)


class SizeService:
    _SIZE_TABLE = [
        {"size": "1", "waist": (74, 78), "hip": (92, 96)},
        {"size": "2", "waist": (78, 82), "hip": (96, 109)},
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
        waist_index = self._match_index(waist, "waist")
        hip_index = self._match_index(hip, "hip")

        if waist_index is not None and hip_index is not None:
            # выбираем больший размер, чтобы не пережимало
            return self._SIZE_TABLE[max(waist_index, hip_index)]["size"]
        if waist_index is not None:
            return self._SIZE_TABLE[waist_index]["size"]
        if hip_index is not None:
            return self._SIZE_TABLE[hip_index]["size"]
        return self._fallback_size(waist, hip)

    def _match_index(self, value: float, key: str) -> int | None:
        match: int | None = None
        for idx, row in enumerate(self._SIZE_TABLE):
            min_val, max_val = row[key]
            if min_val <= value <= max_val:
                match = idx
        return match

    def _fallback_size(self, waist: float, hip: float) -> str:
        # если значение вне диапазона, возвращаем ближайший край
        waist_min = self._SIZE_TABLE[0]["waist"][0]
        waist_max = self._SIZE_TABLE[-1]["waist"][1]
        hip_min = self._SIZE_TABLE[0]["hip"][0]
        hip_max = self._SIZE_TABLE[-1]["hip"][1]

        if waist <= waist_min or hip <= hip_min:
            return self._SIZE_TABLE[0]["size"]
        if waist >= waist_max or hip >= hip_max:
            return self._SIZE_TABLE[-1]["size"]
        # если внутри, но без совпадения, выбираем по ближайшему талии
        closest = min(
            self._SIZE_TABLE,
            key=lambda row: min(abs(waist - row["waist"][0]), abs(waist - row["waist"][1])),
        )
        return closest["size"]

    def _bucket_value(self, value: float) -> str:
        bucket = int(value // 5) * 5
        return f"{bucket}-{bucket + 5}"


size_service = SizeService()

__all__ = ["size_service", "SizeService"]
