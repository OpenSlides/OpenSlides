import sys

import commands  # noqa
from parser import parser


if len(sys.argv) < 2:
    args = parser.parse_args(["--help"])
else:
    args = parser.parse_args()

# Runs the command end exits the script with the return-code of the command
exit(args.func(args))
