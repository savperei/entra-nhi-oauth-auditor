"""Pydantic v2 models for Entra ID Non-Human Identity inventory."""

from datetime import datetime
from typing import Any, Dict, List, Literal, Optional

try:
    from pydantic import BaseModel, ConfigDict
    PYDANTIC_V2 = True
except ImportError:
    PYDANTIC_V2 = False

    class BaseModel:
        """Lightweight fallback BaseModel when pydantic is not yet installed."""

        def __init__(self, *args: Any, **data: Any):
            if args and isinstance(args[0], dict):
                data = {**args[0], **data}
            for k, v in data.items():
                setattr(self, k, v)
            for k in getattr(self.__class__, "__annotations__", {}):
                if k not in data:
                    val = getattr(self.__class__, k, None)
                    setattr(self, k, val)

        def model_dump(self) -> Dict[str, Any]:
            res: Dict[str, Any] = {}
            for k in getattr(self.__class__, "__annotations__", {}):
                val = getattr(self, k, None)
                if isinstance(val, list):
                    res[k] = [
                        item.model_dump() if hasattr(item, "model_dump") else item
                        for item in val
                    ]
                elif hasattr(val, "model_dump"):
                    res[k] = val.model_dump()
                else:
                    res[k] = val
            return res

        dict = model_dump

        def __getitem__(self, item: Any) -> Any:
            if isinstance(item, str):
                try:
                    return getattr(self, item)
                except AttributeError:
                    raise KeyError(item)
            raise KeyError(item)

        def __setitem__(self, key: str, value: Any) -> None:
            setattr(self, key, value)

        def get(self, key: str, default: Any = None) -> Any:
            return getattr(self, key, default)

        def __contains__(self, key: str) -> bool:
            return hasattr(self, key)

        def __repr__(self) -> str:
            fields = ", ".join(
                f"{k}={getattr(self, k, None)!r}"
                for k in getattr(self.__class__, "__annotations__", {})
            )
            return f"{self.__class__.__name__}({fields})"


if PYDANTIC_V2:

    class ModelDictMixin:
        """Mixin enabling dictionary-style access on Pydantic v2 models."""

        model_config = ConfigDict(extra="allow", populate_by_name=True)

        def __init__(self, *args: Any, **data: Any):
            if args and isinstance(args[0], dict):
                data = {**args[0], **data}
            super().__init__(**data)

        def __getitem__(self, item: Any) -> Any:
            if isinstance(item, str):
                try:
                    return getattr(self, item)
                except AttributeError:
                    raise KeyError(item)
            raise KeyError(item)

        def __setitem__(self, key: str, value: Any) -> None:
            setattr(self, key, value)

        def get(self, key: str, default: Any = None) -> Any:
            return getattr(self, key, default)

        def __contains__(self, key: str) -> bool:
            return hasattr(self, key) or (key in self.__dict__)
else:

    class ModelDictMixin:
        """No-op mixin when using fallback BaseModel."""
        pass


class CredentialInfo(BaseModel, ModelDictMixin):
    credential_id: str
    type: Literal["secret", "certificate"]
    display_name: str | None = None
    created: datetime | None = None
    expires: datetime | None = None
    days_until_expiry: int | None = None  # computed: None if no expiry


class Permission(BaseModel, ModelDictMixin):
    scope_or_role: str
    permission_type: Literal["Application", "Delegated"]
    resource_display_name: str | None = None
    is_high_risk: bool = False


class OAuthGrant(BaseModel, ModelDictMixin):
    grant_id: str
    consent_type: str  # "AllPrincipals" or "Principal"
    scope: str
    resource_id: str


class NormalisedIdentity(BaseModel, ModelDictMixin):
    id: str
    display_name: str
    identity_type: Literal["ServicePrincipal", "AppRegistration", "ManagedIdentity"]
    publisher_name: str | None = None
    is_publisher_verified: bool
    is_enabled: bool
    created_at: datetime | None = None
    credentials: list[CredentialInfo] = []
    permissions: list[Permission] = []
    oauth_grants: list[OAuthGrant] = []
