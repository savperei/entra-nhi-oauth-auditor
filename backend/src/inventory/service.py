"""Inventory service for non-human identities.
Safely operates using synthetic data when configured.
"""

import os
from typing import List, Optional, Dict, Any
from src.dummy_data.synthetic_identities import SYNTHETIC_IDENTITIES

class InventoryService:
    def __init__(self):
        self.use_synthetic_data = os.getenv("USE_SYNTHETIC_DATA", "true").lower() == "true"

    def list_identities(
        self,
        identity_type: Optional[str] = None,
        risk_level: Optional[str] = None,
        search: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        if not self.use_synthetic_data:
            return []
        
        identities = list(SYNTHETIC_IDENTITIES)
        if identity_type and identity_type.strip() and identity_type.upper() != "ALL":
            norm_type = identity_type.replace(" ", "").lower()
            identities = [
                i for i in identities
                if i.get("identity_type", "").replace(" ", "").lower() == norm_type
            ]
        
        if risk_level and risk_level.strip() and risk_level.upper() != "ALL":
            identities = [
                i for i in identities
                if i.get("risk_level", "").upper() == risk_level.strip().upper()
            ]
        
        if search and search.strip():
            s = search.strip().lower()
            identities = [
                i for i in identities
                if s in i.get("name", "").lower() or s in i.get("app_id", "").lower() or s in i.get("owner", "").lower()
            ]

        return identities

    def get_identity_by_id(self, identity_id: str) -> Optional[Dict[str, Any]]:
        identities = self.list_identities()
        for identity in identities:
            if identity["id"] == identity_id or identity["app_id"] == identity_id:
                return identity
        return None

inventory_service = InventoryService()
