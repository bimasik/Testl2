const storage = {
  accounts: new Map(), // accountId -> token
  profiles: new Map(), // charId -> profile
  inventories: new Map(), // charId -> { maxSlots, items: Map }
  equipments: new Map(), // charId -> { slots: Map }
  idempotency: new Map(), // key -> { operation, result }
};

module.exports = { storage };
