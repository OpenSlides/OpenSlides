import os
from parser import command, argument, call
import re
from urllib.request import urlopen


@argument('module', nargs='?', default='')
@command('test', help='runs the tests')
def test(args=None):
    """
    Runs the tests.
    """
    module = getattr(args, 'module', '')
    return call("DJANGO_SETTINGS_MODULE='tests.settings' coverage run "
                "./manage.py django test %s" % module)


@argument('--plain', action='store_true')
@command('coverage', help='Runs all tests and builds the coverage html files')
def coverage(args=None, plain=None):
    """
    Runs the tests and creates a coverage report.

    By default it creates a html report. With the argument --plain, it creates
    a plain reports and fails under a certain amount of untested lines.
    """
    test()
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
    Runs the commands that travis tests.
    """
    return_codes = []
    with open('.travis.yml') as f:
        script_lines = False
        for line in (line.strip() for line in f.readlines()):
            if line == 'script:':
                script_lines = True
                continue
            if not script_lines:
                continue

            match = re.search(r'"(.*)"', line)
            return_codes.append(call(match.group(1)))

    # Retuns True if one command exited with a different statuscode then 1
    return bool(list(filter(bool, return_codes)))


@argument('-r', '--requirements', nargs='?',
          default='requirements_production.txt')
@command('lowest_requirements',
         help='Returns a pip line to install the lowest supported versions of '
              'the requirements')
def lowest_requirements(args=None):
    """
    Prints a pip install command to install the lowest supported versions of a
    requirement file.

    Uses requirements_production.txt by default.
    """

    from pip.req import parse_requirements

    def get_lowest_versions(requirements_file):
        for line in parse_requirements(requirements_file):
            yield '%s==%s' % (line.req.key, line.req.specs[0][1])

    print('pip install %s' % ' '.join(get_lowest_versions(args.requirements)))


@argument('-d', '--development', action='store_true')
@command('jsrequirements', help="Downloads the JS requirements")
def download_js_requirements(args=None):
    from js_requirements import JS_REQUIREMENTS

    development = getattr(args, 'development', False)
    directory = os.path.join('openslides', 'core', 'static', 'js', 'lib')

    if not os.path.exists(directory):
        os.makedirs(directory)

    for requirement in JS_REQUIREMENTS:
        if development and len(requirements) == 3:
            url_part = 2
        else:
            url_part = 1
        url = requirement[url_part]
        response = urlopen(url)
        path = os.path.join(directory, requirement[0])
        with open(path, 'wb') as f:
            f.write(response.read())


@command('art', help='For NJ')
def art(args=None):
    print("""
                                    WNKOON
                                  WNKOOKN
                                WNKOOKN
                              WN0OOKN
                            WX0kOKN
                          WX0kOKW
                        WXOxOKW
  WNXXKX              WX0kx0W
  KOXKxxX           WX00N NKXXW
  00WXkxK          X0KNNXNWWWXKKXXN
  0kX0xd0          0ONWNKKKXNWNKKOO0KW
WX0OxdxkOKXXXXXXXNNkkXNNXKKKKKNNK00OkO0XW
X00o'.,d0kxOO000000dxXXNXKK0000KXX0OkkxxkOX
NK0d;,;x0xxkkkkkkOOodKKXXK0000OOO0K0kkkkxddx0W
 N0kkxkkOXWWWWWWWWWOxKKKKK000OOOOkOOOkkxxxxcoN
  OxKOoo0          OkKK0000OOOkkkkxxxxxddoo:oX
  OkN0ooK          XOOOOdoddddddddoooolcoxddON
  OxN0ooK               XO0XKKKK0000OkoxN
  OxX0ooK                NXNNNNXXXXXXXXW
  OdX0loK
  OdKOloK
  OdKOllK
  OdKOclK
  Oo0OclK
  Oo0kclK
  OlOkclK
  OlOkclK
  OlOkcl0
KX0k0Okk0KKKKKKKKKKKKKKK000000000000OOOOOOOOOOOOkkkkkkkkkkkxxxx
OK0000000OOOOOOOOOOkkkkkkkkkkkxxxxxxxxxxxxdddddddddoooooooooool
xOkddddoooooooooolllllllllllcccccccccccc:::::::::;;;;;;;;;;;;:o
OKkocccccccc::::::::;;;;;;;;;,,,,,,,,,,'''''''''............';O
kOxolllcccccccccccc:::::::::::;;;;;;;;;;;,,,,,,,,'''''''....';k
kOkkkkkkkkxxxxxxxxxxxxxdddddddddddooooooooooollllllllcccccccccl
KOkOxlllcccccccc::;::;;:;;;;;,;;,,,,,,,,,,,,,,,','''''''''',lk0
 WKOkoc::::;;;;,''''''''''''..............................,dX
  W0xxdllllllccccccccccc:::::::::::;;;;;;;;;;;;,,,,,,,''';dX
  N0OOkOkxddddddddddoooooooooolllllllllllccccccccc::::ccodxX
   WNXOOxc;;,,,,,,,,''''''''''........................,oKXN
      WK0xc;,,,,,,,'''''''''.........................;xN
        XOxol:;,,'''''''''..........................:OW
         NXK0koc:,,''''.........................,cdOXW
             NXOl:;::;;,,''.............'''''''oXW
               K;..'oOkxxdlc:::;;;::clodxOOl...d
               Nd;;l0    NX000OOOO00KNW    0c,;O               """)
