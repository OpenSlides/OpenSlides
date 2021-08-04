import json
import re
import sys
from collections import defaultdict
from typing import Any, Callable, Dict, List, Optional, Set, Tuple, Union

import yaml

DEFAULT_FILES = [
    "../../docs/models.yml",
]


KEYSEPARATOR = "/"
_collection_regex = r"[a-z]([a-z_]+[a-z]+)?"
_field_regex = r"[a-z][a-z0-9_]*\$?[a-z0-9_]*"

collectionfield_regex = re.compile(
    f"^({_collection_regex}){KEYSEPARATOR}({_field_regex})$"
)
collection_regex = re.compile(f"^{_collection_regex}$")
field_regex = re.compile(f"^{_field_regex}$")

decimal_regex = re.compile("^\d+\.\d{6}$")
color_regex = re.compile("^#[0-9a-f]{6}$")

RELATION_TYPES = (
    "relation",
    "relation-list",
    "generic-relation",
    "generic-relation-list",
)

DATA_TYPES = (
    "string",
    "number",
    "string[]",
    "number[]",
    "boolean",
    "JSON",
    "HTMLStrict",
    "HTMLPermissive",
    "float",
    "decimal(6)",
    "timestamp",
    "color",
)


VALID_TYPES = DATA_TYPES + RELATION_TYPES + ("template",)

OPTIONAL_ATTRIBUTES = (
    "description",
    "calculated",
    "required",
    "read_only",
)


class CheckException(Exception):
    pass


