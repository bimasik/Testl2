from __future__ import annotations

import time
from dataclasses import asdict
from typing import Dict, List, Optional

from .models import (
    AbilitySpec,
    CharacterProfile,
    EquipmentState,
    IdempotencyRecord,
    InventoryItem,
    InventoryState,
    OperationResult,
)
from .op_fail_reason import OpFailReason
from .storage import storage


class AuthService:
    @staticmethod
    def register(account_id: str, token: str) -> OperationResult:
        storage.accounts[account_id] = token
        storage.account_characters.setdefault(account_id, [])
        return OperationResult(ok=True, data={"account_id": account_id})

    @staticmethod
    def authorize(account_id: str, token: str) -> bool:
        return storage.accounts.get(account_id) == token


class ProfileService:
    @staticmethod
    def load_or_create(account_id: str, character_id: str) -> CharacterProfile:
        if character_id not in storage.profiles:
            storage.profiles[character_id] = CharacterProfile(
                character_id=character_id,
                account_id=account_id,
                character_name=character_id,
                character_class="Adventurer",
            )
        if character_id not in storage.inventories:
            storage.inventories[character_id] = InventoryState(character_id=character_id)
        if character_id not in storage.equipments:
            storage.equipments[character_id] = EquipmentState(character_id=character_id)
        if character_id not in storage.account_characters.get(account_id, []):
            storage.account_characters.setdefault(account_id, []).append(character_id)
        return storage.profiles[character_id]

    @staticmethod
    def get(character_id: str) -> Optional[CharacterProfile]:
        return storage.profiles.get(character_id)


class IdempotencyService:
    @staticmethod
    def replay_or_start(key: str, operation: str) -> Optional[OperationResult]:
        record = storage.idempotency.get(key)
        if record is None:
            return None
        if record.operation != operation:
            return OperationResult(
                ok=False,
                fail_reason=OpFailReason.IDEMPOTENCY_CONFLICT.value,
                message="Idempotency key already used for a different operation",
            )
        return record.result

    @staticmethod
    def commit(key: str, operation: str, result: OperationResult) -> None:
        storage.idempotency[key] = IdempotencyRecord(key=key, operation=operation, result=result)


class CharacterService:
    MAX_CHARACTERS_PER_ACCOUNT = 3
    ALLOWED_CLASSES = {"Warrior", "Mage", "Archer", "Adventurer"}

    @staticmethod
    def _character_summary(character: CharacterProfile) -> Dict:
        return {
            "character_id": character.character_id,
            "character_name": character.character_name,
            "character_class": character.character_class,
            "level": character.level,
        }

    @classmethod
    def _account_characters(cls, account_id: str) -> List[CharacterProfile]:
        char_ids = storage.account_characters.get(account_id, [])
        return [storage.profiles[cid] for cid in char_ids if cid in storage.profiles]

    @classmethod
    def create_character(
        cls,
        account_id: str,
        character_name: str,
        character_class: str,
        *,
        idempotency_key: str,
    ) -> OperationResult:
        op = "character.create"
        replay = IdempotencyService.replay_or_start(idempotency_key, op)
        if replay is not None:
            return replay

        if account_id not in storage.accounts:
            result = OperationResult(False, OpFailReason.NOT_FOUND.value, "Account not found")
            IdempotencyService.commit(idempotency_key, op, result)
            return result

        normalized_name = character_name.strip()
        if not normalized_name:
            result = OperationResult(False, OpFailReason.MISSING_DATA_PROFILE.value, "Character name is required")
            IdempotencyService.commit(idempotency_key, op, result)
            return result

        if character_class not in cls.ALLOWED_CLASSES:
            result = OperationResult(False, OpFailReason.MISSING_DATA_PROFILE.value, "Invalid character class")
            IdempotencyService.commit(idempotency_key, op, result)
            return result

        if len(storage.account_characters.get(account_id, [])) >= cls.MAX_CHARACTERS_PER_ACCOUNT:
            result = OperationResult(False, OpFailReason.INTERNAL_STATE_CONFLICT.value, "Character limit reached")
            IdempotencyService.commit(idempotency_key, op, result)
            return result

        account_names = storage.character_names_by_account.setdefault(account_id, set())
        lowered_name = normalized_name.lower()
        if lowered_name in account_names:
            result = OperationResult(False, OpFailReason.INTERNAL_STATE_CONFLICT.value, "Character name already exists")
            IdempotencyService.commit(idempotency_key, op, result)
            return result

        character_id = f"char_{len(storage.profiles) + 1}"
        profile = CharacterProfile(
            character_id=character_id,
            account_id=account_id,
            character_name=normalized_name,
            character_class=character_class,
        )
        storage.profiles[character_id] = profile
        storage.inventories[character_id] = InventoryState(character_id=character_id)
        storage.equipments[character_id] = EquipmentState(character_id=character_id)
        storage.account_characters.setdefault(account_id, []).append(character_id)
        account_names.add(lowered_name)

        result = OperationResult(ok=True, data={"character": cls._character_summary(profile)})
        IdempotencyService.commit(idempotency_key, op, result)
        return result

    @classmethod
    def list_characters(cls, account_id: str) -> OperationResult:
        if account_id not in storage.accounts:
            return OperationResult(False, OpFailReason.NOT_FOUND.value, "Account not found")

        characters = [cls._character_summary(profile) for profile in cls._account_characters(account_id)]
        return OperationResult(
            ok=True,
            data={
                "characters": characters,
                "active_character_id": storage.active_character_by_account.get(account_id),
                "max_characters": cls.MAX_CHARACTERS_PER_ACCOUNT,
            },
        )

    @classmethod
    def select_character(cls, account_id: str, character_id: str, *, idempotency_key: str) -> OperationResult:
        op = "character.select"
        replay = IdempotencyService.replay_or_start(idempotency_key, op)
        if replay is not None:
            return replay

        if account_id not in storage.accounts:
            result = OperationResult(False, OpFailReason.NOT_FOUND.value, "Account not found")
            IdempotencyService.commit(idempotency_key, op, result)
            return result

        if character_id not in storage.account_characters.get(account_id, []):
            result = OperationResult(False, OpFailReason.NOT_FOUND.value, "Character not found for this account")
            IdempotencyService.commit(idempotency_key, op, result)
            return result

        storage.active_character_by_account[account_id] = character_id
        character = storage.profiles[character_id]
        result = OperationResult(ok=True, data={"selected_character": cls._character_summary(character)})
        IdempotencyService.commit(idempotency_key, op, result)
        return result


