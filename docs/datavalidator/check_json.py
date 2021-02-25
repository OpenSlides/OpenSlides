import json
import re
import sys
from typing import Any, Callable, Dict, List, Optional, Tuple

import fastjsonschema
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


def check_string(value: Any) -> bool:
    return value is None or isinstance(value, str)


color_regex = re.compile("^#[0-9a-f]{6}$")

def check_color(value: Any) -> bool:
    return value is None or (isinstance(value, str) and color_regex.match(value))


def check_number(value: Any) -> bool:
    return value is None or isinstance(value, int)


def check_float(value: Any) -> bool:
    return value is None or isinstance(value, int) or isinstance(value, float)


def check_boolean(value: Any) -> bool:
    return value is None or value is False or value is True


def check_string_list(value: Any) -> bool:
    return check_x_list(value, check_string)


def check_number_list(value: Any) -> bool:
    return check_x_list(value, check_number)


def check_x_list(value: Any, fn: Callable) -> bool:
    if value is None:
        return True
    if not isinstance(value, list):
        return False
    return all([fn(sv) for sv in value])


def check_decimal(value: Any) -> bool:
    if value is None:
        return True
    if isinstance(value, str):
        pattern = r"^-?(\d|[1-9]\d+)\.\d{6}$"
        if re.match(pattern, value):
            return True
    return False


