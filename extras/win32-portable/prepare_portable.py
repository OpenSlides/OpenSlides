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

from contextlib import nested
from string import Template

import pkg_resources

sys.path.insert(0, os.getcwd())
import openslides

COMMON_EXCLUDE = [
    r".pyc$",
    r".pyo$",
    r".po$",
    r".egg-info",
    r"\blocale/(?!de/|en/)[^/]+/"
]

LIBEXCLUDE = [
    r"^site-packages/",
    r"^test/",
    r"^curses/",
    r"^idlelib/",
    r"^lib2to3/",
    r"^lib-tk/",
    r"^msilib/",
    r"^multiprocessing/",
    r"^unittest/",
]

OPENSLIDES_EXCLUDE = [
    r"^openslides/settings.py"
]


SITE_PACKAGES = {
    "django": {
        "copy": ["django"],
        "exclude": [
            r"^contrib/admindocs/",
            r"^contrib/comments/",
            r"^contrib/databrowse/",
            r"^contrib/flatpages/",
            r"^contrib/formtools/",
            r"^contrib/gis/",
            r"^contrib/humanize/",
            r"^contrib/localflavor/",
            r"^contrib/markup/",
            r"^contrib/redirects/",
            r"^contrib/sitemaps/",
            r"^contrib/syndication/",
            r"^contrib/webdesign/",
        ]
    },
    "django-mptt": {
        "copy": ["mptt"],
    },
    "reportlab": {
        "copy": [
            "reportlab",
            "_renderPM.pyd",
            "_rl_accel.pyd",
            "sgmlop.pyd",
            "pyHnj.pyd",
        ],
    },
    "pil": {
        # NOTE: PIL is a special case, see copy_pil
        "copy": [],
    }
}

PY_DLLS = [
    "unicodedata.pyd",
    "sqlite3.dll",
    "_sqlite3.pyd",
    "_socket.pyd",
    "select.pyd",
]

MSVCR_PUBLIC_KEY = "1fc8b3b9a1e18e3b"
MSVCR_VERSION = "9.0.21022.8"
MSVCR_NAME = "Microsoft.VC90.CRT"

def compile_re_list(patterns):
    expr = "|".join("(?:{0})".format(x) for x in patterns)
    return re.compile(expr)

def relpath(base, path, addslash = False):
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

def get_pkg_exclude(name, extra = ()):
    exclude = COMMON_EXCLUDE[:]
    exclude.extend(SITE_PACKAGES.get(name, {}).get("exclude", []))
    exclude.extend(extra)
    return compile_re_list(exclude)

def copy_package(name, info, odir):
    dist = pkg_resources.get_distribution(name)
    exclude = get_pkg_exclude(name)

    site_dir = dist.location
    for thing in info.get("copy", []):
        fp = os.path.join(site_dir, thing)
        if not os.path.isdir(fp):
            rp = relpath(site_dir, fp)
            ofp = os.path.join(odir, rp)
            shutil.copyfile(fp, ofp)
        else:
            copy_dir_exclude(exclude, site_dir, fp, odir)

def copy_pil(odir):
    dist = pkg_resources.get_distribution("pil")
    exclude = get_pkg_exclude("pil")

    dest_dir = os.path.join(odir, "PIL")
    copy_dir_exclude(exclude, dist.location, dist.location, dest_dir)
    fp = os.path.join(dest_dir, "PIL.pth")
    if os.path.isfile(fp):
        os.rename(fp, os.path.join(odir, "PIL.pth"))
    else:
        fp = os.path.join(os.path.dirname(dist.location), "PIL.pth")
        shutil.copyfile(fp, os.path.join(odir, "PIL.pth"))

def collect_site_packages(sitedir, odir):
    if not os.path.exists(odir):
        os.makedirs(odir)

    for name, info in SITE_PACKAGES.iteritems():
        copy_package(name, info, odir)

    assert "pil" in SITE_PACKAGES
    copy_pil(odir)

def compile_openslides_launcher():
    try:
        cc = distutils.ccompiler.new_compiler()
        if not cc.initialized:
            cc.initialize()
    except distutils.errors.DistutilsError:
        return False

    cc.add_include_dir(distutils.sysconfig.get_python_inc())
    cc.add_library_dir(os.path.join(sys.exec_prefix, "Libs"))

    objs = cc.compile(["extras/win32-portable/openslides.c"])
    cc.link_executable(objs, "extras/win32-portable/openslides")
    return True

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
    dest = os.path.join(odir, pydllname)
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
        sys.stderr.write("Warning could not determine msvcr runtime location\n")
        sys.stderr.write("Private asssembly for VC runtime must be added manually\n")
        return


    msvcr_dest_dir = os.path.join(odir, MSVCR_NAME)
    if not os.path.exists(msvcr_dest_dir):
        os.makedirs(msvcr_dest_dir)

    for fn in os.listdir(msvcr_dll_dir):
        src = os.path.join(msvcr_dll_dir, fn)
        dest = os.path.join(msvcr_dest_dir, fn)
        shutil.copyfile(src, dest)

    src = os.path.join(os.environ["WINDIR"], "winsxs", "Manifests",
        "{0}.manifest".format(msvcr_local_name))
    dest = os.path.join(msvcr_dest_dir, "{0}.manifest".format(MSVCR_NAME))
    shutil.copyfile(src, dest)


def write_readme(template_file, outfile):
    with open(template_file, "rU") as f:
        tmpl = Template(f.read())

    packages = ["openslides-{0}".format(openslides.get_version())]
    for pkg in SITE_PACKAGES:
        dist = pkg_resources.get_distribution(pkg)
        packages.append("{0}-{1}".format(dist.project_name, dist.version))

    tmpl_vars = {"PACKAGE_LIST": "\n".join(packages)}

    with open(outfile, "w") as f:
        f.write(tmpl.substitute(tmpl_vars))


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

    collect_lib(libdir, odir)
    collect_site_packages(sitedir, os.path.join(odir, "site-packages"))

    exclude = get_pkg_exclude("openslides", OPENSLIDES_EXCLUDE)
    copy_dir_exclude(exclude, ".", "openslides", odir)

    if not compile_openslides_launcher():
        sys.stdout.write("Using prebuild openslides.exe\n")

    shutil.copyfile("extras/win32-portable/openslides.exe",
        os.path.join(odir, "openslides.exe"))

    copy_dlls(odir)
    copy_msvcr(odir)

    shutil.copytree("extras/win32-portable/licenses",
        os.path.join(odir, "licenses"))

    zip_fp = os.path.join("dist", "openslides-{0}-portable.zip".format(
        openslides.get_version()))

    write_readme("extras/win32-portable/README.txt.in",
        os.path.join(odir, "README.txt"))

    with zipfile.ZipFile(zip_fp, "w", zipfile.ZIP_DEFLATED) as zf:
        for dp, dnames, fnames in os.walk(odir):
            for fn in fnames:
                fp = os.path.join(dp, fn)
                rp = relpath(odir, fp)
                zf.write(fp, rp)

    print("Successfully build {0}".format(zip_fp))


if __name__ == "__main__":
    main()
