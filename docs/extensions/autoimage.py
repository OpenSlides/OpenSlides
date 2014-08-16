#
# Extension for Sphinx to add new directive 'autoimage' which works as subclass
# of the internal Image directive.
# Author: Pedro Kroger
# see http://pedrokroger.net/using-sphinx-write-technical-books/
# Code snippet from https://gist.github.com/kroger/3856821 with some
# modifications for OpenSlides.
#

import os

from docutils import nodes
from docutils.parsers.rst import directives
from docutils.parsers.rst.directives.images import Image


class Autoimage(Image):

    align_h_values = ('left', 'center', 'right')
    align_v_values = ('top', 'middle', 'bottom')
    align_values = align_v_values + align_h_values

    def align(argument):
        # This is not callable as self.align.  We cannot make it a
        # staticmethod because we're saving an unbound method in
        # option_spec below.
        return directives.choice(argument, Image.align_values)

    option_spec = {'scale-html': directives.percentage,
                   'scale-latex': directives.percentage,
                   'scale-epub2': directives.percentage,
                   'scale-mobi': directives.percentage,
                   'scale': directives.percentage,
                   'class': directives.class_option,
                   'alt': directives.unchanged,
                   'name': directives.unchanged,
                   'target': directives.unchanged_required,
                   'align': align,
                   }

    def run(self):
        old_filename = self.arguments[0]
        env = self.state.document.settings.env
        builder_name = env.app.builder.name

        self.arguments[0] = os.path.join(env.config.image_dir, old_filename)

        # this doesn't quite work because sphinx stores the previous
        # values and share among builds. If I do a make clean between
        # each run it works. Yuck.
        # I need to run sphinx-build with -E
        self.options['scale'] = self.options.get('scale-' + builder_name, 100)
        return super(Autoimage, self).run()


def setup(app):
    app.add_directive('autoimage', Autoimage)
    app.add_config_value('image_dir', '../_images', False)
