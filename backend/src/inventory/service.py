"""Inventory service for non-human identities.
Safely operates using synthetic data when configured.
"""

import os
from typing import List, Optional, Dict, Any
from src.dummy_data.synthetic_identities import SYNTHETIC_IDENTITIES

class InventoryService:
    def __init__(self):
        self.use_synthetic_data = os.getenv("USE_SYNTHETIC_DATA", "true").lower() == "true"

    def list_identities(self) -> List[Dict[str, Any]]:
        if self.use_synthetic_data:
            return SYNTHETIC_IDENTITIES
        return []

    def get_identity_by_id(self, identity_id: str) -> Optional[Dict[str, Any]]:
        identities = self.list_identities()
        for identity in identities:
            if identity["id"] == identity_id or identity["app_id"] == identity_id:
                return identity
        return None

inventory_service = InventoryService()

