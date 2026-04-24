from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict

from .models import CharacterProfile, EquipmentState, IdempotencyRecord, InventoryState


@dataclass
class InMemoryStorage:
    accounts: Dict[str, str] = field(default_factory=dict)  # account_id -> token
    profiles: Dict[str, CharacterProfile] = field(default_factory=dict)
    inventories: Dict[str, InventoryState] = field(default_factory=dict)
    equipments: Dict[str, EquipmentState] = field(default_factory=dict)
    idempotency: Dict[str, IdempotencyRecord] = field(default_factory=dict)


storage = InMemoryStorage()
