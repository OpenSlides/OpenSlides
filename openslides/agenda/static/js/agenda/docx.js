(function () {

'use strict';

angular.module('OpenSlidesApp.agenda.docx', ['OpenSlidesApp.core.docx'])

.factory('AgendaDocxExport', [
    '$http',
    'gettextCatalog',
    'FileSaver',
    'Agenda',
    'AgendaTree',
    'Config',
    function ($http, gettextCatalog, FileSaver, Agenda, AgendaTree, Config) {

        var getData = function (items) {
            // Item structure: The top layer has subitems, that are flat.
            // The first layer is bold and all sublayers not. The docx
            // templater cannot render items recursively, so the second
            // layer are all subitems flated out. Spacing is done with tabs.
            var tree = AgendaTree.getTree(items);
            var subitems = []; // This will be used as a temporary variable.
            var flatSubitems = function (children, parentCount) {
                _.forEach(children, function (child) {
                    var taps = _.repeat('\t', parentCount - 1);
                    subitems.push({
                        item_number: taps + child.item.item_number,
                        item_title: child.item.list_view_title,
                    });
                    flatSubitems(child.children, parentCount + 1);
                });
            };
            var twoLayerTree = _.map(tree, function (mainItem) {
                subitems = [];
                flatSubitems(mainItem.children, 1);
                return {
                    item_number: mainItem.item.item_number,
                    item_title: mainItem.item.list_view_title,
                    subitems: subitems,
                };
            });

            // header
            var headerline1 = [
                Config.translate(Config.get('general_event_name').value),
                Config.translate(Config.get('general_event_description').value)
            ].filter(Boolean).join(' – ');
            var headerline2 = [
                Config.get('general_event_location').value,
                Config.get('general_event_date').value
            ].filter(Boolean).join(', ');

            // Data structure for the docx templater.
            return {
                header: [headerline1, headerline2].join('\n'),
                agenda_translation: gettextCatalog.getString('Agenda'),
                top_list: twoLayerTree,
            };
        };

        return {
            export: function (items) {
                // TODO: use filtered items.
                var filename = gettextCatalog.getString('Agenda') + '.docx';
                $http.get('/agenda/docxtemplate/').then(function (success) {
                    var content = window.atob(success.data);
                    var doc = new Docxgen(content);

                    var data = getData(items);
                    doc.setData(data);
                    doc.render();

                    var zip = doc.getZip();
                    //zip = converter.updateZipFile(zip);

                    var out = zip.generate({type: 'blob'});
                    FileSaver.saveAs(out, filename);
                });
            },
        };
    }
]);

})();
