#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    :copyright: 2011, 2012 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

VERSION = (1, 3, 0, 'final', 0)  # During development it is the next release
RELEASE = True


def get_version(version=None, release=None):
    """
    Derives a PEP386-compliant version number from VERSION. Adds id of
    the current git commit.
    """
    if version is None:
        version = VERSION
    if release is None:
        release = RELEASE
    assert len(version) == 5
    assert version[3] in ('alpha', 'beta', 'rc', 'final')
    # Now build the two parts of the version number:
    # main = X.Y[.Z]
    # sub = {a|b|c}N for alpha, beta and rc releases
    # Add '-dev', if it is not a release commit
    main_parts = 2 if version[2] == 0 else 3
    main = '.'.join(str(x) for x in version[:main_parts])
    if version[3] != 'final':
        mapping = {'alpha': 'a', 'beta': 'b', 'rc': 'c'}
        sub = mapping[version[3]] + str(version[4])
    else:
        sub = ''
    if not release:
        sub += '-dev'
    return main + sub


def get_git_commit_id():
    """
    Catches the commit id of the git head.
    """
    try:
        git_head = open('.git/HEAD', 'r').read().rstrip()
        if git_head[:5] == 'ref: ':
            git_commit_id = open('.git/%s' % git_head[5:], 'r').read().rstrip()
        else:
            git_commit_id = git_head
    except IOError:
        git_commit_id = 'unknown'
    return str(git_commit_id)
