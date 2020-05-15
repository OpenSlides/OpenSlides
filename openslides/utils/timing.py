from . import logging

timelogger = logging.getLogger(__name__)

def timeprint(name, times):
    s = f"{name}: "
    for i in range(1, len(times)):
        s += f"{i}: {times[i]-times[i-1]:.5f} "
    s += f"sum: {times[-1]-times[0]:.5f}"
    timelogger.info(s)
