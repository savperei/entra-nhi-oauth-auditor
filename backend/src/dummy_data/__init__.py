"""Dummy and synthetic data package for safe local auditing."""

from .dummy_tenant import generate_dummy_tenant
from .synthetic_identities import SYNTHETIC_IDENTITIES, SYNTHETIC_FINDINGS

__all__ = [
    "generate_dummy_tenant",
    "SYNTHETIC_IDENTITIES",
    "SYNTHETIC_FINDINGS",
]

