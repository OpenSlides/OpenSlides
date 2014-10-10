from argparse import ArgumentParser
from subprocess import call as _call

parser = ArgumentParser(description='Development scripts for OpenSlides')
subparsers = parser.add_subparsers()


def command(*args, **kwargs):
    """
    Decorator to create a argparse command.

    The arguments to this decorator are used as arguments for the argparse
    command.
    """
    class decorator:
        def __init__(self, func):
            self.parser = subparsers.add_parser(*args, **kwargs)
            self.parser.set_defaults(func=func)
            self.func = func

        def __call__(self, *args, **kwargs):
            return self.func(*args, **kwargs)

    return decorator


def argument(*args, **kwargs):
    """
    Decorator to create arguments for argparse commands.

    The arguments to this decorator are used as arguments for the argparse
    argument.

    Does only work if the decorated function was decorated with the
    command-decorator before.
    """
    def decorator(func):
        func.parser.add_argument(*args, **kwargs)
        def wrapper(*func_args, **func_kwargs):
            return func(*func_args, **func_kwargs)
        return wrapper
    return decorator


def call(*args, **kwargs):
    """
    Calls a command in a shell.
    """
    return _call(shell=True, *args, **kwargs)
