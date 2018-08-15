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
            _.forEach(items, function (item) {
                if (item.is_public) {
                    var itemIndent = item.parentCount * 15;

                    var itemStyle;
                    if (item.parentCount === 0) {
                        itemStyle = 'listParent';
                    } else {
                        itemStyle = 'listChild';
                    }

                    var agendaJsonString = {
                        style: itemStyle,
                        columns: [
                            {
                                width: itemIndent,
                                text: ''
                            },
                            {
                                width: 60,
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

}])

.factory('AgendaPdfExport', [
    'gettextCatalog',
    'AgendaContentProvider',
    'PdfMakeDocumentProvider',
    'PdfCreate',
    'Messaging',
    function (gettextCatalog, AgendaContentProvider, PdfMakeDocumentProvider, PdfCreate, Messaging) {
        return {
            export: function (items) {
                var filename = gettextCatalog.getString('Agenda') + '.pdf';
                var agendaContentProvider = AgendaContentProvider.createInstance(items);
                PdfMakeDocumentProvider.createInstance(agendaContentProvider).then(function (documentProvider) {
                    PdfCreate.download(documentProvider, filename);
                }, function (error) {
                    Messaging.addMessage(error.msg, 'error');
                });
            },
        };
    }
]);

}());
