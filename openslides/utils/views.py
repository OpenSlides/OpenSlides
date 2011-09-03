from django.conf import settings
from django.http import HttpResponseServerError
from django.template import Context, loader, RequestContext
from django.template.loader import render_to_string

def server_error(request, template_name='500.html'):
    """
    500 error handler.

    Templates: `500.html`
    Context:
        MEDIA_URL
            Path of static media (e.g. "media.example.org")
    """
    t = loader.get_template("500.html") # You need to create a 500.html template.
    return HttpResponseServerError(render_to_string('500.html', context_instance=RequestContext(request)))
