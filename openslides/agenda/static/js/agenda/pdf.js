(function () {

'use strict';

angular.module('OpenSlidesApp.agenda.pdf', ['OpenSlidesApp.core.pdf'])

.factory('AgendaContentProvider', [
    'gettextCatalog',
    'PDFLayout',
    function(gettextCatalog, PDFLayout) {

    var createInstance = function(items) {

        // page title
        var title = PDFLayout.createTitle(gettextCatalog.getString("Agenda"));

        // generate the item list with all subitems
        var createItemList = function() {
            var agenda_items = [];
            angular.forEach(items, function (item) {
                if (item.is_hidden === false) {

                    var itemIndent = item.parentCount * 20;

                    var itemStyle;
                    if (item.parentCount === 0) {
                        itemStyle = 'listParent';
                    } else {
                        itemStyle = 'listChild';
                    }

                    var itemNumberWidth;
                    if (item.item_number === "") {
                        itemNumberWidth = 0;
                    } else {
                        itemNumberWidth = 60;
                    }

                    var agendaJsonString = {
                        style: itemStyle,
                        columns: [
                            {
                                width: itemIndent,
                                text: ''
                            },
                            {
                                width: itemNumberWidth,
                                text: item.item_number
                            },
                            {
                                text: item.title
                            }
                        ]
                    };

                    agenda_items.push(agendaJsonString);
                }
            });
            return agenda_items;
        };

        var getContent = function() {
            return [
                title,
                createItemList()
            ];
        };

        return {
            getContent: getContent
        };
    };

    return {
        createInstance: createInstance
    };

}]);

}());
