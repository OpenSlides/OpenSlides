/**
 * OpenSlides utils functions
 *
 * :copyright: 2011, 2012 by OpenSlides team, see AUTHORS.
 * :license: GNU GPL, see LICENSE for more details.
 */

$(function () {
    $('.button').click(function (event) {
        button = $(this);
        if (button.hasClass('disabled')) {
            event.preventDefault();
        } else {
            button.addClass('disabled');
            setTimeout(function () {
                button.removeClass('disabled');
            }, 1000);
        }
    });
   // activate an element to show it on projector
    $('.activate_link').click(function(event) {
        event.preventDefault();
        var link = $(this);
        $.ajax({
            type: 'GET',
            url: link.attr('href'),
            dataType: 'json',
            data: '',
            success: function(data) {
                $('.activate_link').removeClass('btn-primary');
                $('.activate_link i').removeClass('icon-white');
                // is table line
                if ( link.parent().parent().parent().is("tr") ) {
                    $('tr').removeClass('activeline');
                    link.parent().parent().parent().addClass('activeline');
                }
                // is widget list item
                if ( link.parent().is("li") ) {
                    $('li').removeClass('activeline');
                    link.parent().addClass('activeline');
                }
                link.addClass('btn-primary');
                link.children('i').addClass('icon-white');
            }
        });
    });
});


function new_message(text, type) {
    var message = $('#dummy-notification').clone(true);
    $(message).removeAttr('id').addClass(type).children('em').html(text);
    $('#notifications').append(message);
    message.slideDown('fast');
}


// Functios for sidebar navigation
$(document).ready(function(){
    // Resize navigation
    $(window).resize(function(){
        if($(this).width() < 1124) {
            iconmenu();
            if($(window).width() < 570) {
                $('.table').each(function(){
                    if($(this).find('.table-wrapper').size() == 0) {
                        $(this).wrap('<div class="table-wrapper"></div>');
                    }
                });
            }
        } else {
            fullmenu();
        }
    });
    if($(window).width() < 1124) {
        iconmenu();
        if($(window).width() < 570) {
            $('.table').each(function(){
                if($(this).find('.table-wrapper').size() == 0) {
                    $(this).wrap('<div class="table-wrapper"></div>');
                }
            });
        }
    } else {
        fullmenu();
    }
    // Sticky navigation
    $(window).scroll(function(){
        var el = $('.leftmenu > ul'); 
        if($(window).width() > 479) {
            if ( ($(this).scrollTop() > 80) && ($(this).scrollLeft() < 10)) {
                el.css({'position':'fixed','top':'10px','width':'14.15%'});
            } else {
                el.css({'position': 'relative', 'top': '0','width':'auto'});
            }
        } else {
            if (($(this).scrollTop() > 130) && ($(this).scrollLeft() < 10)){
                el.css({'position':'fixed','top':'10px','width':'14.15%'});
            } else {
                el.css({'position': 'relative', 'top': '0','width':'auto'});
            }
        }
    });
    // Submenu with drop down
    $('.leftmenu a').click(function(e){
        if($(this).siblings('ul').size() == 1){
            e.preventDefault();
            var submenu = $(this).siblings('ul');
            if($(this).hasClass('open')) {
                if($(this).parents('.leftmenu').hasClass('lefticon')) {
                    submenu.fadeOut();
                } else {
                    submenu.slideUp('fast');
                }
                $(this).removeClass('open');
            } else {
                if($(this).parents('.leftmenu').hasClass('lefticon')) {
                    submenu.fadeIn();
                } else {
                    submenu.slideDown('fast');
                }
                $(this).addClass('open');
            }
        }
    });
    // Tooltips
    $('.leftmenu').tooltip({
      selector: "a[rel=tooltip]",
      placement: 'right'
    });
    $(this).tooltip({
      selector: "a[rel=tooltip]",
      placement: 'bottom'
    });

    $('h1').tooltip({
      selector: "a[rel=tooltip]",
      placement: 'bottom'
    });
    $('body').tooltip({
       selector: '.tooltip' 
    });
    $('.tooltip-left').tooltip({
       placement: 'left'
    });
    $('.tooltip-right').tooltip({
       placement: 'right'
    });
    $('.tooltip-top').tooltip({
       placement: 'top'
    });
    $('.tooltip-bottom').tooltip({
        placement: 'bottom'
    });
    // Resize menu and content container
    function iconmenu(){
        $('.leftmenu').removeClass('span2').addClass('lefticon').addClass('span1');
        $('.leftmenu > ul > li > a').each(function(){
            atitle = $(this).text();
            $(this).attr({'rel':'tooltip','title':atitle});
        });
        $('#content').removeClass('span10').addClass('span11');
    }
    
    function fullmenu(){
        $('.leftmenu').removeClass('span1').removeClass('lefticon').addClass('span2');
        $('.leftmenu > ul > li > a').each(function(){
            $(this).attr({'rel':'','title':''});
        });
        $('#content').removeClass('span11').addClass('span10'); 
    }
});