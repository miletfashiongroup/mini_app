import pytest
from brace_backend.schemas.main_screen import SizeCalculationRequest
from brace_backend.services.size_service import size_service


@pytest.mark.parametrize(
    ("waist", "hip", "expected"),
    [
        (70, 75, "1"),
        (80, 97, "2"),
        (83, 101, "3"),
        (86, 105, "4"),
        (92, 108, "5"),
        (96, 114, "6"),
        (100, 119, "7"),
        (104, 121, "8"),
        (110, 126, "9"),
        (114, 130, "10"),
        (118, 134, "11"),
        (122, 138, "12"),
        (128, 142, "13"),
        (140, 150, "14"),
    ],
)
def test_size_service_buckets(waist, hip, expected):
    payload = SizeCalculationRequest(waist=waist, hip=hip)
    result = size_service.calculate(payload)
    assert result.size == expected
