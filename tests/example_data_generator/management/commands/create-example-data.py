from textwrap import dedent

from django.contrib.auth.hashers import make_password
from django.core.management.base import BaseCommand, CommandError
from django.utils.crypto import get_random_string

from openslides.agenda.models import Item
from openslides.assignments.models import Assignment
from openslides.motions.models import Motion
from openslides.topics.models import Topic
from openslides.users.models import Group, User

MOTION_NUMBER_OF_PARAGRAPHS = 4

LOREM_IPSUM = [
    """\
    <p>Lorem ipsum dolor sit amet, consectetur adipisici elit, sed eiusmod
    tempor incidunt ut labore et dolore magna aliqua. Ut enim ad minim
    veniam, quis nostrud exercitation ullamco laboris nisi ut aliquid ex ea
    commodi consequat. Quis aute iure reprehenderit in voluptate velit esse
    cillum dolore eu fugiat nulla pariatur. Excepteur sint obcaecat
    cupiditat non proident, sunt in culpa qui officia deserunt mollit anim
    id est laborum.</p>
    """,

    """\
    <p>Sed ut perspiciatis, unde omnis iste natus error sit voluptatem
    accusantium doloremque laudantium, totam rem aperiam eaque ipsa, quae
    ab illo inventore veritatis et quasi architecto beatae vitae dicta
    sunt, explicabo. Nemo enim ipsam voluptatem, quia voluptas sit,
    aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos,
    qui ratione voluptatem sequi nesciunt, neque porro quisquam est, qui
    dolorem ipsum, quia dolor sit amet consectetur adipisci[ng] velit, sed
    quia non numquam [do] eius modi tempora inci[di]dunt, ut labore et
    dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam,
    quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut
    aliquid ex ea commodi consequatur? Quis autem vel eum iure
    reprehenderit, qui in ea voluptate velit esse, quam nihil molestiae
    consequatur, vel illum, qui dolorem eum fugiat, quo voluptas nulla
    pariatur?</p>
    """,

    """\
    <p>At vero eos et accusamus et iusto odio dignissimos ducimus, qui
    blanditiis praesentium voluptatum deleniti atque corrupti, quos dolores
    et quas molestias excepturi sint, obcaecati cupiditate non provident,
    similique sunt in culpa, qui officia deserunt mollitia animi, id est
    laborum et dolorum fuga. Et harum quidem rerum facilis est et expedita
    distinctio. Nam libero tempore, cum soluta nobis est eligendi optio,
    cumque nihil impedit, quo minus id, quod maxime placeat, facere
    possimus, omnis voluptas assumenda est, omnis dolor repellendus.
    Temporibus autem quibusdam et aut officiis debitis aut rerum
    necessitatibus saepe eveniet, ut et voluptates repudiandae sint et
    molestiae non recusandae. Itaque earum rerum hic tenetur a sapiente
    delectus, ut aut reiciendis voluptatibus maiores alias consequatur aut
    perferendis doloribus asperiores repellat…</p>
    """,
]

DEFAULT_NUMBER = 100
STAFF_USER_USERNAME = 'admin{}'
DEFAULT_USER_USERNAME = 'user{}'
PASSWORD = 'password'


