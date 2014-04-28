#!/usr/bin/env python
# -*- coding: utf-8 -*-

import errno
import glob
import os
import re
import shutil
import sys
import zlib
zlib.Z_DEFAULT_COMPRESSION = zlib.Z_BEST_COMPRESSION
import zipfile

import distutils.ccompiler
import distutils.sysconfig

import pkg_resources

import wx

sys.path.insert(0, os.getcwd())
sys.path.insert(1, os.path.join(os.getcwd(), "extras"))
import openslides
import openslides_gui

COMMON_EXCLUDE = [
    r".pyc$",
    r".pyo$",
    r".po$",
    r".egg-info",
    r"\blocale/(?!de/|en/|fr/)[^/]+/"
]

LIBEXCLUDE = [
    r"^site-packages/",
    r"^test/",
    r"^curses/",
    r"^idlelib/",
    r"^lib2to3/",
    r"^lib-tk/",
    r"^msilib/",
]


SITE_PACKAGES = {
    "backports.ssl_match_hostname": {
        "copy": ["backports"],
    },
    "beautifulsoup4": {
        "copy": ["bs4"],
    },
    "bleach": {
        "copy": ["bleach"],
    },
    "html5lib": {
        "copy": ["html5lib"],
    },
    "django": {
        "copy": ["django"],
        "exclude": [
            r"^django/contrib/admindocs/",
            r"^django/contrib/comments/",
            r"^django/contrib/databrowse/",
            r"^django/contrib/flatpages/",
            r"^django/contrib/formtools/",
            r"^django/contrib/gis/",
            r"^django/contrib/localflavor/",
            r"^django/contrib/markup/",
            r"^django/contrib/redirects/",
            r"^django/contrib/sitemaps/",
            r"^django/contrib/syndication/",
            r"^django/contrib/webdesign/",
        ]
    },
    "django-haystack": {
        "copy": ["haystack"],
    },
    "django-mptt": {
        "copy": ["mptt"],
    },
    "jsonfield": {
        "copy": ["jsonfield"],
    },
    "reportlab": {
        "copy": [
            "reportlab",
            "_renderPM.pyd",
            "_rl_accel.pyd",
            "pyHnj.pyd",
            "sgmlop.pyd",
        ],
    },
    "setuptools": {
        "copy": [
            "setuptools",
            "easy_install.py",
            "pkg_resources.py"
        ],
    },
    "six": {
        "copy": ["six.py"],
    },
    "sockjs-tornado": {
        "copy": ["sockjs"],
    },
    "tornado": {
        "copy": ["tornado"],
    },
    "natsort": {
        "copy": ["natsort"],
    },
    "whoosh": {
        "copy": ["whoosh"],
    },
    "wx": {
        # NOTE: wxpython is a special case, see copy_wx
        "copy": [],
        "exclude": [
            r"^wx/tools/",
            r"^wx/py/",
            r"^wx/build/",
            r"^wx/lib/",
            r"wx/_activex.pyd",
            r"wx/_animate.pyd",
            r"wx/_aui.pyd",
            r"wx/_calendar.pyd",
            r"wx/_combo.pyd",
            r"wx/_gizmos.pyd",
            r"wx/_glcanvas.pyd",
            r"wx/_grid.pyd",
            r"wx/_html.pyd",
            r"wx/_media.pyd",
            r"wx/_richtext.pyd",
            r"wx/_stc.pyd",
            r"wx/_webkit.pyd",
            r"wx/_wizard.pyd",
            r"wx/_xrc.pyd",
            r"wx/gdiplus.dll",
            r"wx/wxbase28uh_xml_vc.dll",
            r"wx/wxmsw28uh_aui_vc.dll",
            r"wx/wxmsw28uh_gizmos_vc.dll",
            r"wx/wxmsw28uh_gizmos_xrc_vc.dll",
            r"wx/wxmsw28uh_gl_vc.dll",
            r"wx/wxmsw28uh_media_vc.dll",
            r"wx/wxmsw28uh_qa_vc.dll",
            r"wx/wxmsw28uh_richtext_vc.dll",
            r"wx/wxmsw28uh_stc_vc.dll",
            r"wx/wxmsw28uh_xrc_vc.dll",
        ],
    },
}

