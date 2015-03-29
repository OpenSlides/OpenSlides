def add_assignment_stylesheets(sender, request, context, **kwargs):
    """
    Receiver function to add the assignment.css to the context. It is
    connected to the signal openslides.utils.signals.template_manipulation
    during app loading.
    """
    context['extra_stylefiles'].append('css/assignment.css')
