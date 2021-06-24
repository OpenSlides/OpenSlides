import json
import re
import sys
from collections import defaultdict
from typing import Any, Callable, Dict, List, Optional, Set, Tuple

import fastjsonschema
import yaml

MODELS_YML_PATH = "../../docs/models.yml"

DEFAULT_FILES = [
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
    return value is None or bool(isinstance(value, str) and color_regex.match(value))


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


def check_json(value: Any, root: bool = True) -> bool:
    if value is None:
        return True
    if not root and (isinstance(value, int) or isinstance(value, str)):
        return True
    if isinstance(value, list):
        return all(check_json(x, root=False) for x in value)
    if isinstance(value, dict):
        return all(check_json(x, root=False) for x in value.values())
    return False


checker_mapping = {
    "string": check_string,
    "HTMLStrict": check_string,
    "HTMLPermissive": check_string,
    "generic-relation": check_string,
    "number": check_number,
    "timestamp": check_number,
    "relation": check_number,
    "float": check_float,
    "boolean": check_boolean,
    "string[]": check_string_list,
    "generic-relation-list": check_string_list,
    "number[]": check_number_list,
    "relation-list": check_number_list,
    "decimal(6)": check_decimal,
    "color": check_color,
    "JSON": check_json,
}


class Checker:
    def __init__(self, data: Dict[str, List[Any]], is_import: bool = False) -> None:
        self.data = data

        with open(MODELS_YML_PATH, "rb") as x:
            models_yml = x.read()
            models_yml = models_yml.replace(" yes:".encode(), ' "yes":'.encode())
            models_yml = models_yml.replace(" no:".encode(), ' "no":'.encode())
            self.models = yaml.safe_load(models_yml)
            if is_import:
                self.modify_models_for_import()

        self.errors: List[str] = []

        self.template_prefixes: Dict[
            str, Dict[str, Tuple[str, int, int]]
        ] = defaultdict(dict)
        self.generate_template_prefixes()

    def modify_models_for_import(self) -> None:
        collection_allowlist = (
            "user",
            "meeting",
            "group",
            "personal_note",
            "tag",
            "agenda_item",
            "list_of_speakers",
            "speaker",
            "topic",
            "motion",
            "motion_submitter",
            "motion_comment",
            "motion_comment_section",
            "motion_category",
            "motion_block",
            "motion_change_recommendation",
            "motion_state",
            "motion_workflow",
            "motion_statute_paragraph",
            "poll",
            "option",
            "vote",
            "assignment",
            "assignment_candidate",
            "mediafile",
            "projector",
            "projection",
            "projector_message",
            "projector_countdown",
            "chat_group",
        )
        for collection in list(self.models.keys()):
            if collection not in collection_allowlist:
                del self.models[collection]
        self.models["mediafile"]["blob"] = "string"

    def generate_template_prefixes(self) -> None:
        for collection in self.models.keys():
            for field in self.models[collection]:
                if not self.is_template_field(field):
                    continue
                parts = field.split("$")
                prefix = parts[0]
                suffix = parts[1]
                if prefix in self.template_prefixes[collection]:
                    raise ValueError(
                        f"the template prefix {prefix} is not unique within {collection}"
                    )
                self.template_prefixes[collection][prefix] = (
                    field,
                    len(prefix),
                    len(suffix),
                )

    def is_template_field(self, field: str) -> bool:
        return "$_" in field or field.endswith("$")

    def is_structured_field(self, field: str) -> bool:
        return "$" in field and not self.is_template_field(field)

    def is_normal_field(self, field: str) -> bool:
        return "$" not in field

    def make_structured(self, field: str, replacement: Any) -> str:
        if type(replacement) not in (str, int):
            raise CheckException(
                f"Invalid type {type(replacement)} for the replacement of field {field}"
            )
        parts = field.split("$")
        return parts[0] + "$" + str(replacement) + parts[1]

    def to_template_field(
        self, collection: str, structured_field: str
    ) -> Tuple[str, str]:
        """Returns template_field, replacement"""
        parts = structured_field.split("$")
        descriptor = self.template_prefixes[collection].get(parts[0])
        if not descriptor:
            raise CheckException(
                f"Unknown template field for prefix {parts[0]} in collection {collection}"
            )
        return (
            descriptor[0],
            structured_field[descriptor[1] + 1 : len(structured_field) - descriptor[2]],
        )

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
        errors = self.check_normal_fields(model, collection)

        if not errors:
            errors = self.check_template_fields(model, collection)

        if not errors:
            self.check_types(model, collection)
            self.check_relations(model, collection)

    def check_normal_fields(self, model: Dict[str, Any], collection: str) -> bool:
        model_fields = set(
            x
            for x in model.keys()
            if self.is_normal_field(x) or self.is_template_field(x)
        )
        collection_fields = set(
            x
            for x in self.models[collection].keys()
            if self.is_normal_field(x) or self.is_template_field(x)
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
        return errors

    def check_template_fields(self, model: Dict[str, Any], collection: str) -> bool:
        """
        Only checks that for each replacement a structured field exists and
        not too many structured fields. Does not check the content.
        Returns True on errors.
        """
        errors = False
        for template_field in self.models[collection].keys():
            if not self.is_template_field(template_field):
                continue
            field_error = False
            replacements = model[template_field]
            if not isinstance(replacements, list):
                self.errors.append(
                    f"{collection}/{model['id']}/{template_field}: Replacements for the template field must be a list"
                )
                field_error = True
                continue
            for replacement in replacements:
                if not isinstance(replacement, str):
                    self.errors.append(
                        f"{collection}/{model['id']}/{template_field}: Each replacement for the template field must be a string"
                    )
                    field_error = True
            if field_error:
                error = True
                continue

            replacement_collection = None
            field_description = self.models[collection][template_field]
            if isinstance(field_description, dict):
                replacement_collection = field_description.get("replacement_collection")

            for replacement in replacements:
                structured_field = self.make_structured(template_field, replacement)
                if structured_field not in model:
                    self.errors.append(
                        f"{collection}/{model['id']}/{template_field}: Missing {structured_field} since it is given as a replacement"
                    )
                    errors = True

                if replacement_collection:
                    try:
                        as_id = int(replacement)
                    except (TypeError, ValueError):
                        self.errors.append(
                            f"{collection}/{model['id']}/{template_field}: Replacement {replacement} is not an integer"
                        )
                    if not self.find_model(replacement_collection, as_id):
                        self.errors.append(
                            f"{collection}/{model['id']}/{template_field}: Replacement {replacement} does not exist as a model of collection {replacement_collection}"
                        )

            for field in model.keys():
                if self.is_structured_field(field):
                    try:
                        _template_field, _replacement = self.to_template_field(
                            collection, field
                        )
                        if (
                            template_field == _template_field
                            and _replacement not in model[template_field]
                        ):
                            self.errors.append(
                                f"{collection}/{model['id']}/{field}: Invalid structured field. Missing replacement {_replacement} in {template_field}"
                            )
                            errors = True
                    except CheckException as e:
                        self.errors.append(
                            f"{collection}/{model['id']}/{field} error: " + str(e)
                        )
                        errors = True

        return errors

    def check_types(self, model: Dict[str, Any], collection: str) -> None:
        for field in model.keys():
            if self.is_template_field(field):
                continue

            field_type = self.get_type_from_collection(field, collection)
            enum = self.get_enum_from_collection_field(field, collection)
            checker = checker_mapping.get(field_type)
            if checker is None:
                raise NotImplementedError(
                    f"TODO implement check for field type {field_type}"
                )

            if not checker(model[field]):
                error = f"{collection}/{model['id']}/{field}: Type error: Type is not {field_type}"
                self.errors.append(error)

            if enum and model[field] not in enum:
                error = f"{collection}/{model['id']}/{field}: Value error: Value {model[field]} is not a valid enum value"
                self.errors.append(error)

    def get_type_from_collection(self, field: str, collection: str) -> str:
        if self.is_structured_field(field):
            field, _ = self.to_template_field(collection, field)

        field_description = self.models[collection][field]
        if isinstance(field_description, dict):
            if field_description["type"] == "template":
                if isinstance(field_description["fields"], dict):
                    return field_description["fields"]["type"]
                return field_description["fields"]
            return field_description["type"]
        return field_description

        field_description = self.get_field_description(field, collection)
        if field_description:
            return field_description["type"]
        return self.models[collection][field]

    def get_enum_from_collection_field(
        self, field: str, collection: str
    ) -> Optional[Set[str]]:
        if self.is_structured_field(field):
            field, _ = self.to_template_field(collection, field)

        field_description = self.models[collection][field]
        if isinstance(field_description, dict):
            if field_description["type"] == "template":
                if isinstance(field_description["fields"], dict):
                    field_description = field_description["fields"]
                else:
                    return None
            if "enum" in field_description:
                enum = set(field_description["enum"])
                if not field_description.get("required", False):
                    enum.add(None)
                return enum
        return None

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
        if self.is_template_field(field):
            return

        field_type = self.get_type_from_collection(field, collection)
        basemsg = f"{collection}/{model['id']}/{field}: Relation Error: "

        replacement = None
        if self.is_structured_field(field):
            _, replacement = self.to_template_field(collection, field)

        if field_type == "relation":
            foreign_id = model[field]
            if foreign_id is None:
                return

            foreign_collection, foreign_field = self.get_to(field, collection)

            self.check_reverse_relation(
                collection,
                model["id"],
                model,
                foreign_collection,
                foreign_id,
                foreign_field,
                basemsg,
                replacement,
            )

        elif field_type == "relation-list":
            foreign_ids = model[field]
            if foreign_ids is None:
                return

            foreign_collection, foreign_field = self.get_to(field, collection)

            for foreign_id in foreign_ids:
                self.check_reverse_relation(
                    collection,
                    model["id"],
                    model,
                    foreign_collection,
                    foreign_id,
                    foreign_field,
                    basemsg,
                    replacement,
                )

        elif field_type == "generic-relation" and model[field] is not None:
            foreign_collection, foreign_id = self.split_fqid(model[field])
            foreign_field = self.get_to_generic_case(
                collection, field, foreign_collection
            )

            self.check_reverse_relation(
                collection,
                model["id"],
                model,
                foreign_collection,
                foreign_id,
                foreign_field,
                basemsg,
                replacement,
            )

        elif field_type == "generic-relation-list" and model[field] is not None:
            for fqid in model[field]:
                foreign_collection, foreign_id = self.split_fqid(fqid)
                foreign_field = self.get_to_generic_case(
                    collection, field, foreign_collection
                )

                self.check_reverse_relation(
                    collection,
                    model["id"],
                    model,
                    foreign_collection,
                    foreign_id,
                    foreign_field,
                    basemsg,
                    replacement,
                )

    def get_to(self, field: str, collection: str) -> Tuple[str, str]:
        if self.is_structured_field(field):
            field, _ = self.to_template_field(collection, field)

        field_description = self.models[collection][field]
        if field_description["type"] == "template":
            to = field_description["fields"]["to"]
        else:
            to = field_description["to"]
        return to.split("/")

    def find_model(self, collection: str, id: int) -> Optional[Dict[str, Any]]:
        c = self.data.get(collection, [])
        for model in c:
            if model["id"] == id:
                return model
        return None

    def check_reverse_relation(
        self,
        collection: str,
        id: int,
        model: Dict[str, Any],
        foreign_collection: str,
        foreign_id: int,
        foreign_field: str,
        basemsg: str,
        replacement: Optional[str],
    ) -> None:
        actual_foreign_field = foreign_field
        if self.is_template_field(foreign_field):
            if replacement:
                actual_foreign_field = self.make_structured(foreign_field, replacement)
            else:
                replacement_collection = self.models[foreign_collection][foreign_field][
                    "replacement_collection"
                ]
                replacement = model.get(f"{replacement_collection}_id")
                if not replacement:
                    self.errors.append(
                        f"{basemsg} points to {foreign_collection}/{foreign_id}/{foreign_field},"
                        f" but there is no replacement for {replacement_collection}"
                    )
                actual_foreign_field = self.make_structured(foreign_field, replacement)

        foreign_model = self.find_model(foreign_collection, foreign_id)
        foreign_value = (
            foreign_model.get(actual_foreign_field)
            if foreign_model is not None
            else None
        )
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
                f"{basemsg} points to {foreign_collection}/{foreign_id}/{actual_foreign_field},"
                " but the reverse relation for is corrupt"
            )

    def split_fqid(self, fqid: str) -> Tuple[str, int]:
        try:
            collection, _id = fqid.split("/")
            id = int(_id)
            if collection not in self.models.keys():
                raise CheckException(f"Fqid {fqid} has an invalid collection")
            return collection, id
        except (ValueError, AttributeError):
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
        """Returns all reverse relations as collectionfields"""
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
    files = sys.argv[1:]
    if not files:
        files = DEFAULT_FILES

    is_import = "--import" in files
    if is_import:
        files = [x for x in files if x != "--import"]

    failed = False
    for f in files:
        with open(f) as data:
            try:
                Checker(json.load(data), is_import=is_import).run_check()
            except CheckException as e:
                print(f"Check for {f} failed:\n", e)
                failed = True
            else:
                print(f"Check for {f} successful.")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
