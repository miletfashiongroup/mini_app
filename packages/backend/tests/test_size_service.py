import pytest
from brace_backend.schemas.main_screen import SizeCalculationRequest
from brace_backend.services.size_service import size_service


@pytest.mark.parametrize(
    ("waist", "hip", "expected"),
    [
        (74, 92, "1"),
        (80, 100, "2"),
        (92, 108, "5"),
        (104, 123, "8"),
        (118, 142, "13"),
    ],
)
def test_size_service_buckets(waist, hip, expected):
    payload = SizeCalculationRequest(waist=waist, hip=hip)
    result = size_service.calculate(payload)
    assert result.size == expected