PY_DLLS = [
    "unicodedata.pyd",
    "sqlite3.dll",
    "_sqlite3.pyd",
    "_socket.pyd",
    "select.pyd",
    "_ctypes.pyd",
    "_ssl.pyd",
    "_multiprocessing.pyd",
    "pyexpat.pyd",
]

MSVCR_PUBLIC_KEY = "1fc8b3b9a1e18e3b"
MSVCR_VERSION = "9.0.21022.8"
MSVCR_NAME = "Microsoft.VC90.CRT"

OPENSLIDES_RC_TMPL = """
#include <winresrc.h>

#define ID_ICO_OPENSLIDES 1

ID_ICO_OPENSLIDES ICON "openslides.ico"

VS_VERSION_INFO VERSIONINFO
  FILEVERSION {version[0]},{version[1]},{version[2]},{version[4]}
  PRODUCTVERSION {version[0]},{version[1]},{version[2]},{version[4]}
  FILEFLAGSMASK VS_FFI_FILEFLAGSMASK
  FILEFLAGS {file_flags}
  FILEOS VOS__WINDOWS32
  FILETYPE VFT_APP
  FILESUBTYPE VFT2_UNKNOWN

  BEGIN
    BLOCK "StringFileInfo"
    BEGIN
      BLOCK "040904E4"
      BEGIN
        VALUE "CompanyName", "OpenSlides team\\0"
        VALUE "FileDescription", "OpenSlides\\0"
        VALUE "FileVersion", "{version_str}\\0"
        VALUE "InternalName", "OpenSlides\\0"
        VALUE "LegalCopyright", "Copyright \\251 2011-2013\\0"
        VALUE "OriginalFilename", "openslides.exe\\0"
        VALUE "ProductName", "OpenSlides\\0"
        VALUE "ProductVersion", "{version_str}\\0"
      END
    END

    BLOCK "VarFileInfo"
    BEGIN
      VALUE "Translation", 0x409, 0x4E4
    END
  END
"""


def compile_re_list(patterns):
    expr = "|".join("(?:{0})".format(x) for x in patterns)
    return re.compile(expr)


def relpath(base, path, addslash=False):
    b = os.path.normpath(os.path.abspath(base))
    p = os.path.normpath(os.path.abspath(path))
    if p == b:
        p = "."
        if addslash:
            p += "/"
        return p

    b += os.sep
    if not p.startswith(b):
        raise ValueError("{0!r} is not relative to {1!r}".format(path, base))
    p = p[len(b):].replace(os.sep, "/")
    if addslash:
        p += "/"

    return p


def filter_excluded_dirs(exclude_pattern, basedir, dirpath, dnames):
    i, l = 0, len(dnames)
    while i < l:
        rp = relpath(basedir, os.path.join(dirpath, dnames[i]), True)
        if exclude_pattern.search(rp):
            del dnames[i]
            l -= 1
        else:
            i += 1


def copy_dir_exclude(exclude, basedir, srcdir, destdir):
    for dp, dnames, fnames in os.walk(srcdir):
        filter_excluded_dirs(exclude, basedir, dp, dnames)

        rp = relpath(basedir, dp)
        target_dir = os.path.join(destdir, rp)
        if not os.path.exists(target_dir):
            os.makedirs(target_dir)

        for fn in fnames:
            fp = os.path.join(dp, fn)
            rp = relpath(basedir, fp)
            if exclude.search(rp):
                continue

            shutil.copyfile(fp, os.path.join(destdir, rp))


def collect_lib(libdir, odir):
    exclude = compile_re_list(COMMON_EXCLUDE + LIBEXCLUDE)
    copy_dir_exclude(exclude, libdir, libdir, os.path.join(odir, "Lib"))


def get_pkg_exclude(name, extra=()):
    exclude = COMMON_EXCLUDE[:]
    exclude.extend(SITE_PACKAGES.get(name, {}).get("exclude", []))
    exclude.extend(extra)
    return compile_re_list(exclude)


def copy_package(name, info, odir):
    copy_things = info.get("copy", [])
    if not copy_things:
        return

    dist = pkg_resources.get_distribution(name)
    exclude = get_pkg_exclude(name)

    site_dir = dist.location
    for thing in copy_things:
        fp = os.path.join(site_dir, thing)
        if not os.path.isdir(fp):
            rp = relpath(site_dir, fp)
            ofp = os.path.join(odir, rp)
            shutil.copyfile(fp, ofp)
        else:
            copy_dir_exclude(exclude, site_dir, fp, odir)


