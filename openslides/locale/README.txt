Steps to update translation for OpenSlides:
------------------------------------------

1. Go to project root directory:
   $ cd openslides

2. Update the German po file (locale/de/LC_MESSAGES/django.po):
   $ django-admin.py makemessages -l de

3. Edit the German po file: locale/de/LC_MESSAGES/django.po
   (Search for "fuzzy" and empty msgstr entries.)

4. Update the German mo file (locale/de/LC_MESSAGES/django.mo):
   $ django-admin.py compilemessages

5. Restart server:
   $ python manage.py runserver
   
   
   
Additional hints for internationalization (i18n) in Django:
- http://docs.djangoproject.com/en/dev/topics/i18n/internationalization/
- http://docs.djangoproject.com/en/dev/topics/i18n/localization/ 