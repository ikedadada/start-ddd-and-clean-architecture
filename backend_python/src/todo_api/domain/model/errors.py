class TodoAlreadyCompletedError(Exception):
    """Raised when trying to complete a todo that is already completed."""

    pass


class TodoNotCompletedError(Exception):
    """Raised when trying to uncomplete a todo that is not completed."""

    pass
