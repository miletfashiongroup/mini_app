import pytest

from brace_backend.schemas.main_screen import SizeCalculationRequest
from brace_backend.services.size_service import size_service


@pytest.mark.parametrize(
    ("waist", "hip", "expected"),
    [
        (70, 75, "XS"),
        (85, 90, "S"),
        (95, 100, "M"),
        (105, 110, "L"),
        (115, 130, "XL"),
    ],
)
def test_size_service_buckets(waist, hip, expected):
    payload = SizeCalculationRequest(waist=waist, hip=hip)
    result = size_service.calculate(payload)
    assert result.size == expected
