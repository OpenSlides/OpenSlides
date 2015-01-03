from random import choice, randint

from openslides.main import get_user_config_path, setup_django_environment
from openslides.participant.api import gen_username
from openslides.participant.models import User

# Import the openslide settings. Has has to be done before any other openslides
# import.
setup_django_environment(
    get_user_config_path('openslides', 'settings.py'))


# From jinja2
LOREM_IPSUM_WORDS = u'''\
a ac accumsan ad adipiscing aenean aliquam aliquet amet ante aptent arcu at
auctor augue bibendum blandit class commodo condimentum congue consectetuer
consequat conubia convallis cras cubilia cum curabitur curae cursus dapibus
diam dictum dictumst dignissim dis dolor donec dui duis egestas eget eleifend
elementum elit enim erat eros est et etiam eu euismod facilisi facilisis fames
faucibus felis fermentum feugiat fringilla fusce gravida habitant habitasse hac
hendrerit hymenaeos iaculis id imperdiet in inceptos integer interdum ipsum
justo lacinia lacus laoreet lectus leo libero ligula litora lobortis lorem
luctus maecenas magna magnis malesuada massa mattis mauris metus mi molestie
mollis montes morbi mus nam nascetur natoque nec neque netus nibh nisi nisl non
nonummy nostra nulla nullam nunc odio orci ornare parturient pede pellentesque
penatibus per pharetra phasellus placerat platea porta porttitor posuere
potenti praesent pretium primis proin pulvinar purus quam quis quisque rhoncus
ridiculus risus rutrum sagittis sapien scelerisque sed sem semper senectus sit
sociis sociosqu sodales sollicitudin suscipit suspendisse taciti tellus tempor
tempus tincidunt torquent tortor tristique turpis ullamcorper ultrices
ultricies urna ut varius vehicula vel velit venenatis vestibulum vitae vivamus
viverra volutpat vulputate'''

WORDS = LOREM_IPSUM_WORDS.split(' ')
NAME_WORDS = [w for w in WORDS if not '\n' in w]


def create_names(count, func=lambda: choice(NAME_WORDS)):
    """Yields a bunch of unique names"""
    used = []
    for _ in xrange(count + 1):
        name = func()
        while name in used:
            # use some random...
            name = '%s%d' % (name, randint(1, count))
        used.append(name)
        yield name

def random_user(names):
    first_name = names.next()
    last_name = names.next()
    return User(first_name=first_name, last_name=last_name,
                username=gen_username(first_name, last_name))


def make_testdata(app=None):
    if app == 'participant' or app is None:
        user_count = 100
        names_generator = create_names(user_count * 2)
        [random_user(names_generator).save() for i in xrange(user_count)]


if __name__ == "__main__":
    make_testdata()
