from decimal import Decimal

from brace_backend.core.money import (
    apply_percentage_discount,
    from_minor_units,
    to_minor_units,
)


def test_to_minor_units_rounds_half_up():
    """Fractional pennies must round consistently towards the customer."""
    assert to_minor_units(Decimal("10.005")) == 1001  # PRINCIPAL-NOTE: Rounding guardrail.
    assert to_minor_units("7.994") == 799


def test_from_minor_units_returns_decimal():
    """Converting minor units back should preserve two decimal places."""
    amount = from_minor_units(1234)
    assert amount == Decimal("12.34")


def test_apply_percentage_discount_handles_rounding():
    """Discount helpers must round to the nearest kopek to avoid drift."""
    discounted = apply_percentage_discount(1000, Decimal("12.5"))
    assert discounted == 875
