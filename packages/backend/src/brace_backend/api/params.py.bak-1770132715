from fastapi import Query


class PaginationParams:
    def __init__(
        self,
        page: int | None = Query(default=None, ge=1),
        page_size: int | None = Query(default=None, ge=1, le=200),
    ) -> None:
        self.page = page
        self.page_size = page_size

    def normalized(self, total_items: int) -> tuple[int, int, bool]:
        if self.page is None or self.page_size is None:
            return (1, total_items or 1, True)
        return (self.page, self.page_size, False)
