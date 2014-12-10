def add_mediafile_stylesheets(sender, request, context, **kwargs):
    """
    Receiver function to add the mediafile.css to the context. It is
    connected to the signal openslides.utils.signals.template_manipulation
    during app loading.
    """
    context['extra_stylefiles'].append('css/mediafile.css')
