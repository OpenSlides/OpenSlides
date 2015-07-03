import re

from parser import command, argument, call

FAIL = '\033[91m'
SUCCESS = '\033[92m'
RESET   = '\033[0m'


@argument('module', nargs='?', default='')
@command('test', help='runs the tests')
def test(args=None):
    """
    Runs the tests.
    """
    module = getattr(args, 'module', '')
    if module == '':
        module = 'tests'
    else:
        module = 'tests.{}'.format(module)
    return call("DJANGO_SETTINGS_MODULE='tests.settings' coverage run "
                "./manage.py test {}".format(module))


@argument('--plain', action='store_true')
@command('coverage', help='Runs all tests and builds the coverage html files')
def coverage(args=None, plain=None):
    """
    Runs the tests and creates a coverage report.

    By default it creates a html report. With the argument --plain, it creates
    a plain report and fails under a certain amount of untested lines.
    """
    if plain is None:
        plain = getattr(args, 'plain', False)
    if plain:
        return call('coverage report -m --fail-under=80')
    else:
        return call('coverage html')


@command('check', help='Checks for pep8 errors in openslides and tests')
def check(args=None):
    """
    Checks for pep8 and other code styling conventions.
    """
    return call('flake8 --max-line-length=150 --statistics openslides tests')


@command('travis', help='Runs the code that travis does')
def travis(args=None):
    """
    Runs all commands that travis tests.
    """
    return_codes = []
    with open('.travis.yml') as f:
        script_lines = False
        for line in (line.strip() for line in f.readlines()):
            if line == 'script:':
                script_lines = True
                continue
            if not script_lines or not line:
                continue

            match = re.search(r'"(.*)"', line)
            print('Run: %s' % match.group(1))
            return_code = call(match.group(1))
            return_codes.append(return_code)
            if return_code:
                print(FAIL + 'fail!\n' + RESET)
            else:
                print(SUCCESS + 'success!\n' + RESET)

    # Retuns True if one command exited with a different statuscode then 1
    return bool(list(filter(bool, return_codes)))


@argument('-r', '--requirements', nargs='?',
          default='requirements_production.txt')
@command('min_requirements',
         help='Prints a pip line to install the minimum supported versions of '
              'the requirements.')
def min_requirements(args=None):
    """
    Prints a pip install command to install the minimal supported versions of a
    requirement file.

    Uses requirements_production.txt by default.
    """

    import pip

    def get_lowest_versions(requirements_file):
        for line in pip.req.parse_requirements(requirements_file, session=pip.download.PipSession()):
            yield '%s==%s' % (line.req.key, line.req.specs[0][1])

    print('pip install %s' % ' '.join(get_lowest_versions(args.requirements)))


@command('clear',
         help='Deletes unneeded files and folders')
def clean(args=None):
    """
    Deletes all .pyc and .orig files and empty folders.
    """
    call('find -name "*.pyc" -delete')
    call('find -name "*.orig" -delete')
    call('find -type d -empty -delete')


@command('isort',
         help='Sorts all imports in all python files.')
def isort(args=None):
    return call('isort --recursive openslides tests')
