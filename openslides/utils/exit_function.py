class ExitFunction(Exception):
    pass


def exit_function(function):
    def wrapper(*args, **kwargs):
        try:
            function(*args, **kwargs)
        except ExitFunction:
            pass
    return wrapper
