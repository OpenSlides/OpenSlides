import socket
import os
import sys
from os.path import realpath, join, dirname
try:
    from mercurial import ui as hgui
    from mercurial.localrepo import localrepository
    from mercurial.node import short as shorthex
    from mercurial.error import RepoError
    nomercurial = False
except:
    nomercurial = True

from django.template import add_to_builtins


add_to_builtins('django.templatetags.i18n')

OPENSLIDES_REVISION = 'unknown'

# Don't read ~/.hgrc, as extensions aren't available in the venvs
os.environ['HGRCPATH'] = ''


def _bootstrap():
    conts = realpath(join(dirname(__file__)))
    try:
        ui = hgui.ui()
        repository = localrepository(ui, join(conts, '..'))
        #repository = localrepository(ui, conts)
        ctx = repository['.']
        if ctx.tags() and ctx.tags() != ['tip']:
            revision = ' '.join(ctx.tags())
        else:
            revision = '%(num)s:%(id)s' % {
                'num': ctx.rev(), 'id': shorthex(ctx.node())
            }
    except TypeError:
        revision = 'unknown'
    except RepoError:
        return 0

    # This value defines the timeout for sockets in seconds.  Per default python
    # sockets do never timeout and as such we have blocking workers.
    # Socket timeouts are set globally within the whole application.
    # The value *must* be a floating point value.
    socket.setdefaulttimeout(10.0)

    return revision

if not nomercurial:
    OPENSLIDES_REVISION = _bootstrap()
del _bootstrap
