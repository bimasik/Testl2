const storage = {
  accounts: new Map(), // accountId -> token
  profiles: new Map(), // charId -> profile
  inventories: new Map(), // charId -> { maxSlots, items: Map }
  equipments: new Map(), // charId -> { slots: Map }
  idempotency: new Map(), // key -> { operation, result }
  accountCharacters: new Map(), // accountId -> charIds[]
  activeCharacterByAccount: new Map(), // accountId -> selected charId
  characterNamesByAccount: new Map(), // accountId -> Set(lowerName)
};

module.exports = { storage };
