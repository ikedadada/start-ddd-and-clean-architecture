from typing import Annotated, Any, cast
from uuid import UUID as StdUUID

from pydantic.functional_serializers import PlainSerializer
from pydantic.functional_validators import AfterValidator, BeforeValidator
from uuid_utils import UUID as UUIDUtils
from uuid_utils import uuid7 as _uuid7

# from python version 3.14 ~
# uuid.UUID has version 6, 7, 8 support.
# So, we can use uuid.UUID directly.
# But, currently, we use uuid_utils package.
# https://docs.python.org/ja/dev/library/uuid.html#uuid.uuid7


def _to_uuid7(value: Any) -> UUIDUtils:
    if isinstance(value, UUIDUtils):
        uuid_obj = value
    elif isinstance(value, StdUUID):
        uuid_obj = UUIDUtils(str(value))
    elif isinstance(value, str):
        uuid_obj = UUIDUtils(value)
    else:
        raise TypeError(f"Expected a UUID-compatible value, got {type(value)!r}")

    if uuid_obj.version != 7:
        raise ValueError(f"Expected a UUID7, got UUID{uuid_obj.version}")

    return uuid_obj


def _uuid7_serializer(value: UUIDUtils) -> str:
    return str(value)


UUID7 = Annotated[
    str,
    BeforeValidator(lambda value: str(value) if isinstance(value, (UUIDUtils, StdUUID)) else value),
    AfterValidator(_to_uuid7),
    PlainSerializer(_uuid7_serializer, return_type=str),
]


def uuid7() -> UUID7:
    return cast(UUID7, _to_uuid7(_uuid7()))


def parse_uuid7(value: str) -> UUID7:
    return cast(UUID7, _to_uuid7(value))
