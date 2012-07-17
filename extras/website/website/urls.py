from django.conf.urls import patterns, include, url
from django.conf.urls.i18n import i18n_patterns
from django.views.generic import TemplateView

#from views import TemplateView
# Uncomment the next two lines to enable the admin:
# from django.contrib import admin
# admin.autodiscover()

urlpatterns = patterns('',
    url(r'^$', TemplateView.as_view(template_name="home.html"), name='home',),
    url(r'^about/$', TemplateView.as_view(template_name="about.html"), name='about',),
    url(r'^about/features$', TemplateView.as_view(template_name="features.html"), name='features',),
    url(r'^about/license$', TemplateView.as_view(template_name="license.html"), name='license',),
    url(r'^about/references$', TemplateView.as_view(template_name="references.html"), name='references',),
    url(r'^about/press$', TemplateView.as_view(template_name="press.html"), name='press',),
    url(r'^download/$', TemplateView.as_view(template_name="download.html"), name='download',),
    url(r'^support/$', TemplateView.as_view(template_name="support.html"), name='support',),
    url(r'^development/$', TemplateView.as_view(template_name="development.html"), name='development',),
    url(r'^contact/$', TemplateView.as_view(template_name="contact.html"), name='contact',),
    url(r'^demo/$', TemplateView.as_view(template_name="demo.html"), name='demo',),
    url(r'^impressum/$', TemplateView.as_view(template_name="impressum.html"), name='impressum',),
)
