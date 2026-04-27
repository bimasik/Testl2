from enum import Enum


class OpFailReason(str, Enum):
    INVALID_TARGET = "InvalidTarget"
    OUT_OF_RANGE = "OutOfRange"
    NOT_ENOUGH_RESOURCE = "NotEnoughResource"
    ON_COOLDOWN = "OnCooldown"
    BLOCKED_BY_STATUS = "BlockedByStatus"
    MISSING_DATA_PROFILE = "MissingDataProfile"
    INTERNAL_STATE_CONFLICT = "InternalStateConflict"
    UNAUTHORIZED = "Unauthorized"
    NOT_FOUND = "NotFound"
    IDEMPOTENCY_CONFLICT = "IdempotencyConflict"
