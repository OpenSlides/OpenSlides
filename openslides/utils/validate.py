from typing import Any

import bleach

from .rest_api import ValidationError


allowed_tags = [
    "a",
    "img",  # links and images
    "br",
    "p",
    "span",
    "blockquote",  # text layout
    "strike",
    "del",
    "ins",
    "strong",
    "u",
    "em",
    "sup",
    "sub",
    "pre",  # text formatting
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",  # headings
    "ol",
    "ul",
    "li",  # lists
    "table",
    "caption",
    "thead",
    "tbody",
    "th",
    "tr",
    "td",  # tables
]
allowed_attributes = {
    "*": ["class", "style"],
    "img": ["alt", "src", "title"],
    "a": ["href", "title"],
    "th": ["scope"],
    "ol": ["start"],
}
allowed_styles = [
    "color",
    "background-color",
    "height",
    "width",
    "text-align",
    "float",
    "padding",
    "text-decoration",
]


def validate_html(html: str) -> str:
    """
    This method takes a string and escapes all non-whitelisted html entries.
    Every field of a model that is loaded trusted in the DOM should be validated.
    During copy and paste from Word maybe some tabs are spread over the html. Remove them.
    """
    html = html.replace("\t", "")
    return bleach.clean(
        html, tags=allowed_tags, attributes=allowed_attributes, styles=allowed_styles
    )


def validate_json(json: Any, max_depth: int) -> Any:
    """
    Traverses through the JSON structure (dicts and lists) and runs
    validate_html on every found string.

    Give max-depth to protect against stack-overflows. This should be the
    maximum nested depth of the object expected.
    """

    if max_depth == 0:
        raise ValidationError({"detail": "The JSON is too nested."})

    if isinstance(json, dict):
        return {key: validate_json(value, max_depth - 1) for key, value in json.items()}
    if isinstance(json, list):
        return [validate_json(item, max_depth - 1) for item in json]
    if isinstance(json, str):
        return validate_html(json)

    return json
