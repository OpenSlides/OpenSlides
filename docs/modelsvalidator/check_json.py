# This script requires fastjsonschema and pyyaml to be installed e. g. via pip.

import json
import sys
from typing import Any, Dict, Iterable

import fastjsonschema  # type:ignore
import yaml

MODELS_YML_PATH = "../../docs/models.yml"

CHECKED_FILES = [
    "../../docker/initial-data.json",
    "../../docs/example-data.json",
]

SCHEMA = fastjsonschema.compile(
    {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "title": "Schema for initial and example data.",
        "type": "object",
        "patternProperties": {
            "^[a-z_]+$": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {"id": {"type": "number"}},
                    "required": ["id"],
                },
            }
        },
        "additionalProperties": False,
    }
)


class CheckException(Exception):
    pass


def run_check(data: Dict) -> None:
    try:
        SCHEMA(data)
    except fastjsonschema.exceptions.JsonSchemaException as e:
        raise CheckException(f"JSON does not match schema: {str(e)}")
    check_collections(data.keys())
    for collection, elements in data.items():
        for element in elements:
            check_instance(collection, element)


def get_models() -> Dict[str, Any]:
    with open(MODELS_YML_PATH, "rb") as x:
        models_yml = x.read()
    models_yml = models_yml.replace(" yes:".encode(), ' "yes":'.encode())
    models_yml = models_yml.replace(" no:".encode(), ' "no":'.encode())
    return yaml.safe_load(models_yml)


def check_collections(collections: Iterable[str]) -> None:
    c1 = set(collections)
    c2 = set(get_models().keys())
    if c1 != c2:
        err = "Collections in JSON file do not match with models.yml."
        if c2 - c1:
            err += f" Missing collections: {', '.join(c2-c1)}."
        if c1 - c2:
            err += f" Invalid collections: {', '.join(c1-c2)}."
        raise CheckException(err)


def check_instance(name: str, instance: Dict[str, Any]) -> None:
    collection = get_models()[name]
    for field_name in instance.keys():
        if "$" in field_name and not ("$_" in field_name or field_name[-1] == "$"):
            # Structured field.
            # TODO: Check this.
            continue
        if field_name not in collection.keys():
            raise CheckException(f"Bad field in {name}: {field_name}")


def main() -> int:
    failed = False
    for f in CHECKED_FILES:
        with open(f) as data:
            try:
                run_check(json.load(data))
            except CheckException as e:
                print(f"Check for {f} failed:", e)
                failed = True
            else:
                print(f"Check for {f} successful.")
    if failed:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
