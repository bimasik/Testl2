from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Set


@dataclass
class CharacterProfile:
    character_id: str
    account_id: str
    level: int = 1
    hp: float = 100.0
    max_hp: float = 100.0
    mp: float = 50.0
    max_mp: float = 50.0
    statuses: Set[str] = field(default_factory=set)
    cooldown_ends: Dict[str, float] = field(default_factory=dict)


@dataclass
class InventoryItem:
    item_id: str
    count: int


@dataclass
class InventoryState:
    character_id: str
    items: Dict[str, InventoryItem] = field(default_factory=dict)
    max_slots: int = 30


@dataclass
class EquipmentState:
    character_id: str
    slots: Dict[str, str] = field(default_factory=dict)  # slot -> item_id


@dataclass
class OperationResult:
    ok: bool
    fail_reason: Optional[str] = None
    message: str = ""
    data: Dict = field(default_factory=dict)


@dataclass
class IdempotencyRecord:
    key: str
    operation: str
    result: OperationResult


@dataclass
class AbilitySpec:
    ability_id: str
    resource_type: str
    resource_cost: float
    cooldown_sec: float
    required_status_absent: Optional[str] = None
