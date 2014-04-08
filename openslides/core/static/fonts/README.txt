This directory contains truetype fonts which are used for PDF generation in OpenSlides.
They are registered in the file 'openslides/utils/pdf.py'.

The Ubuntu font is available in three styles: Regular, Bold and Italic.

If you want to use your own font just replace the Ubuntu font with your truetype font files.
Or you have to change the filename in the registerFont function in pdf.py. Please note
that the font name 'Ubuntu' is already used in some stylesheets in the same file.

The font file circle.ttf contains only the unicode character 'HEAVY LARGE CIRCLE' (U+2B55)
which is extracted from the free unicode font "Quivira 4.0" [1] with the freeware
OpenType font editor "Type light" [2]. The circle glyph is mapped to the '*' character
for using in OpenSlides PDF ballot papers of motions and elections.

[1] http://www.quivira-font.com/
[2] http://www.cr8software.net/typelight.html
