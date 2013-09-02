/**
 * OpenSlides agenda config functions for the datepicker
 *
 * :copyright: 2011–2013 by OpenSlides team, see AUTHORS.
 * :license: GNU GPL, see LICENSE for more details.
 */

$(function() {
    $.datepicker.regional[gettext('en')] = {
        prevText: gettext('previous month'),
        nextText: gettext('next month'),
        monthNames: [
            gettext('January'), gettext('February'), gettext('March'),
            gettext('April'), gettext('May'), gettext('June'),
            gettext('July'), gettext('August'), gettext('September'),
            gettext('October'), gettext('November'), gettext('December')
        ],
        monthNamesShort: [
            gettext('Jan'), gettext('Feb'), gettext('Mar'),
            gettext('Apr'), gettext('May'), gettext('Jun'),
            gettext('Jul'), gettext('Aug'), gettext('Sep'),
            gettext('Oct'), gettext('Nov'), gettext('Dec')
        ],
        dayNames: [
            gettext('Sunday'), gettext('Monday'), gettext('Tuesday'), gettext('Wednesday'),
            gettext('Thursday'), gettext('Friday'), gettext('Saturday')
        ],
        dayNamesMin: [
            gettext('Su'), gettext('Mo'), gettext('Tu'), gettext('We'),
            gettext('Th'), gettext('Fr'), gettext('Sa')
        ],
        dayNamesShort: [
            gettext('Su'), gettext('Mo'), gettext('Tu'), gettext('We'),
            gettext('Th'), gettext('Fr'), gettext('Sa')
        ],
        dateFormat: 'dd.mm.yy', firstDay: 1, isRTL: false
    };

    $.datepicker.setDefaults($.datepicker.regional[gettext('en')]);

    $("#id_agenda_start_event_date_time").datetimepicker (
            {
                hour: 12,
                timeFormat: 'HH:mm',
                timeText: gettext('Time'),
                hourText: gettext('Hour'),
                minuteText: gettext('Minute'),
                currentText: gettext('Current time'),
                closeText: gettext('Close')
            }
    );
});
