import pytest
from brace_backend.schemas.main_screen import SizeCalculationRequest
from brace_backend.services.size_service import size_service


@pytest.mark.parametrize(
    ("waist", "hip", "expected"),
    [
        (70, 75, "1"),
        (85, 90, "4"),
        (95, 100, "6"),
        (105, 110, "8"),
        (115, 130, "10"),
    ],
)
def test_size_service_buckets(waist, hip, expected):
    payload = SizeCalculationRequest(waist=waist, hip=hip)
    result = size_service.calculate(payload)
    assert result.size == expected
