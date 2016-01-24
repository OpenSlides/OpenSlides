Instruction to update translations for OpenSlides (JavaScipt and Django):
-------------------------------------------------------------------------

1. Update English resource files:

   a) for JavaScript run:
      $ ./node_modules/.bin/gulp pot
      -> updates 'openslides/locale/angular-gettext/template-en.pot'

   b) for Django:
      $ cd openslides
      $ django-admin.py makemessages -l en
      -> updates 'openslides/locale/en/LC_MESSAGES/django.po'

2. Commit and merge the following files into OpenSlides master repo:
   a) openslides/locale/angular-gettext/template-en.pot
   b) openslides/locale/en/LC_MESSAGES/django.po

   Transifex will update both resource files once a day by pulling from GitHub.

3. Translate both files in transifex into desired languages.
   https://www.transifex.com/openslides/

4. Download translated po files for each language and override it:
   a) openslides/locale/angular-gettext/{LANG-CODE}.po
   b) openslides/locale/{LANG-CODE}/LC_MESSAGES/django.po

5. Create mo file for each language (only for django po files required)
   $ cd openslides
   $ django-admin.py compilemessages

6. Commit and merge for each language the following files:
   a) openslides/locale/angular-gettext/{LANG-CODE}.po
   b) openslides/locale/{LANG-CODE}/LC_MESSAGES/django.po
      openslides/locale/{LANG-CODE}/LC_MESSAGES/django.mo
