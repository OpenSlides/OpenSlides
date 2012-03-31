@ECHO OFF

REM Command file for Sphinx documentation

SET TRANSLATIONS=en
SET LANGUAGES=de %TRANSLATIONS%

if "%SPHINXBUILD%" == "" (
	set SPHINXBUILD=sphinx-build
)
set BUILDDIR=_build
set ALLSPHINXOPTS= -d %BUILDDIR%/doctrees/%%L -c . -A language=%%L -D language=%%L -A languages="%LANGUAGES%"
set I18NSPHINXOPTS=%SPHINXOPTS% .
if NOT "%PAPER%" == "" (
	set ALLSPHINXOPTS=-D latex_paper_size=%PAPER% %ALLSPHINXOPTS%
	set I18NSPHINXOPTS=-D latex_paper_size=%PAPER% %I18NSPHINXOPTS%
)

if "%1" == "" goto help

if "%1" == "help" (
	:help
	echo.Please use `make ^<target^>` where ^<target^> is one of
	echo.  html       to make standalone HTML files
	echo.  latex      to make LaTeX files, you can set PAPER=a4 or PAPER=letter
	echo.  text       to make text files
	echo.  changes    to make an overview over all changed/added/deprecated items
	echo.  linkcheck  to check all external links for integrity
	goto end
)

if "%1" == "clean" (
	for /d %%i in (%BUILDDIR%\*) do rmdir /q /s %%i
	del /q /s %BUILDDIR%\*
	goto end
)

if "%1" == "html" (
  FOR  %%L in (%LANGUAGES%) DO (
	%SPHINXBUILD% -b html  %ALLSPHINXOPTS% %%L %BUILDDIR%/html/%%L
	)
	if errorlevel 1 exit /b 1
	echo.
	echo.Build finished. The HTML pages are in %BUILDDIR%/html.
	goto end
)

if "%1" == "latex" (
  FOR  %%L in (%LANGUAGES%) DO (
	%SPHINXBUILD% -b latex %ALLSPHINXOPTS% %%L %BUILDDIR%/latex/%%L
	)
	if errorlevel 1 exit /b 1
	echo.
	echo.Build finished; the LaTeX files are in %BUILDDIR%/latex.
	goto end
)

if "%1" == "text" (
  FOR  %%L in (%LANGUAGES%) DO (
	%SPHINXBUILD% -b text %ALLSPHINXOPTS% %%L %BUILDDIR%/text/%%L
	)
	if errorlevel 1 exit /b 1
	echo.
	echo.Build finished. The text files are in %BUILDDIR%/text.
	goto end
)

if "%1" == "changes" (
  FOR  %%L in (%LANGUAGES%) DO (
	%SPHINXBUILD% -b changes %ALLSPHINXOPTS% %%L %BUILDDIR%/changes/%%L
	)
	if errorlevel 1 exit /b 1
	echo.
	echo.The overview file is in %BUILDDIR%/changes.
	goto end
)

if "%1" == "linkcheck" (
  FOR  %%L in (%LANGUAGES%) DO (
	%SPHINXBUILD% -b linkcheck %ALLSPHINXOPTS% %%L %BUILDDIR%/linkcheck/%%L
	)
	if errorlevel 1 exit /b 1
	echo.
	echo.Link check complete; look for any errors in the above output ^
or in %BUILDDIR%/linkcheck/output.txt.
	goto end
)


:end