class MainMenuService:
    @staticmethod
    def load(account_id: str) -> OperationResult:
        characters = CharacterService.list_characters(account_id)
        if not characters.ok:
            return characters

        return OperationResult(
            ok=True,
            data={
                "menu": {
                    "account_id": account_id,
                    "characters": characters.data["characters"],
                    "active_character_id": characters.data["active_character_id"],
                    "max_characters": characters.data["max_characters"],
                    "actions": ["create_character", "select_character", "enter_world"],
                }
            },
        )


class InventoryService:
    @staticmethod
    def _state(character_id: str) -> Optional[InventoryState]:
        return storage.inventories.get(character_id)

    @classmethod
    def add_item(
        cls,
        character_id: str,
        item_id: str,
        count: int,
        *,
        idempotency_key: str,
    ) -> OperationResult:
        op = "inventory.add_item"
        replay = IdempotencyService.replay_or_start(idempotency_key, op)
        if replay is not None:
            return replay

        state = cls._state(character_id)
        if state is None:
            result = OperationResult(False, OpFailReason.NOT_FOUND.value, "Inventory not found")
            IdempotencyService.commit(idempotency_key, op, result)
            return result

        if count <= 0:
            result = OperationResult(False, OpFailReason.INTERNAL_STATE_CONFLICT.value, "Count must be > 0")
            IdempotencyService.commit(idempotency_key, op, result)
            return result

        if item_id not in state.items and len(state.items) >= state.max_slots:
            result = OperationResult(False, OpFailReason.INTERNAL_STATE_CONFLICT.value, "Inventory full")
            IdempotencyService.commit(idempotency_key, op, result)
            return result

        item = state.items.get(item_id)
        if item is None:
            state.items[item_id] = InventoryItem(item_id=item_id, count=count)
        else:
            item.count += count

        result = OperationResult(True, data={"item_id": item_id, "count": state.items[item_id].count})
        IdempotencyService.commit(idempotency_key, op, result)
        return result

    @classmethod
    def remove_item(
        cls,
        character_id: str,
        item_id: str,
        count: int,
        *,
        idempotency_key: str,
    ) -> OperationResult:
        op = "inventory.remove_item"
        replay = IdempotencyService.replay_or_start(idempotency_key, op)
        if replay is not None:
            return replay

        state = cls._state(character_id)
        if state is None:
            result = OperationResult(False, OpFailReason.NOT_FOUND.value, "Inventory not found")
            IdempotencyService.commit(idempotency_key, op, result)
            return result

        item = state.items.get(item_id)
        if item is None or item.count < count:
            result = OperationResult(False, OpFailReason.INTERNAL_STATE_CONFLICT.value, "Not enough item count")
            IdempotencyService.commit(idempotency_key, op, result)
            return result

        item.count -= count
        if item.count == 0:
            del state.items[item_id]

        result = OperationResult(True, data={"item_id": item_id, "remaining": item.count if item_id in state.items else 0})
        IdempotencyService.commit(idempotency_key, op, result)
        return result


