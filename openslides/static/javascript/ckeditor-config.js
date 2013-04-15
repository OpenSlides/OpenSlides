/*
 * Configuration file for the CKeditor
 */
$(function() {
        var ck_options = {
                
                // Using a custom CSS file allows us to specifically style elements entered
                // using the editor. Using the CSS prefix class .ckeditor_html prevents these
                // styles from meddling with the main layout
                
                contentsCss: "/static/styles/ckeditor.css",
                bodyClass: "ckeditor_html",
                
                allowedContent:
                        'h1 h2 h3 pre blockquote b i u strike;' +
                        
                        // A workaround for the problem described in http://dev.ckeditor.com/ticket/10192
                        // Hopefully, the problem will be solved in the final version of CKEditor 4.1
                        // If so, then {margin-left} can be removed
                        'p{margin-left};' +
                        
                        'a[!href];' +
                        'table tr th td caption;' +
                        'ol ul li;' +
                        'span{!font-family};' +
                        'span{!color};',
                removePlugins: "save, print, preview, pagebreak, templates, showblocks, magicline",
                
                // Not part of the standard package of CKEditor
                // http://ckeditor.com/addon/insertpre
                extraPlugins: "insertpre",
                
                toolbar_Full: [
                        { name: 'document',    items : [ 'Source','-','Save','DocProps','Preview','Print','-','Templates' ] },
                        { name: 'clipboard',   items : [ 'Cut','Copy','Paste','PasteText','PasteFromWord','-','Undo','Redo' ] },
                        { name: 'editing',     items : [ 'Find','Replace','-','SpellChecker', 'Scayt' ] },
                        { name: 'forms',       items : [ 'Form', 'Checkbox', 'Radio', 'TextField', 'Textarea', 'Select', 'Button', 'ImageButton', 'HiddenField' ] },
                        { name: 'basicstyles', items : [ 'Bold','Italic','Underline','Strike','Subscript','Superscript','-','RemoveFormat' ] },
                        { name: 'paragraph',   items : [ 'NumberedList','BulletedList','-','Pre','InsertPre','CreateDiv','-','JustifyLeft','JustifyCenter','JustifyRight','JustifyBlock','-','BidiLtr','BidiRtl' ] },
                        { name: 'links',       items : [ 'Link','Unlink','Anchor' ] },
                        { name: 'styles',      items : [ 'Format','FontSize' ] },
                        { name: 'tools',       items : [ 'Maximize', 'ShowBlocks','-','About' ] }
                ],
                toolbar: 'Full'
        };

        // Override the tags 'strong' and 'em' so that reportlab can read it
        CKEDITOR.config.coreStyles_bold = { element : 'b', overrides : 'strong' };
        CKEDITOR.config.coreStyles_italic = { element : 'i', overrides : 'em' };

        CKEDITOR.replace('id_text', ck_options);
        CKEDITOR.replace('id_reason', ck_options);
});