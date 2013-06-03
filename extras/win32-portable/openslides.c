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

static const char *run_openslides_code =
    "import openslides_gui.gui;"
    "openslides_gui.gui.main()";

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
	     *       here, it isn't set consistently across all platforms
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
    if (PyRun_SimpleString(run_openslides_code) != 0)
    {
	fprintf(stderr, "ERROR: failed to execute openslides\n");
	return 1;
    }

    return 0;
}


int WINAPI
WinMain(HINSTANCE inst, HINSTANCE prev_inst, LPSTR cmdline, int show)
{
    int returncode;
    int run_py_main = __argc > 1;
    char *py_home, *sep = NULL;

    Py_SetProgramName(__argv[0]);

    py_home = _get_module_name();

    if (py_home)
	sep = strrchr(py_home, '\\');
    /* should always be the true */
    if (sep)
    {
	*sep = '\0';
	Py_SetPythonHome(py_home);
	Py_IgnoreEnvironmentFlag = 1;
    }

    if (run_py_main)
    {
	/* we where given extra arguments, behave like python.exe */
	returncode =  Py_Main(__argc, __argv);
    }
    else
    {
	/* no arguments given => start openslides gui */
	Py_Initialize();
	PySys_SetArgvEx(__argc, __argv, 0);

	returncode = _run();
	Py_Finalize();
    }

    free(py_home);

    return returncode;
}
