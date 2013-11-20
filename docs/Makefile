# Makefile for Sphinx documentation
#

# You can set these variables from the command line.
SPHINXOPTS    =
SPHINXBUILD   = sphinx-build
PAPER         =
BUILDDIR      = _build
LANGUAGES     = de

# Internal variables.
PAPEROPT_a4     = -D latex_paper_size=a4
PAPEROPT_letter = -D latex_paper_size=letter
ALLSPHINXOPTS   = -d $(BUILDDIR)/doctrees/$$lang $(PAPEROPT_$(PAPER)) $(SPHINXOPTS) -c . -A language=$$lang -A languages='$(LANGUAGES)' -E

.PHONY: help clean html dirhtml singlehtml pickle json htmlhelp qthelp devhelp epub latex latexpdf text man changes linkcheck doctest

help:
	@echo "Please use \`make <target>' where <target> is one of"
	@echo "  html       to make standalone HTML files"
	@echo "  latex      to make LaTeX files, you can set PAPER=a4 or PAPER=letter"
	@echo "  latexpdf   to make LaTeX files and run them through pdflatex"
	@echo "  text       to make text files"
	@echo "  changes    to make an overview of all changed/added/deprecated items"
	@echo "  linkcheck  to check all external links for integrity"

clean:
	-rm -rf $(BUILDDIR)/*

html:
	@for lang in $(LANGUAGES);\
	do \
	    mkdir -p $(BUILDDIR)/html/$$lang $(BUILDDIR)/doctrees/$$lang; \
	    $(SPHINXBUILD) -b html $(ALLSPHINXOPTS) $$lang $(BUILDDIR)/html/$$lang;\
	done
	@echo
	@echo "Build finished. The HTML pages are in $(BUILDDIR)/html."

latex:
	@for lang in $(LANGUAGES);\
	do \
	    mkdir -p $(BUILDDIR)/latex/$$lang $(BUILDDIR)/doctrees/$$lang; \
	    $(SPHINXBUILD) -b latex $(ALLSPHINXOPTS) $$lang $(BUILDDIR)/latex/$$lang;\
	done
	@echo
	@echo "Build finished; the LaTeX files are in $(BUILDDIR)/latex."
	@echo "Run \`make' in that directory to run these through (pdf)latex" \
	      "(use \`make latexpdf' here to do that automatically)."

latexpdf:
	@for lang in $(LANGUAGES);\
	do \
	    mkdir -p $(BUILDDIR)/latex/$$lang $(BUILDDIR)/doctrees/$$lang; \
	    $(MAKE) -C $(BUILDDIR)/latex/$$lang all-pdf; \
	done
	@echo
	@echo "Running LaTeX files through pdflatex..."
	@echo "pdflatex finished; the PDF files are in $(BUILDDIR)/latex."

text:
	@for lang in $(LANGUAGES);\
	do \
	    mkdir -p $(BUILDDIR)/text/$$lang $(BUILDDIR)/doctrees/$$lang; \
	    $(SPHINXBUILD) -b text $(ALLSPHINXOPTS) $$lang $(BUILDDIR)/text/$$lang;\
	done
	@echo
	@echo "Build finished. The text files are in $(BUILDDIR)/text."

changes:
	@for lang in $(LANGUAGES);\
	do \
	    mkdir -p $(BUILDDIR)/changes/$$lang $(BUILDDIR)/doctrees/$$lang; \
	    $(SPHINXBUILD) -b changes $(ALLSPHINXOPTS) $(BUILDDIR)/changes/$$lang; \
	done
	@echo
	@echo "The overview file is in $(BUILDDIR)/changes."

linkcheck:
	@for lang in $(LANGUAGES);\
	do \
	    mkdir -p $(BUILDDIR)/linkcheck/$$lang $(BUILDDIR)/doctrees/$$lang; \
	    $(SPHINXBUILD) -b linkcheck $(ALLSPHINXOPTS) $(BUILDDIR)/linkcheck/$$lang; \
	done
	@echo
	@echo "Link check complete; look for any errors in the above output " \
	      "or in $(BUILDDIR)/linkcheck/output.txt."
