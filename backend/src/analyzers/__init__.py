"""Analyzers package for evaluating OAuth permissions, scopes, and publisher security."""

from typing import List
from .permission_analyzer import (
    PermissionAnalyzer,
    HIGH_RISK_PERMISSIONS,
    NormalisedIdentity,
    NormalizedIdentity,
    Permission,
)
from .publisher_detector import PublisherDetector
from .oauth_analyzer import OAuthAnalyzer, oauth_analyzer


def run_all_analyzers(identities: list) -> List[NormalisedIdentity]:
    """Runs both PermissionAnalyzer and PublisherDetector on every identity,
    returning an enriched list of NormalisedIdentity instances.
    """
    perm_analyzer = PermissionAnalyzer()
    pub_detector = PublisherDetector()
    enriched_identities: List[NormalisedIdentity] = []

    for item in identities:
        if isinstance(item, NormalisedIdentity):
            norm_identity = item
        elif isinstance(item, dict):
            norm_identity = NormalisedIdentity(**item)
        else:
            norm_identity = NormalisedIdentity(item)
        # 1. Permission analysis
        enriched = perm_analyzer.analyse(norm_identity)

        # 2. Publisher detection
        pub_result = pub_detector.check(enriched)
        enriched["publisher_check"] = pub_result
        enriched.publisher_check = pub_result

        enriched_identities.append(enriched)

    return enriched_identities


__all__ = [
    "PermissionAnalyzer",
    "HIGH_RISK_PERMISSIONS",
    "PublisherDetector",
    "run_all_analyzers",
    "NormalisedIdentity",
    "NormalizedIdentity",
    "Permission",
    "OAuthAnalyzer",
    "oauth_analyzer",
]
