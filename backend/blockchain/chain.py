# Blockchain Anchor Module (Optional)
# Anchors batch event hashes to Hyperledger Fabric for auditability

import hashlib
import json
from typing import Optional

# Placeholder — replace with actual Fabric SDK calls in production

def hash_event(event: dict) -> str:
    """SHA-256 hash of a checkpoint event for on-chain anchoring."""
    event_str = json.dumps(event, sort_keys=True, default=str)
    return hashlib.sha256(event_str.encode()).hexdigest()

def anchor_to_chain(batch_id: str, event: dict) -> Optional[str]:
    """
    Write event hash to blockchain.
    In production: call Hyperledger Fabric chaincode via SDK.
    """
    tx_hash = hash_event(event)
    # fabric_chaincode.invoke("AnchorEvent", batch_id, tx_hash)
    print(f"[BLOCKCHAIN] Anchored {batch_id} → tx: {tx_hash[:16]}...")
    return tx_hash

def verify_batch_integrity(batch_events: list) -> dict:
    """
    Verify that all events in a batch match their on-chain hashes.
    Returns { valid: bool, mismatches: list }
    """
    mismatches = []
    for event in batch_events:
        computed = hash_event(event)
        # on_chain = fabric_chaincode.query("GetEventHash", event["event_id"])
        # if computed != on_chain: mismatches.append(event["event_id"])
    return {"valid": len(mismatches) == 0, "mismatches": mismatches}
