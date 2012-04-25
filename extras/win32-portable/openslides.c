/*
    :copyright: 2012 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
*/

#include <stdlib.h>
#include <string.h>
#include <stdio.h>

#define _WIN32_LEAN_AND_MEAN
#include <windows.h>

#include <Python.h>

static const char *site_code =
    "import sys;"
    "import os;"
    "import site;"
    "path = os.path.dirname(sys.executable);"
    "site_dir = os.path.join(path, \"site-packages\");"
    "site.addsitedir(site_dir);"
    "sys.path.append(path)";

static const char *run_openslides_code =
    "import openslides.main;"
    "openslides.main.main()";

/* determine the path to the executable
 * NOTE: Py_GetFullProgramPath() can't be used because
 *       this would trigger pythons search-path initialization
 *       But we need this to initialize PYTHONHOME before this happens
 */
static char *
_get_module_name()
{
    size_t size = 1;
    char *name = NULL;
    int i;

    /* a path > 40k would be insane, it is more likely something
     * else has gone very wrong on the system
     */
    for (i = 0;i < 10; i++)
    {
	DWORD res;
	char *n;

	n = realloc(name, size);
	if (!n)
	{
	    free(name);
	    return NULL;
	}
	name = n;

	res = GetModuleFileNameA(NULL, name, size);
	if (res != 0 && res < size)
	{
	    return name;
	}
	else if (res == size)
	{
	    /* NOTE: Don't check GetLastError() == ERROR_INSUFFICIENT_BUFFER
	     *       here, it isn't set consisntently across all platforms
	     */

	    size += 4096;
	}
	else
	{
	    DWORD err = GetLastError();
	    fprintf(stderr, "WARNING: GetModuleFileName() failed "
		"(res = %d, err = %d)", res, err);
	    free(name);
	    return NULL;

	}
    }

    return NULL;
}

static int
_run()
{
    if (PyRun_SimpleString(site_code) != 0)
    {
	fprintf(stderr, "ERROR: failed to initialize site path\n");
	return 1;
    }

    if (PyRun_SimpleString(run_openslides_code) != 0)
    {
	fprintf(stderr, "ERROR: failed to execute openslides\n");
	return 1;
    }

    return 0;
}


int
main(int argc, char *argv[])
{
    int returncode;
    char *py_home, *sep = NULL;

    Py_SetProgramName(argv[0]);

    py_home = _get_module_name();

    if (py_home)
	sep = strrchr(py_home, '\\');
    /* should always be the true */
    if (sep)
    {
	*sep = '\0';
	Py_SetPythonHome(py_home);
    }

    Py_Initialize();
    PySys_SetArgvEx(argc, argv, 0);

    returncode = _run();

    Py_Finalize();
    free(py_home);

    return returncode;
}
