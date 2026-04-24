"""
Minimal server-side script runner (no external dependencies).
Run:
  python -m backend.api_simulation
"""
from __future__ import annotations

from pprint import pprint

from .services import CombatValidationService, EquipmentService, InventoryService, seed_demo_state


if __name__ == "__main__":
    print("== seed ==")
    pprint(seed_demo_state())

    print("\n== equip sword ==")
    res = EquipmentService.equip_item("char_1", "WeaponMain", "Sword_01", idempotency_key="equip:1")
    pprint(res)

    print("\n== replay same idempotency key (must be same result) ==")
    res_replay = EquipmentService.equip_item("char_1", "WeaponMain", "Sword_01", idempotency_key="equip:1")
    pprint(res_replay)

    print("\n== ability commit ==")
    cast = CombatValidationService.validate_and_commit_ability("char_1", "Fireball")
    pprint(cast)

    print("\n== add item with idempotency ==")
    add1 = InventoryService.add_item("char_1", "Potion_01", 2, idempotency_key="inv:add:1")
    add2 = InventoryService.add_item("char_1", "Potion_01", 2, idempotency_key="inv:add:1")
    pprint(add1)
    pprint(add2)
