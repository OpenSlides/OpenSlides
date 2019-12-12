#!/usr/bin/env python

import sys

from openslides.__main__ import main


if __name__ == "__main__":
    if len(sys.argv) == 1:
        sys.argv.append("--help")
    exit(main())