def copy_wx(odir):
    base_dir = os.path.dirname(os.path.dirname(wx.__file__))
    wx_dir = os.path.join(base_dir, "wx")
    exclude = get_pkg_exclude("wx")
    copy_dir_exclude(exclude, base_dir, wx_dir, odir)


def collect_site_packages(sitedir, odir):
    if not os.path.exists(odir):
        os.makedirs(odir)

    for name, info in SITE_PACKAGES.iteritems():
        copy_package(name, info, odir)

    assert "wx" in SITE_PACKAGES
    copy_wx(odir)


def compile_openslides_launcher():
    try:
        cc = distutils.ccompiler.new_compiler()
        if not cc.initialized:
            cc.initialize()
    except distutils.errors.DistutilsError:
        return False

    cc.add_include_dir(distutils.sysconfig.get_python_inc())
    cc.define_macro("_CRT_SECURE_NO_WARNINGS")

    gui_data_dir = os.path.dirname(openslides_gui.__file__)
    gui_data_dir = os.path.join(gui_data_dir, "data")
    shutil.copyfile(
        os.path.join(gui_data_dir, "openslides.ico"),
        "extras/win32-portable/openslides.ico")
    rcfile = "extras/win32-portable/openslides.rc"
    with open(rcfile, "w") as f:
        if openslides.VERSION[3] == "final":
            file_flags = "0"
        else:
            file_flags = "VS_FF_PRERELEASE"

        f.write(OPENSLIDES_RC_TMPL.format(
            version=openslides.VERSION,
            version_str=openslides.get_version(),
            file_flags=file_flags))

    objs = cc.compile([
        "extras/win32-portable/openslides.c",
        rcfile,
    ])
    cc.link_executable(
        objs, "extras/win32-portable/openslides",
        extra_preargs=["/subsystem:windows", "/nodefaultlib:python27.lib"],
        libraries=["user32"]
    )
    return True


def openslides_launcher_update_version_resource():
    try:
        import win32api
        import win32verstamp
    except ImportError:
        sys.stderr.write(
            "Using precompiled executable and pywin32 is not available - "
            "version resource may be out of date!\n")
        return False
    import struct

    sys.stdout.write("Updating version resource")
    # code based on win32verstamp.stamp() with some minor differences in
    # version handling
    major, minor, sub = openslides.VERSION[:3]
    build = openslides.VERSION[4]
    pre_release = openslides.VERSION[3] != "final"
    version_str = openslides.get_version()

    sdata = {
        "CompanyName": "OpenSlides team",
        "FileDescription": "OpenSlides",
        "FileVersion": version_str,
        "InternalName": "OpenSlides",
        "LegalCopyright": u"Copyright \xa9 2011-2013",
        "OriginalFilename": "openslides.exe",
        "ProductName": "OpenSlides",
        "ProductVersion": version_str,
    }
    vdata = {
        "Translation": struct.pack("hh", 0x409, 0x4e4),
    }

    vs = win32verstamp.VS_VERSION_INFO(
        major, minor, sub, build, sdata, vdata, pre_release, False)
    h = win32api.BeginUpdateResource("extras/win32-portable/openslides.exe", 0)
    win32api.UpdateResource(h, 16, 1, vs)
    win32api.EndUpdateResource(h, 0)


def copy_dlls(odir):
    dll_src = os.path.join(sys.exec_prefix, "DLLs")
    dll_dest = os.path.join(odir, "DLLs")
    if not os.path.exists(dll_dest):
        os.makedirs(dll_dest)

    for dll_name in PY_DLLS:
        src = os.path.join(dll_src, dll_name)
        dest = os.path.join(dll_dest, dll_name)
        shutil.copyfile(src, dest)

    pydllname = "python{0}{1}.dll".format(*sys.version_info[:2])
    src = os.path.join(os.environ["WINDIR"], "System32", pydllname)
    dest = os.path.join(dll_dest, pydllname)
    shutil.copyfile(src, dest)