class Command(BaseCommand):
    """
    Command to create example data for OpenSlides.
    """
    help = 'Create example data for OpenSlides.'

    chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

    def add_arguments(self, parser):
        """
        Adds arguments to the command parser. The default values for the apps
        are set by DEFAULT_NUMBER.
        """
        parser.add_argument(
            '--only',
            action='store_true',
            help='Only the given objects are created i. e. all defaults are '
                 'set to 0.',
        )
        parser.add_argument(
            '-t', '--topics',
            type=int,
            help='Number of topics to be created (default {}).'.format(
                DEFAULT_NUMBER),
        )
        parser.add_argument(
            '-m', '--motions',
            type=int,
            help='Number of motions to be created (default {}).'.format(
                DEFAULT_NUMBER),
        )
        parser.add_argument(
            '-a', '--assignments',
            type=int,
            help='Number of assignments to be created (default {}).'.format(
                DEFAULT_NUMBER),
        )
        parser.add_argument(
            '-u', '--users',
            nargs=2,
            type=int,
            help='Number of users to be created. The first number of users is '
                 'added to the group "Staff" (default {}). The second number '
                 'of users is not added to any group (default {}).'.format(
                    DEFAULT_NUMBER, DEFAULT_NUMBER),
        )

    def handle(self, *args, **options):
        self.create_topics(options)
        self.create_motions(options)
        self.create_assignments(options)
        self.create_users(options)

    def create_topics(self, options):
        number_of_topics = options['topics']
        if number_of_topics is None and not options['only']:
            number_of_topics = DEFAULT_NUMBER
        if number_of_topics is not None and number_of_topics > 0:
            self.stdout.write('Start creating {} topcis ...'.format(number_of_topics))
            current_topics = list(Topic.objects.values_list('id', flat=True))
            new_topics = []
            for i in range(number_of_topics):
                new_topics.append(Topic(title=get_random_string(20, self.chars)))
            Topic.objects.bulk_create(new_topics)
            items = []
            for topic in Topic.objects.exclude(pk__in=current_topics):
                items.append(Item(content_object=topic, type=Item.AGENDA_ITEM))
            Item.objects.bulk_create(items)
            self.stdout.write(self.style.SUCCESS('{} topcis successfully created.'.format(number_of_topics)))
        elif number_of_topics is not None and number_of_topics < 0:
            raise CommandError('Number for topics must not be negative.')

    def create_motions(self, options):
        number_of_motions = options['motions']
        if number_of_motions is None and not options['only']:
            number_of_motions = DEFAULT_NUMBER
        if number_of_motions is not None and number_of_motions > 0:
            self.stdout.write('Start creating {} motions ... (sorry, this might be slow) ...'.format(number_of_motions))
            text = ''
            for i in range(MOTION_NUMBER_OF_PARAGRAPHS):
                text += dedent(LOREM_IPSUM[i % 3])
            for i in range(number_of_motions):
                motion = Motion(
                    title=get_random_string(20, self.chars),
                    text=text,
                )
                motion.save(skip_autoupdate=True)
            self.stdout.write(self.style.SUCCESS('{} motions successfully created.'.format(number_of_motions)))
        elif number_of_motions is not None and number_of_motions < 0:
            raise CommandError('Number for motions must not be negative.')

    def create_assignments(self, options):
        number_of_assignments = options['assignments']
        if number_of_assignments is None and not options['only']:
            number_of_assignments = DEFAULT_NUMBER
        if number_of_assignments is not None and number_of_assignments > 0:
            self.stdout.write('Start creating {} assignments ...'.format(number_of_assignments))
            current_assignments = list(Assignment.objects.values_list('id', flat=True))
            new_assignments = []
            for i in range(number_of_assignments):
                new_assignments.append(Assignment(title=get_random_string(20, self.chars), open_posts=1))
            Assignment.objects.bulk_create(new_assignments)
            items = []
            for assignment in Assignment.objects.exclude(pk__in=current_assignments):
                items.append(Item(content_object=assignment))
            Item.objects.bulk_create(items)
            self.stdout.write(self.style.SUCCESS('{} assignments successfully created.'.format(number_of_assignments)))
        elif number_of_assignments is not None and number_of_assignments < 0:
            raise CommandError('Number for assignments must not be negative.')

    def create_users(self, options):
        self.create_staff_users(options)
        self.create_default_users(options)

    def create_staff_users(self, options):
        if options['users'] is None and not options['only']:
            staff_users = DEFAULT_NUMBER
        elif options['users'] is None:
            staff_users = None
        else:
            staff_users = options['users'][0]
        if staff_users is not None and staff_users > 0:
            self.stdout.write('Start creating {} staff users ... (sorry, this might be slow) ...'.format(staff_users))
            group_staff = Group.objects.get(name='Staff')
            hashed_password = make_password(PASSWORD, '', 'md5')
            current_users = list(User.objects.values_list('id', flat=True))
            new_users = []
            for i in range(staff_users):
                new_users.append(User(
                    username=STAFF_USER_USERNAME.format(i),
                    default_password=PASSWORD,
                    password=hashed_password
                ))
            User.objects.bulk_create(new_users)
            for user in User.objects.exclude(pk__in=current_users):
                user.groups.add(group_staff)
            self.stdout.write(self.style.SUCCESS('{} staff users successfully created.'.format(staff_users)))
        elif staff_users is not None and staff_users < 0:
            raise CommandError('Number for staff users must not be negative.')

    def create_default_users(self, options):
        if options['users'] is None and not options['only']:
            default_users = DEFAULT_NUMBER
        elif options['users'] is None:
            default_users = None
        else:
            default_users = options['users'][1]
        if default_users is not None and default_users > 0:
            self.stdout.write('Start creating {} default users ...'.format(default_users))
            hashed_password = make_password(PASSWORD, '', 'md5')
            new_users = []
            for i in range(default_users):
                new_users.append(User(
                    username=DEFAULT_USER_USERNAME.format(i),
                    default_password=PASSWORD,
                    password=hashed_password
                ))
            User.objects.bulk_create(new_users)
            self.stdout.write(self.style.SUCCESS('{} default users successfully created.'.format(default_users)))
        elif default_users is not None and default_users < 0:
            raise CommandError('Number for default users must not be negative.')
