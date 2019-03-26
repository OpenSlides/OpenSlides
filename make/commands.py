from parser import command, argument, call
import yaml
import requirements

FAIL = "\033[91m"
SUCCESS = "\033[92m"
RESET = "\033[0m"


@command("check", help="Checks for pep8 errors in openslides and tests")
def check(args=None):
    """
    Checks for pep8 and other code styling conventions.
    """
    value = call("flake8 --max-line-length=150 --statistics openslides tests")
    value += call("python -m mypy openslides/ tests/")
    return value


@command("travis", help="Runs the code that travis does")
def travis(args=None):
    """
    Runs all commands that travis tests.
    """
    return_codes = []
    with open(".travis.yml") as f:
        travis = yaml.load(f)
        for line in travis["script"]:
            print(f"Run: {line}")
            return_code = call(line)
            return_codes.append(return_code)
            if return_code:
                print(FAIL + "fail!\n" + RESET)
            else:
                print(SUCCESS + "success!\n" + RESET)

    # Retuns True if one command exited with a different statuscode then 1
    return bool(list(filter(bool, return_codes)))


@argument("-r", "--requirements", nargs="?", default="requirements.txt")
@command(
    "min_requirements",
    help="Prints a pip line to install the minimum supported versions of "
    "the requirements.",
)
def min_requirements(args=None):
    """
    Prints a pip install command to install the minimal supported versions of a
    requirement file.

    Uses requirements.txt by default.

    The following line will install the version:

    pip install $(python make min_requirements)
    """

    def get_lowest_versions(requirements_file):
        with open(requirements_file) as f:
            for req in requirements.parse(f):
                if req.specifier:
                    for spec, version in req.specs:
                        if spec == ">=":
                            yield f"{req.name}=={version}"

    print(" ".join(get_lowest_versions(args.requirements)))


@command("clean", help="Deletes unneeded files and folders")
def clean(args=None):
    """
    Deletes all .pyc and .orig files and empty folders.
    """
    call('find -name "*.pyc" -delete')
    call('find -name "*.orig" -delete')
    call("find -type d -empty -delete")


@command("format", help="Format code with isort and black")
def isort(args=None):
    call("isort --recursive openslides tests")
    call("black --target-version py36 openslides tests")
