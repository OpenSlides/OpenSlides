# Using SFTP as storage backend.

Install django-storages and paramiko (see requeirements/production.txt). Enable
in the settings::

   # Use SFTP as a mediafile storage
   DEFAULT_FILE_STORAGE = "storages.backends.sftpstorage.SFTPStorage"
   SFTP_STORAGE_HOST = "localhost"
   SFTP_STORAGE_ROOT = "/upload/django/storage/"
   SFTP_STORAGE_PARAMS = {
      "username": "",
      "password": ""
   }

You may read more about all settings here: `SFTP settings
<https://django-storages.readthedocs.io/en/latest/backends/sftp.html>`_.

