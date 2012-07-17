from django.views.generic import TemplateView

class TemplateView():

    def get_context_data(self, **kwargs):
         context = super(TemplateView, self).get_context_data(**kwargs)
         print self.request
#        template_manipulation.send(sender=self.__class__, request=self.request, context=context)
         return context