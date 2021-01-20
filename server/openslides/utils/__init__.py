# overwrite the builtin print to always flush
def flushprint(*args, **kwargs):  # type: ignore
    if "flush" not in kwargs:
        kwargs["flush"] = True

    __builtins__["oldprint"](*args, **kwargs)  # type: ignore


if "oldprint" not in __builtins__:  # type: ignore
    __builtins__["oldprint"] = __builtins__["print"]  # type: ignore
__builtins__["print"] = flushprint  # type: ignore