class Checker:
    def __init__(self, filepath: str) -> None:
        with open(filepath, "rb") as x:
            self.models = yaml.safe_load(x.read())
        self.errors: List[str] = []

    def run_check(self) -> None:
        self._run_checks()
        if self.errors:
            errors = [f"\t{error}" for error in self.errors]
            raise CheckException("\n".join(errors))

    def _run_checks(self) -> None:
        for collection in self.models.keys():
            if not collection_regex.match(collection):
                self.errors.append(f"Collection '{collection}' is not valid.")
        if self.errors:
            return

        for collection, fields in self.models.items():
            if not isinstance(fields, dict):
                self.errors.append(
                    f"The fields of collection {collection} must be a dict."
                )
                continue
            for field_name, field in fields.items():
                if not field_regex.match(field_name):
                    self.errors.append(
                        f"Field name '{field_name}' of collection {collection} is not a valid field name."
                    )
                    continue
                if not isinstance(field, dict):
                    self.errors.append(
                        f"Field '{field_name}' of collection {collection} must be a dict."
                    )
                self.check_field(collection, field_name, field)

        if self.errors:
            return

        for collection, fields in self.models.items():
            for field_name, field in fields.items():
                is_relation_field = field["type"] in RELATION_TYPES
                is_template_relation_field = (
                    field["type"] == "template"
                    and isinstance(field["fields"], dict)
                    and field["fields"]["type"] in RELATION_TYPES
                )
                if not is_relation_field and not is_template_relation_field:
                    continue
                error = self.check_relation(collection, field_name, field)
                if error:
                    self.errors.append(error)

    def check_field(
        self,
        collection: str,
        field_name: str,
        field: Union[str, Dict[str, Any]],
        nested: bool = False,
    ) -> None:
        collectionfield = f"{collection}{KEYSEPARATOR}{field_name}"

        if nested:
            if isinstance(field, str):
                field = {"type": field}
            field[
                "restriction_mode"
            ] = "A"  # add restriction_mode to satisfy the checker below.
            if field["type"] == "template":  # no nested templates
                self.errors.append(f"Nested template field in {collectionfield}")
                return

        type = field.get("type")
        if type not in VALID_TYPES:
            self.errors.append(
                f"Type '{type}' for collectionfield {collectionfield} is invalid."
            )
            return

        required_attributes = [
            "type",
            "restriction_mode",
        ]
        if type in RELATION_TYPES:
            required_attributes.append("to")
        if type == "template":
            required_attributes.append("fields")
        for attr in required_attributes:
            if attr not in field:
                self.errors.append(
                    f"Required attribute '{attr}' for collectionfield {collectionfield} is missing."
                )
                return

        if field.get("calculated"):
            return

        valid_attributes = list(OPTIONAL_ATTRIBUTES) + required_attributes
        if type == "string[]":
            valid_attributes.append("items")
            if "items" in field and "enum" not in field["items"]:
                self.errors.append(
                    f"'items' is missing an inner 'enum' for {collectionfield}"
                )
                return
            for value in field.get("items", {"enum": []})["enum"]:
                self.validate_value_for_type("string", value, collectionfield)
        if type == "JSON" and "default" in field:
            try:
                json.loads(json.dumps(field["default"]))
            except:
                self.errors.append(
                    f"Default value for {collectionfield}' is not valid json."
                )
        if type == "number":
            valid_attributes.append("minimum")
            if not isinstance(field.get("minimum", 0), int):
                self.errors.append(f"'minimum' for {collectionfield} is not a number.")
        if type == "string":
            valid_attributes.append("maxLength")
            if not isinstance(field.get("maxLength", 0), int):
                self.errors.append(
                    f"'maxLength' for {collectionfield} is not a number."
                )
        if type in DATA_TYPES:
            valid_attributes.append("default")
            if "default" in field:
                self.validate_value_for_type(type, field["default"], collectionfield)
            valid_attributes.append("enum")
            if "enum" in field:
                if not isinstance(field["enum"], list):
                    self.errors.append(f"'enum' for {collectionfield}' is not a list.")
                for value in field["enum"]:
                    self.validate_value_for_type(type, value, collectionfield)

        if type in RELATION_TYPES:
            valid_attributes.append("on_delete")
            if "on_delete" in field and field["on_delete"] not in (
                "CASCADE",
                "PROTECT",
            ):
                self.errors.append(
                    f"invalid value for 'on_delete' for {collectionfield}"
                )
            valid_attributes.append("equal_fields")

        if type == "template":
            if "$" not in field_name:
                self.errors.append(
                    f"The template field {collectionfield} is missing a $"
                )
            valid_attributes.append("replacement_collection")
        elif "$" in field_name and not nested:
            print(field_name, field)
            self.errors.append(f"The non-template field {collectionfield} contains a $")

        for attr in field.keys():
            if attr not in valid_attributes:
                self.errors.append(
                    f"Attribute '{attr}' for collectionfield {collectionfield} is invalid."
                )

        if not isinstance(field.get("description", ""), str):
            self.errors.append(f"Description of {collectionfield} must be a string.")

        if type == "template":
            self.check_field(collection, field_name, field["fields"], nested=True)

    def validate_value_for_type(
        self, type_str: str, value: Any, collectionfield: str
    ) -> None:
        basic_types = {
            "string": str,
            "number": int,
            "boolean": bool,
            "HTMLStrict": str,
            "HTMLPermissive": str,
            "timestamp": int,
        }
        if type_str in basic_types:
            if type(value) != basic_types[type_str]:
                self.errors.append(
                    f"Value '{value}' for {collectionfield}' is not a {type_str}."
                )
        elif type_str in ("string[]", "number[]"):
            if not isinstance(value, list):
                self.errors.append(
                    f"Value '{value}' for {collectionfield}' is not a {type_str}."
                )
            for x in value:
                if type(x) != basic_types[type_str[:-2]]:
                    self.errors.append(
                        f"Listentry '{x}' for {collectionfield}' is not a {type_str[:-2]}."
                    )
        elif type_str == "JSON":
            pass
        elif type_str == "float":
            if type(value) not in (int, float):
                self.errors.append(
                    f"Value '{value}' for {collectionfield}' is not a float."
                )
        elif type_str == "decimal(6)":
            if not decimal_regex.match(value):
                self.errors.append(
                    f"Value '{value}' for {collectionfield}' is not a decimal(6)."
                )
        elif type_str == "color":
            if not color_regex.match(value):
                self.errors.append(
                    f"Value '{value}' for {collectionfield}' is not a color."
                )
        else:
            raise NotImplementedError(type_str)

    def check_relation(
        self, collection: str, field_name: str, field: Dict[str, Any]
    ) -> Optional[str]:
        collectionfield = f"{collection}{KEYSEPARATOR}{field_name}"
        if field["type"] == "template":
            field = field["fields"]
        to = field["to"]

        if isinstance(to, str):
            if not collectionfield_regex.match(to):
                return f"'to' of {collectionfield} is not a collectionfield."
            return self.check_reverse(collectionfield, to)
        elif isinstance(to, list):
            for cf in to:
                if not collectionfield_regex.match(cf):
                    return f"The collectionfield in 'to' of {collectionfield} is not valid."
                error = self.check_reverse(collectionfield, cf)
                if error:
                    return error
        else:
            to_field = to["field"]
            if not field_regex.match(to_field):
                return (
                    f"The field '{to_field}' in 'to' of {collectionfield} is not valid."
                )
            for c in to["collections"]:
                if not collection_regex.match(c):
                    self.errors.append(
                        f"The collection '{c}' in 'to' of {collectionfield} is not a valid collection."
                    )
                error = self.check_reverse(
                    collectionfield, f"{c}{KEYSEPARATOR}{to['field']}"
                )
                if error:
                    return error
        return None

    def check_reverse(
        self, from_collectionfield: str, to_collectionfield: str
    ) -> Optional[str]:
        to_unified = []  # a list of target collectionfields (unififed with all
        # the different possibilities for the 'to' field) from the (expected)
        # relation in to_collectionfield. The from_collectionfield must be in this
        # list.

        to_collection, to_field_name = to_collectionfield.split(KEYSEPARATOR)
        if to_collection not in self.models:
            return f"The collection '{to_collection}' in 'to' of {from_collectionfield} is not a valid collection."
        if to_field_name not in self.models[to_collection]:
            return f"The collectionfield '{to_collectionfield}' in 'to' of {from_collectionfield} does not exist."

        to_field = self.models[to_collection][to_field_name]
        if to_field["type"] == "template":
            to_field = to_field["fields"]
            if not isinstance(to_field, dict):
                return f"The 'fields' of the template field '{to_collectionfield}' must be a dict to hold a relation."
        if to_field["type"] not in RELATION_TYPES:
            return f"{from_collectionfield} points to {to_collectionfield}, but {to_collectionfield} to is not a relation."

        to = to_field["to"]
        if isinstance(to, str):
            to_unified.append(to)
        elif isinstance(to, list):
            to_unified = to
        else:
            for c in to["collections"]:
                to_unified.append(f"{c}{KEYSEPARATOR}{to['field']}")

        if from_collectionfield not in to_unified:
            return f"{from_collectionfield} points to {to_collectionfield}, but {to_collectionfield} does not point back."
        return None

    def split_collectionfield(self, collectionfield: str) -> Tuple[str, str]:
        parts = collectionfield.split(KEYSEPARATOR)
        return parts[0], parts[1]


def main() -> int:
    files = sys.argv[1:]
    if not files:
        files = DEFAULT_FILES

    failed = False
    for f in files:
        with open(f) as data:
            try:
                Checker(f).run_check()
            except CheckException as e:
                print(f"Check for {f} failed:\n", e)
                failed = True
            else:
                print(f"Check for {f} successful.")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
