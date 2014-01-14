/*
 * JavaScript functions for pdf presenter of OpenSlides.
 *
 */

var pdf = PDFJS.getDocument(projector['pdf_url']);

projector['load_pdf_page'] = function(page) {
    projector['pdf_page_num'] = page;
    pdf.then(function(pdf) {
        pdf.getPage(page).then(set_convas_size);
    });
};

projector['load_pdf'] = function(data) {
    projector['pdf_url'] = data['url'];
    projector['pdf_page_num'] = data['page_num'];
    pdf = PDFJS.getDocument(projector['pdf_url']);
    projector['load_pdf_page'](projector['pdf_page_num']);
};

projector['toggle_fullscreen'] = function(fullscreen) {
    projector['pdf_fullscreen'] = fullscreen;
    content = $('#content');
    presentation = $('#presentation');
    footer = $('#footer');
    body = $('body');
    if (fullscreen) {
        content.addClass('fullscreen');
        presentation.addClass('fullscreen');
        footer.addClass('black');
        body.addClass('black');
    } else {
        content.removeClass('fullscreen');
        presentation.removeClass('fullscreen');
        footer.removeClass('black');
        body.removeClass('black');
    }
    $(window).resize();
};

function scale_to_height(page) {
    return page.getViewport(window.innerHeight / page.getViewport(1.0).height);
}

function scale_to_width(page) {
    return page.getViewport(window.innerWidth / page.getViewport(1.0).width);
}

function get_correct_viewport(page, canvas) {
    if(window.innerWidth > window.innerHeight) {
        viewport = scale_to_height(page);
        if (viewport.width > window.innerWidth) {
            viewport = scale_to_width(page);
            canvas.height = viewport.height;
            canvas.width = window.innerWidth;
        } else {
            canvas.height = window.innerHeight;
            canvas.width = viewport.width;
        }
    } else {
        viewport = scale_to_width(page);
        if (viewport.height > window.innerHeight) {
            viewport = scale_to_height(page);
            canvas.height = window.innerHeight;
            canvas.width = viewport.width;
        } else {
            canvas.height = viewport.height;
            canvas.width = window.innerWidth;
        }
    }
    return viewport;
}

function set_convas_size(page) {
    var canvas = document.getElementById('presentation');
    var context = canvas.getContext('2d');
    if (projector['pdf_fullscreen']) {
        viewport = get_correct_viewport(page, canvas);
    } else {
        viewport = page.getViewport(window.innerWidth / page.getViewport(1.0).width);
        canvas.height = viewport.height;
        canvas.width = window.innerWidth;
    }
    page.render({canvasContext: context, viewport: viewport});
}

$(document).ready(function () {
    $(window).resize(function() {
        projector['load_pdf_page'](projector['pdf_page_num']);
    });
    if (projector['pdf_fullscreen']) {
        if (!$('#content').hasClass('fullscreen')) {
            $('#content').addClass('fullscreen');
            $('#footer').addClass('black');
            $('body').addClass('black');
        }
    }
    $(window).resize();
});
