from typing import Annotated, Any, Literal

from pydantic import GetPydanticSchema
from pydantic_core import core_schema
from uuid_utils.compat import UUID

# from python version 3.14 ~
# uuid.UUID has version 6, 7, 8 support.
# So, we can use uuid.UUID directly.
# But, currently, we use uuid_utils package.
# https://docs.python.org/ja/dev/library/uuid.html#uuid.uuid7


def validate_uuid(val: Any, version: Literal[1, 3, 4, 5, 6, 7, 8]) -> UUID:
    if not isinstance(val, UUID):
        raise ValueError(f"Expected a UUID, got {type(val)}")
    if val.version != version:
        raise ValueError(f"Expected a UUID{version}, got UUID{val.version}")
    return val


UUID7 = Annotated[
    UUID,
    GetPydanticSchema(
        get_pydantic_core_schema=lambda _, handler: core_schema.with_info_plain_validator_function(
            lambda val, info: validate_uuid(UUID(val) if info.mode == "json" else val, version=7),
            serialization=core_schema.plain_serializer_function_ser_schema(
                lambda val, info: str(val) if info.mode == "json" else val,
                info_arg=True,
            ),
        ),
        get_pydantic_json_schema=lambda _, handler: {
            **handler(core_schema.str_schema()),
            "format": "uuid7",
        },
    ),
]


def uuid7() -> UUID7:
    from uuid_utils import uuid7

    return UUID(str(uuid7()))


def parse_uuid7(id: str) -> UUID7:
    return UUID(id)
