from __future__ import annotations

from decimal import ROUND_HALF_UP, Decimal

MONEY_QUANT = Decimal("0.01")
MINOR_UNIT_MULTIPLIER = Decimal("100")
# PRINCIPAL-NOTE: Monetary math runs through this module so rounding/safety stays consistent.


def to_minor_units(amount: Decimal | float | int | str) -> int:
    """Convert a Decimal-compatible amount into integer minor units (kopeks)."""
    decimal_amount = (
        amount
        if isinstance(amount, Decimal)
        else Decimal(str(amount))
    )
    quantized = decimal_amount.quantize(MONEY_QUANT, rounding=ROUND_HALF_UP)
    return int((quantized * MINOR_UNIT_MULTIPLIER).to_integral_value(rounding=ROUND_HALF_UP))


def from_minor_units(value: int) -> Decimal:
    """Represent stored minor units back as a Decimal for presentation."""
    return (Decimal(value) / MINOR_UNIT_MULTIPLIER).quantize(MONEY_QUANT, rounding=ROUND_HALF_UP)


def apply_percentage_discount(amount_minor_units: int, percent: Decimal) -> int:
    """Apply a percentage discount while keeping deterministic rounding."""
    decimal_amount = from_minor_units(amount_minor_units)
    discount = (decimal_amount * percent / Decimal("100")).quantize(
        MONEY_QUANT, rounding=ROUND_HALF_UP
    )
    discounted = decimal_amount - discount
    return to_minor_units(discounted)


__all__ = ["MONEY_QUANT", "from_minor_units", "to_minor_units", "apply_percentage_discount"]