class EquipmentService:
    @staticmethod
    def _state(character_id: str) -> Optional[EquipmentState]:
        return storage.equipments.get(character_id)

    @classmethod
    def equip_item(
        cls,
        character_id: str,
        slot: str,
        item_id: str,
        *,
        idempotency_key: str,
    ) -> OperationResult:
        """
        Transaction pattern:
        Validate -> Reserve(remove from inventory) -> Apply(slot update) -> Confirm
        rollback: if apply failed after reserve, return item back.
        """
        op = "equipment.equip_item"
        replay = IdempotencyService.replay_or_start(idempotency_key, op)
        if replay is not None:
            return replay

        eq = cls._state(character_id)
        if eq is None:
            result = OperationResult(False, OpFailReason.NOT_FOUND.value, "Equipment not found")
            IdempotencyService.commit(idempotency_key, op, result)
            return result

        # Validate + Reserve
        reserve = InventoryService.remove_item(
            character_id,
            item_id,
            1,
            idempotency_key=f"{idempotency_key}:reserve",
        )
        if not reserve.ok:
            result = OperationResult(False, reserve.fail_reason, f"Reserve failed: {reserve.message}")
            IdempotencyService.commit(idempotency_key, op, result)
            return result

        # Save old slot for rollback
        old_item = eq.slots.get(slot)
        try:
            eq.slots[slot] = item_id
            if old_item:
                # return old item to inventory
                restore_old = InventoryService.add_item(
                    character_id,
                    old_item,
                    1,
                    idempotency_key=f"{idempotency_key}:old_item_restore",
                )
                if not restore_old.ok:
                    raise RuntimeError("Failed to restore old equipped item")
        except Exception as exc:
            # rollback reserve
            InventoryService.add_item(
                character_id,
                item_id,
                1,
                idempotency_key=f"{idempotency_key}:rollback_reserved",
            )
            result = OperationResult(False, OpFailReason.INTERNAL_STATE_CONFLICT.value, f"Equip failed: {exc}")
            IdempotencyService.commit(idempotency_key, op, result)
            return result

        result = OperationResult(True, data={"slot": slot, "item_id": item_id})
        IdempotencyService.commit(idempotency_key, op, result)
        return result


class CombatValidationService:
    # server-side source of truth for ability contracts
    ability_specs: Dict[str, AbilitySpec] = {
        "Fireball": AbilitySpec("Fireball", "mp", 20.0, 5.0, required_status_absent="Stun"),
        "QuickStrike": AbilitySpec("QuickStrike", "mp", 5.0, 1.0, required_status_absent="Stun"),
    }

    @classmethod
    def validate_and_commit_ability(
        cls,
        character_id: str,
        ability_id: str,
        now: Optional[float] = None,
    ) -> OperationResult:
        profile = ProfileService.get(character_id)
        if profile is None:
            return OperationResult(False, OpFailReason.NOT_FOUND.value, "Character not found")

        spec = cls.ability_specs.get(ability_id)
        if spec is None:
            return OperationResult(False, OpFailReason.MISSING_DATA_PROFILE.value, "Ability profile missing")

        ts = now if now is not None else time.time()
        if spec.required_status_absent and spec.required_status_absent in profile.statuses:
            return OperationResult(False, OpFailReason.BLOCKED_BY_STATUS.value, "Ability blocked by status")

        cooldown_end = profile.cooldown_ends.get(ability_id, 0.0)
        if cooldown_end > ts:
            return OperationResult(False, OpFailReason.ON_COOLDOWN.value, "Ability on cooldown")

        if spec.resource_type == "mp" and profile.mp < spec.resource_cost:
            return OperationResult(False, OpFailReason.NOT_ENOUGH_RESOURCE.value, "Not enough MP")

        # Commit cost once (server-authoritative)
        if spec.resource_type == "mp":
            profile.mp -= spec.resource_cost

        profile.cooldown_ends[ability_id] = ts + spec.cooldown_sec

        return OperationResult(
            True,
            data={
                "ability_id": ability_id,
                "mp_left": profile.mp,
                "cooldown_end": profile.cooldown_ends[ability_id],
            },
        )


def seed_demo_state() -> Dict:
    AuthService.register("acc_1", "token_1")
    created = CharacterService.create_character(
        "acc_1",
        "Aerin",
        "Mage",
        idempotency_key="seed:create_character",
    )
    character_id = created.data["character"]["character_id"] if created.ok else "char_1"
    profile = ProfileService.get(character_id)
    if profile is None:
        profile = ProfileService.load_or_create("acc_1", character_id)
    CharacterService.select_character("acc_1", character_id, idempotency_key="seed:select_character")
    InventoryService.add_item(character_id, "Sword_01", 1, idempotency_key="seed:add_sword")
    InventoryService.add_item(character_id, "Potion_01", 5, idempotency_key="seed:add_potions")
    return asdict(profile)
