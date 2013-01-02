Instruction to update translation for OpenSlides:
-------------------------------------------------

1. Go to the openslides directory (which contains the 'locale' directory):
   $ cd openslides

2. Update the German po file (locale/de/LC_MESSAGES/django.po):
   $ django-admin.py makemessages -l de
   $ django-admin.py makemessages -l de -d djangojs

3. Edit the German po file: locale/de/LC_MESSAGES/django.po
   Don't forget the js-file: locale/de/LC_MESSAGES/djangojs.po
   (Search for "fuzzy" and empty msgstr entries.)

4. Update the German mo file (locale/de/LC_MESSAGES/django.mo):
   $ django-admin.py compilemessages

5. Restart server:
   $ python manage.py runserver

--
Additional hints for internationalization (i18n) in Django:
https://docs.djangoproject.com/en/dev/topics/i18n/

Note: gettext is required to extract message IDs or compile message files.
For gettext on Windows read:
https://docs.djangoproject.com/en/dev/topics/i18n/translation/#gettext-on-windows