def copy_msvcr(odir):
    candidates = glob.glob("{0}/x86_*{1}_{2}*".format(
        os.path.join(os.environ["WINDIR"], "winsxs"),
        MSVCR_NAME, MSVCR_PUBLIC_KEY))

    msvcr_local_name = None
    msvcr_dll_dir = None
    for dp in candidates:
        bn = os.path.basename(dp)
        if MSVCR_VERSION in bn:
            msvcr_local_name = bn
            msvcr_dll_dir = dp
            break
    else:
        sys.stderr.write(
            "Warning could not determine msvcr runtime location\n"
            "Private asssembly for VC runtime must be added manually\n")
        return

    msvcr_dest_dir = os.path.join(odir, MSVCR_NAME)
    if not os.path.exists(msvcr_dest_dir):
        os.makedirs(msvcr_dest_dir)

    for fn in os.listdir(msvcr_dll_dir):
        src = os.path.join(msvcr_dll_dir, fn)
        dest = os.path.join(msvcr_dest_dir, fn)
        shutil.copyfile(src, dest)

    src = os.path.join(
        os.environ["WINDIR"], "winsxs", "Manifests",
        "{0}.manifest".format(msvcr_local_name))
    dest = os.path.join(msvcr_dest_dir, "{0}.manifest".format(MSVCR_NAME))
    shutil.copyfile(src, dest)


def write_package_info_content(outfile):
    """
    Writes a list of all included packages into outfile.
    """
    text = ['Included Packages\n', 17 * '=' + '\n', '\n']
    for pkg in sorted(SITE_PACKAGES):
        if pkg == "wx":
            # wxpython comes from an installer and has no distribution
            # --> handle it separately
            text.append("wxpython-{0}\n".format(wx.__version__))
        else:
            dist = pkg_resources.get_distribution(pkg)
            text.append("{0}-{1}\n".format(dist.project_name, dist.version))
    with open(outfile, "w") as f:
        f.writelines(text)


def write_metadatafile(infile, outfile):
    """
    Writes content from metadata files like README, AUTHORS and LICENSE into
    outfile.
    """
    with open(infile, "rU") as f:
        text = [l for l in f]
    with open(outfile, "w") as f:
        f.writelines(text)


def main():
    prefix = os.path.dirname(sys.executable)
    libdir = os.path.join(prefix, "Lib")
    sitedir = os.path.join(libdir, "site-packages")
    odir = "dist/openslides-{0}-portable".format(openslides.get_version())

    try:
        shutil.rmtree(odir)
    except OSError as e:
        if e.errno != errno.ENOENT:
            raise

    os.makedirs(odir)
    out_site_packages = os.path.join(odir, "Lib", "site-packages")

    collect_lib(libdir, odir)
    collect_site_packages(sitedir, out_site_packages)

    exclude = get_pkg_exclude("openslides")
    copy_dir_exclude(exclude, ".", "openslides", out_site_packages)

    if not compile_openslides_launcher():
        sys.stdout.write("Using prebuild openslides.exe\n")
        openslides_launcher_update_version_resource()

    shutil.copyfile(
        "extras/win32-portable/openslides.exe",
        os.path.join(odir, "openslides.exe"))

    shutil.copytree(
        "extras/openslides_gui",
        os.path.join(out_site_packages, "openslides_gui"))

    copy_dlls(odir)
    copy_msvcr(odir)

    # Info on included packages
    shutil.copytree(
        "extras/win32-portable/licenses",
        os.path.join(odir, "packages-info"))
    write_package_info_content(os.path.join(odir, 'packages-info', 'PACKAGES.txt'))

    # AUTHORS, LICENSE, README
    write_metadatafile('AUTHORS', os.path.join(odir, 'AUTHORS.txt'))
    write_metadatafile('LICENSE', os.path.join(odir, 'LICENSE.txt'))
    write_metadatafile('README.rst', os.path.join(odir, 'README.txt'))

    zip_fp = os.path.join(
        "dist", "openslides-{0}-portable.zip".format(
        openslides.get_version()))


    with zipfile.ZipFile(zip_fp, "w", zipfile.ZIP_DEFLATED) as zf:
        for dp, dnames, fnames in os.walk(odir):
            for fn in fnames:
                fp = os.path.join(dp, fn)
                rp = relpath(odir, fp)
                zf.write(fp, rp)

    print("Successfully build {0}".format(zip_fp))


if __name__ == "__main__":
    main()
