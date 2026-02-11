import pytest
from brace_backend.schemas.main_screen import SizeCalculationRequest
from brace_backend.services.size_service import size_service


@pytest.mark.parametrize(
    ("waist", "hip", "expected"),
    [
        (70, 75, "1"),
        (80, 97, "2"),
        (83, 101, "3"),
        (92, 98, "5"),
        (104, 121, "8"),
        (110, 126, "9"),
        (118, 140, "12"),
        (140, 150, "14"),
    ],
)
def test_size_service_buckets(waist, hip, expected):
    payload = SizeCalculationRequest(waist=waist, hip=hip)
    result = size_service.calculate(payload)
    assert result.size == expected
