"""Rule definition and loader module for the Entra NHI Risk Engine."""

from pathlib import Path
from typing import Any, List, Optional, Union
import yaml

from src.inventory.models import BaseModel, ModelDictMixin


class Rule(BaseModel, ModelDictMixin):
    """Represents an individual risk evaluation rule."""

    id: str
    name: str
    severity: str
    score: int
    remediation: str


class RuleLoader:
    """Loads risk assessment rules from a YAML configuration file."""

    _DEFAULT_RULES_PATH = Path(__file__).resolve().parent.parent.parent / "rules" / "default_rules.yaml"

    @classmethod
    def load(cls, path: Optional[Union[str, Path]] = None) -> List[Rule]:
        """Loads and parses rules from the given YAML file path.
        If no path is specified, loads the default_rules.yaml file.
        """
        rule_file = Path(path) if path else cls._DEFAULT_RULES_PATH

        if not rule_file.exists():
            # Fallback search if current working directory is backend/ or root
            alt_paths = [
                Path("rules") / "default_rules.yaml",
                Path("backend") / "rules" / "default_rules.yaml",
                Path(__file__).resolve().parent.parent.parent / "rules" / "risk_rules.yaml",
            ]
            for alt in alt_paths:
                if alt.exists():
                    rule_file = alt
                    break

        if not rule_file.exists():
            raise FileNotFoundError(f"Rules configuration file not found at: {path or cls._DEFAULT_RULES_PATH}")

        with open(rule_file, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f) or {}

        raw_rules = data.get("rules", [])
        rules_list: List[Rule] = []

        for r in raw_rules:
            if isinstance(r, dict):
                rule = Rule(
                    id=str(r.get("id", "")),
                    name=str(r.get("name", "")),
                    severity=str(r.get("severity", "LOW")),
                    score=int(r.get("score", 0)),
                    remediation=str(r.get("remediation", "")),
                )
                rules_list.append(rule)

        return rules_list

