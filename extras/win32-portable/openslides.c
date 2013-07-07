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

#define PYTHON_DLL_PATH "\\Dlls\\python27.dll"

static void (*py_initialize)(void) = 0;
static void (*py_finalize)(void) = 0;
static void (*py_set_program_name)(char *) = 0;
static void (*py_set_python_home)(char *) = 0;
static int (*py_run_simple_string_flags)(const char *, PyCompilerFlags *) = 0;
static void (*py_sys_set_argv_ex)(int, char **, int) = 0;
static int (*py_main)(int, char **) = 0;
static int *py_ignore_environment_flag = 0;

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

static void
_fatal_error(const char *text)
{
    MessageBoxA(NULL, text, "Fatal error", MB_OK | MB_ICONERROR);
    exit(1);
}

static void
_fatal_error_fmt(const char *fmt, ...)
{
    int size = 512;
    char *buf  = malloc(size);
    va_list args;
    int bytes_written;

    if (!buf)
	abort();

    va_start(args, fmt);
    for (;;)
    {
	bytes_written = vsnprintf(buf, size, fmt, args);
	if (bytes_written > -1 && bytes_written < size)
	    break;
	else if (bytes_written > size)
	    size = bytes_written + 1;
	else
	    size *= 2;

	buf = realloc(buf, size);
	if (!buf)
	    abort();
    }
    va_end(args);

    _fatal_error(buf);
}

static void *
_load_func(HMODULE module, const char *name)
{
    void *address = GetProcAddress(module, name);
    if (!address)
	_fatal_error_fmt("Failed to look up symbol %s", name);
    return address;
}

static void
_load_python(const char *pyhome)
{
    size_t pyhome_len = strlen(pyhome);
    size_t size = pyhome_len + strlen(PYTHON_DLL_PATH) + 1;
    char *buf = malloc(size);
    HMODULE py_dll;

    if (!buf)
	abort();
    memcpy(buf, pyhome, pyhome_len);
    memcpy(buf + pyhome_len, PYTHON_DLL_PATH, sizeof(PYTHON_DLL_PATH));
    buf[size - 1] = '\0';

    py_dll = LoadLibrary(buf);
    if (!py_dll)
    {
	DWORD error = GetLastError();
	_fatal_error_fmt("Failed to load %s (error %d)", buf, error);
    }

    py_initialize = (void (*)(void))_load_func(py_dll, "Py_Initialize");
    py_finalize = (void (*)(void))_load_func(py_dll, "Py_Finalize");
    py_set_program_name = (void (*)(char *))
	_load_func(py_dll, "Py_SetProgramName");
    py_set_python_home = (void (*)(char *))
	_load_func(py_dll, "Py_SetPythonHome");
    py_run_simple_string_flags = (int (*)(const char *, PyCompilerFlags *))
	_load_func(py_dll, "PyRun_SimpleStringFlags");
    py_sys_set_argv_ex = (void (*)(int, char **, int))
	_load_func(py_dll, "PySys_SetArgvEx");
    py_main = (int (*)(int, char **))_load_func(py_dll, "Py_Main");
    py_ignore_environment_flag = (int *)
	_load_func(py_dll, "Py_IgnoreEnvironmentFlag");
}

static int
_run()
{
    if (py_run_simple_string_flags(run_openslides_code, NULL) != 0)
	_fatal_error("Failed to execute openslides");

    return 0;
}


int WINAPI
WinMain(HINSTANCE inst, HINSTANCE prev_inst, LPSTR cmdline, int show)
{
    int returncode;
    int run_py_main = __argc > 1;
    char *py_home, *sep = NULL;

    py_home = _get_module_name();
    if (!py_home)
	_fatal_error("Could not determine portable root directory");

    sep = strrchr(py_home, '\\');
    /* should always be the true */
    if (sep)
	*sep = '\0';

    _load_python(py_home);
    py_set_program_name(__argv[0]);
    py_set_python_home(py_home);
    *py_ignore_environment_flag = 1;

    if (run_py_main)
    {
	/* we where given extra arguments, behave like python.exe */
	returncode =  py_main(__argc, __argv);
    }
    else
    {
	/* no arguments given => start openslides gui */
	py_initialize();
	py_sys_set_argv_ex(__argc, __argv, 0);

	returncode = _run();
	py_finalize();
    }

    free(py_home);

    return returncode;
}
