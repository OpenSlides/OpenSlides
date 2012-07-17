
# Oskar
class TemplateView(_TemplateView):
    def get_context_data(self, **kwargs):
        context = super(TemplateView, self).get_context_data(**kwargs)
        context[request] = self.request
        return context