class Checker:
    def __init__(self, data: Dict[str, List[Any]]) -> None:
        self.data = data

        with open(MODELS_YML_PATH, "rb") as x:
            models_yml = x.read()
            models_yml = models_yml.replace(" yes:".encode(), ' "yes":'.encode())
            models_yml = models_yml.replace(" no:".encode(), ' "no":'.encode())
            self.models = yaml.safe_load(models_yml)

        self.errors: List[str] = []

    def run_check(self) -> None:
        self.check_json()
        self.check_collections()
        for collection, models in self.data.items():
            for model in models:
                self.check_model(collection, model)
        if self.errors:
            errors = [f"\t{error}" for error in self.errors]
            raise CheckException("\n".join(errors))

    def check_json(self) -> None:
        try:
            SCHEMA(self.data)
        except fastjsonschema.exceptions.JsonSchemaException as e:
            raise CheckException(f"JSON does not match schema: {str(e)}")

    def check_collections(self) -> None:
        c1 = set(self.data.keys())
        c2 = set(self.models.keys())
        if c1 != c2:
            err = "Collections in JSON file do not match with models.yml."
            if c2 - c1:
                err += f" Missing collections: {', '.join(c2-c1)}."
            if c1 - c2:
                err += f" Invalid collections: {', '.join(c1-c2)}."
            raise CheckException(err)

    def check_model(self, collection: str, model: Dict[str, Any]) -> None:
        model_fields = set(x for x in model.keys() if "$" not in x)
        collection_fields = set(
            x for x in self.models[collection].keys() if "$" not in x
        )

        errors = False
        if collection_fields - model_fields:
            error = f"{collection}/{model['id']}: Missing fields {', '.join(collection_fields - model_fields)}"
            self.errors.append(error)
            errors = True
        if model_fields - collection_fields:
            error = f"{collection}/{model['id']}: Invalid fields {', '.join(model_fields - collection_fields)}"
            self.errors.append(error)
            errors = True

        if not errors:
            self.check_types(model, collection)
            self.check_relations(model, collection)

    def check_types(self, model: Dict[str, Any], collection: str) -> None:
        for field in model.keys():
            if "$" in field:
                continue

            checker = None
            field_type = self.get_type_from_collection(field, collection)
            if field_type in (
                "string",
                "HTMLStrict",
                "HTMLPermissive",
                "generic-relation",
            ):
                checker = check_string
            elif field_type in ("number", "timestamp", "relation"):
                checker = check_number
            elif field_type == "float":
                checker = check_float
            elif field_type == "boolean":
                checker = check_boolean
            elif field_type in ("string[]", "generic-relation-list"):
                checker = check_string_list
            elif field_type in ("number[]", "relation-list"):
                checker = check_number_list
            elif field_type == "decimal(6)":
                checker = check_decimal
            elif field_type == "color":
                checker = check_color
            elif field_type in (
                "JSON",
                "template",
            ):
                pass
            else:
                raise NotImplementedError(f"TODO field type {field_type}")
            if checker is not None and not checker(model[field]):
                error = f"{collection}/{model['id']}/{field}: Type error: Type is not {field_type}"
                self.errors.append(error)

    def get_type_from_collection(self, field: str, collection: str) -> str:
        field_value = self.models[collection][field]
        if isinstance(field_value, dict):
            return field_value["type"]
        return field_value

    def check_relations(self, model: Dict[str, Any], collection: str) -> None:
        for field in model.keys():
            try:
                self.check_relation(model, collection, field)
            except CheckException as e:
                self.errors.append(
                    f"{collection}/{model['id']}/{field} error: " + str(e)
                )

    def check_relation(
        self, model: Dict[str, Any], collection: str, field: str
    ) -> None:
        if "$" in field:
            return

        field_type = self.get_type_from_collection(field, collection)
        basemsg = self.get_basemsg(collection, model["id"], field)

        if field_type == "relation":
            foreign_id = model[field]
            if foreign_id is None:
                return

            foreign_collection, foreign_field = self.get_to(field, collection)
            if "$" in foreign_field:
                return

            self.check_reverse_relation(
                collection,
                model["id"],
                foreign_collection,
                foreign_id,
                foreign_field,
                basemsg,
            )

        elif field_type == "relation-list":
            foreign_ids = model[field]
            if foreign_ids is None:
                return

            foreign_collection, foreign_field = self.get_to(field, collection)
            if "$" in foreign_field:
                return

            for foreign_id in foreign_ids:
                self.check_reverse_relation(
                    collection,
                    model["id"],
                    foreign_collection,
                    foreign_id,
                    foreign_field,
                    basemsg,
                )

        elif field_type == "generic-relation" and model[field] is not None:
            foreign_collection, foreign_id = self.split_fqid(model[field])
            foreign_field = self.get_to_generic_case(
                collection, field, foreign_collection
            )

            if "$" in foreign_field:
                return

            self.check_reverse_relation(
                collection,
                model["id"],
                foreign_collection,
                foreign_id,
                foreign_field,
                basemsg,
            )

        elif field_type == "generic-relation-list" and model[field] is not None:
            for fqid in model[field]:
                foreign_collection, foreign_id = self.split_fqid(fqid)
                foreign_field = self.get_to_generic_case(
                    collection, field, foreign_collection
                )

                if "$" in foreign_field:
                    continue

                self.check_reverse_relation(
                    collection,
                    model["id"],
                    foreign_collection,
                    foreign_id,
                    foreign_field,
                    basemsg,
                )

    def get_to(self, field: str, collection: str) -> Tuple[str, str]:
        to = self.models[collection][field]["to"]
        return to.split("/")

    def get_value(self, collection: str, id: int, field: str) -> Any:
        model = self.find_model(collection, id)
        if model is None:
            return None
        return model.get(field)

    def find_model(self, collection: str, id: int) -> Optional[Dict[str, Any]]:
        c = self.data.get(collection, [])
        for model in c:
            if model["id"] == id:
                return model
        return None

    def get_basemsg(self, collection: str, id: int, field: str) -> str:
        return f"{collection}/{id}/{field}: RelationError: "

    def check_reverse_relation(
        self,
        collection: str,
        id: int,
        foreign_collection: str,
        foreign_id: int,
        foreign_field: str,
        basemsg: str,
    ) -> None:
        foreign_value = self.get_value(foreign_collection, foreign_id, foreign_field)
        foreign_field_type = self.get_type_from_collection(
            foreign_field, foreign_collection
        )
        fqid = f"{collection}/{id}"
        error = False
        if foreign_field_type == "relation":
            error = foreign_value != id
        elif foreign_field_type == "relation-list":
            error = not foreign_value or id not in foreign_value
        elif foreign_field_type == "generic-relation":
            error = foreign_value != fqid
        elif foreign_field_type == "generic-relation-list":
            error = not foreign_value or fqid not in foreign_value
        else:
            raise NotImplementedError()

        if error:
            self.errors.append(
                f"{basemsg} points to {foreign_collection}/{foreign_id}/{foreign_field},"
                " but the reverse relation for is corrupt"
            )

    def split_fqid(self, fqid: str) -> Tuple[str, int]:
        try:
            collection, _id = fqid.split("/")
            id = int(_id)
            if collection not in self.models.keys():
                raise CheckException(f"Fqid {fqid} has an invalid collection")
            return collection, id
        except ValueError:
            raise CheckException(f"Fqid {fqid} is malformed")

    def split_collectionfield(self, collectionfield: str) -> Tuple[str, str]:
        collection, field = collectionfield.split("/")
        if collection not in self.models.keys():
            raise CheckException(
                f"Collectionfield {collectionfield} has an invalid collection"
            )
        if (
            field not in self.models[collection]
        ):  # Note: this has to be adopted when supporting template fields
            raise CheckException(
                f"Collectionfield {collectionfield} has an invalid field"
            )
        return collection, field

    def get_to_generic_case(
        self, collection: str, field: str, foreign_collection: str
    ) -> str:
        """ Returns all reverse relations as collectionfields """
        to = self.models[collection][field]["to"]
        if isinstance(to, dict):
            if foreign_collection not in to["collections"]:
                raise CheckException(
                    f"The collection {foreign_collection} is not supported "
                    "as a reverse relation in {collection}/{field}"
                )
            return to["field"]

        for cf in to:
            c, f = self.split_collectionfield(cf)
            if c == foreign_collection:
                return f

        raise CheckException(
            f"The collection {foreign_collection} is not supported as a reverse relation in {collection}/{field}"
        )


def main() -> int:
    failed = False
    for f in CHECKED_FILES:
        with open(f) as data:
            try:
                Checker(json.load(data)).run_check()
            except CheckException as e:
                print(f"Check for {f} failed:\n", e)
                failed = True
            else:
                print(f"Check for {f} successful.")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
