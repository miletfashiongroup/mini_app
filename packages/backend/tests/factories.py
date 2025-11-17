import uuid

import factory
from brace_backend.domain.cart import CartItem
from brace_backend.domain.order import Order, OrderItem
from brace_backend.domain.product import Product, ProductVariant
from brace_backend.domain.user import User
from factory import fuzzy


class UserFactory(factory.Factory):
    class Meta:
        model = User

    id = factory.LazyFunction(uuid.uuid4)
    telegram_id = factory.Sequence(lambda n: 1_000_000 + n)
    first_name = factory.Faker("first_name")
    last_name = factory.Faker("last_name")
    username = factory.Faker("user_name")
    language_code = "ru"


class ProductFactory(factory.Factory):
    class Meta:
        model = Product

    id = factory.LazyFunction(uuid.uuid4)
    name = factory.Sequence(lambda n: f"Product {n}")
    description = factory.Faker("sentence")
    hero_media_url = factory.Faker("image_url")


class ProductVariantFactory(factory.Factory):
    class Meta:
        model = ProductVariant

    id = factory.LazyFunction(uuid.uuid4)
    product = factory.SubFactory(ProductFactory)
    product_id = factory.LazyAttribute(lambda obj: obj.product.id)
    size = fuzzy.FuzzyChoice(["S", "M", "L", "XL"])
    price = 39.99
    stock = 100


class CartItemFactory(factory.Factory):
    class Meta:
        model = CartItem

    id = factory.LazyFunction(uuid.uuid4)
    user = factory.SubFactory(UserFactory)
    user_id = factory.LazyAttribute(lambda obj: obj.user.id)
    product = factory.SubFactory(ProductFactory)
    product_id = factory.LazyAttribute(lambda obj: obj.product.id)
    size = fuzzy.FuzzyChoice(["M", "L"])
    quantity = 1
    unit_price = 29.99


class OrderFactory(factory.Factory):
    class Meta:
        model = Order

    id = factory.LazyFunction(uuid.uuid4)
    user = factory.SubFactory(UserFactory)
    user_id = factory.LazyAttribute(lambda obj: obj.user.id)
    status = "pending"
    total_amount = 0


class OrderItemFactory(factory.Factory):
    class Meta:
        model = OrderItem

    id = factory.LazyFunction(uuid.uuid4)
    order = factory.SubFactory(OrderFactory)
    order_id = factory.LazyAttribute(lambda obj: obj.order.id)
    product = factory.SubFactory(ProductFactory)
    product_id = factory.LazyAttribute(lambda obj: obj.product.id)
    size = fuzzy.FuzzyChoice(["S", "M", "L", "XL"])
    quantity = 1
    unit_price = 29.99
