import bleach

allowed_tags = [
    'a', 'img',  # links and images
    'br', 'p', 'span', 'blockquote',  # text layout
    'strike', 'strong', 'u', 'em', 'sup', 'sub', 'pre',  # text formatting
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',  # headings
    'ol', 'ul', 'li',  # lists
    'table', 'caption', 'thead', 'tbody', 'th', 'tr', 'td',  # tables
]
allowed_attributes = {
    '*': ['class', 'style'],
    'img': ['alt', 'src', 'title'],
    'a': ['href', 'title'],
    'th': ['scope'],
    'ol': ['start'],
}
allowed_styles = [
    'color', 'background-color', 'height', 'width', 'text-align', 'float', 'padding'
]


def validate_html(html: str) -> str:
    """
    This method takes a string and escapes all non-whitelisted html entries.
    Every field of a model that is loaded trusted in the DOM should be validated.
    During copy and paste from Word maybe some tabs are spread over the html. Remove them.
    """
    html = html.replace('\t', '')
    return bleach.clean(
        html,
        tags=allowed_tags,
        attributes=allowed_attributes,
        styles=allowed_styles)
