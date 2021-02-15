from PyPDF2 import PdfFileReader
from PyPDF2.utils import PdfReadError


def bytes_to_human(size):
    # TODO: Read http://stackoverflow.com/a/1094933 and think about it.
    if size < 1024:
        size_string = "< 1 kB"
    elif size >= 1024 * 1024:
        mB = size / 1024 / 1024
        size_string = "%d MB" % mB
    else:
        kB = size / 1024
        size_string = "%d kB" % kB
    return size_string


def get_pdf_information(mediafile):
    result = {}
    try:
        pdf = PdfFileReader(mediafile)
        result["pages"] = pdf.getNumPages()
    except (PdfReadError, KeyError):
        # File could be encrypted but not be detected by PyPDF.
        # KeyError: https://github.com/mstamy2/PyPDF2/issues/353 Very rare to occur, but do not raise a 500
        result["pages"] = 0
        result["encrypted"] = True
    return result
