(function () {

'use strict';

angular.module('OpenSlidesApp.motions.docx', [])

.factory('MotionDocxExport', [
    '$http',
    '$q',
    'Config',
    'gettextCatalog',
    'FileSaver',
    function ($http, $q, Config, gettextCatalog, FileSaver) {

        var PAGEBREAK = '<w:p><w:r><w:br w:type="page" /></w:r></w:p>';
        var TAGS_NO_PARAM = ['b', 'strong', 'em', 'i'];

        var images;
        var relationships;
        var contentTypes;

        // $scope.motionsFiltered, $scope.categories

        var getData = function (motions, categories) {
            var data = {};
            // header
            var headerline1 = [
                Config.translate(Config.get('general_event_name').value),
                Config.translate(Config.get('general_event_description').value)
            ].filter(Boolean).join(' – ');
            var headerline2 = [
                Config.get('general_event_location').value,
                Config.get('general_event_date').value
            ].filter(Boolean).join(', ');
            data.header = [headerline1, headerline2].join('\n');

            // motion catalog title/preamble
            data.title = Config.translate(Config.get('motions_export_title').value);
            data.preamble = Config.get('motions_export_preamble').value;

            // categories
            data.has_categories = categories.length === 0 ? false : true;
            data.categories_translation = gettextCatalog.getString('Categories');
            data.categories = getCategoriesData(categories);
            data.no_categories = gettextCatalog.getString('No categories available.');
            data.pagebreak_main = categories.length === 0 ? '' : PAGEBREAK;

            // motions
            data.tableofcontents_translation = gettextCatalog.getString('Table of contents');
            data.motions = getMotionFullData(motions);
            data.motions_list = getMotionShortData(motions);
            data.no_motions = gettextCatalog.getString('No motions available.');

            return data;
        };

        var getCategoriesData = function (categories) {
            return _.map(categories, function (category) {
                return {
                    prefix: category.prefix,
                    name: category.name,
                };
            });
        };

        var getMotionShortData = function (motions) {
            return _.map(motions, function (motion) {
                return {
                    identifier: motion.identifier,
                    title: motion.getTitle(),
                };
            });
        };

        var getMotionFullData = function (motions) {
            var translation = gettextCatalog.getString('Motion'),
                sequential_translation = gettextCatalog.getString('Sequential number'),
                submitters_translation = gettextCatalog.getString('Submitters'),
                status_translation = gettextCatalog.getString('Status'),
                reason_translation = gettextCatalog.getString('Reason'),
                data = _.map(motions, function (motion) {
                    return {
                        motion_translation: translation,
                        sequential_translation: sequential_translation,
                        id: motion.id,
                        identifier: motion.identifier,
                        title: motion.getTitle(),
                        submitters_translation: submitters_translation,
                        submitters: _.map(motion.submitters, function (submitter) {
                                        return submitter.get_full_name();
                                    }).join(', '),
                        status_translation: status_translation,
                        status: motion.getStateName(),
                        preamble: gettextCatalog.getString(Config.get('motions_preamble').value),
                        text: html2docx(motion.getText()),
                        reason_translation: motion.getReason().length === 0 ? '' : reason_translation,
                        reason: html2docx(motion.getReason()),
                        pagebreak: PAGEBREAK,
                    };
                });
            if (data.length) {
                // clear pagebreak on last element
                data[data.length - 1].pagebreak = '';
            }
            return data;
        };

        var html2docx = function (html) {
            var docx = '';
            var stack = [];

            var isTag = false; // Even if html starts with '<p....' it is split to '', '<', ..., so always no tag at the beginning
            var hasParagraph = true;
            var skipFirstParagraphClosing = true;
            if (html.substring(0,3) != '<p>') {
                docx += '<w:p>';
                skipFirstParagraphClosing = false;
            }
            html = html.split(/(<|>)/g);

            html.forEach(function (part) {
                if (part !== '' && part != '\n' && part != '<' && part != '>') {
                    if (isTag) {
                        if (part.startsWith('p')) { /** p **/
                            // Special: begin new paragraph (only if its the first):
                            if (hasParagraph && !skipFirstParagraphClosing) {
                                // End, if there is one
                                docx += '</w:p>';
                            }
                            skipFirstParagraphClosing = false;
                            docx += '<w:p>';
                            hasParagraph = true;
                        } else if (part.startsWith('/p')) {
                            // Special: end paragraph:
                            docx += '</w:p>';
                            hasParagraph = false;

                        } else if (part.charAt(0) == "/") {
                            // remove from stack
                            stack.pop();
                        } else { // now all other tags
                            var tag = {};
                            if (_.indexOf(TAGS_NO_PARAM, part) > -1) { /** b, strong, em, i **/
                                stack.push({tag: part});
                            } else if (part.startsWith('span')) { /** span **/
                                tag = {tag: 'span', attrs: {}};
                                var rStyle = /(?:\"|\;\s?)([a-zA-z\-]+)\:\s?([a-zA-Z0-9\-\#]+)/g, matchSpan;
                                while ((matchSpan = rStyle.exec(part)) !== null) {
                                    switch (matchSpan[1]) {
                                        case 'color':
                                                tag.attrs.color = matchSpan[2].slice(1); // cut off the #
                                            break;
                                        case 'background-color':
                                                tag.attrs.backgroundColor = matchSpan[2].slice(1); // cut off the #
                                            break;
                                        case 'text-decoration':
                                            if (matchSpan[2] === 'underline') {
                                                tag.attrs.underline = true;
                                            } else if (matchSpan[2] === 'line-through') {
                                                tag.attrs.strike = true;
                                            }
                                            break;
                                    }
                                }
                                stack.push(tag);
                            } else if (part.startsWith('a')) { /** a **/
                                var rHref = /href="([^"]+)"/g;
                                var href = rHref.exec(part)[1];
                                tag = {tag: 'a', href: href};
                                stack.push(tag);
                            } else if (part.startsWith('img')) {
                                // images has to be placed instantly, so there is no use of 'tag'.
                                var img = {}, rImg = /(\w+)=\"([^\"]*)\"/g, matchImg;
                                while ((matchImg = rImg.exec(part)) !== null) {
                                    img[matchImg[1]] = matchImg[2];
                                }

                                // With and height and source have to be given!
                                if (img.width && img.height && img.src) {
                                    var rrId = relationships.length + 1;
                                    var imgId = images.length + 1;

                                    // set name ('pic.jpg'), title, ext ('jpg'), mime ('image/jpeg')
                                    img.name = img.src.split('/');
                                    img.name = _.last(img.name);

                                    var tmp = img.name.split('.');
                                    // set name without extension as title if there isn't a title
                                    if (!img.title) {
                                        img.title = tmp[0];
                                    }
                                    img.ext = tmp[1];

                                    img.mime = 'image/' + img.ext;
                                    if (img.ext == 'jpe' || img.ext == 'jpg') {
                                        img.mime = 'image/jpeg';
                                    }

                                    // x and y for the container and picture size in EMU (assuming 96dpi)!
                                    var x = img.width * 914400 / 96;
                                    var y = img.height * 914400 / 96;

                                    // Own paragraph for the image
                                    if (hasParagraph) {
                                        docx += '</w:p>';
                                    }
                                    docx += '<w:p><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extend cx="' + x +'" cy="' + y + '"/><wp:effectExtent l="0" t="0" r="0" b="0"/>' +
                                        '<wp:docPr id="' + imgId + '" name="' + img.name + '" title="' + img.title + '" descr="' + img.title + '"/><wp:cNvGraphicFramePr>' +
                                        '<a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr>' +
                                        '<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">' +
                                        '<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="' + imgId + '" name="' +
                                        img.name + '" title="' + img.title + '" descr="' + img.title + '"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="rrId' + rrId + '"/><a:stretch>' +
                                        '<a:fillRect/></a:stretch></pic:blipFill><pic:spPr bwMode="auto"><a:xfrm><a:off x="0" y="0"/><a:ext cx="' + x + '" cy="' + y + '"/></a:xfrm>' +
                                        '<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>';

                                    // hasParagraph stays untouched, the documents paragraph state is restored here
                                    if (hasParagraph) {
                                        docx += '<w:p>';
                                    }

                                    // entries in images, relationships and contentTypes
                                    images.push({
                                        url: img.src,
                                        zipPath: 'word/media/' + img.name
                                    });
                                    relationships.push({
                                        Id: 'rrId' + rrId,
                                        Type: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/image',
                                        Target: 'media/' + img.name
                                    });
                                    contentTypes.push({
                                        PartName: '/word/media/' + img.name,
                                        ContentType: img.mime
                                    });
                                }
                            }
                        }
                    } else { /** No tag **/
                        if (!hasParagraph) {
                            docx += '<w:p>';
                            hasParagraph = true;
                        }
                        var docx_part = '<w:r><w:rPr>';
                        var hyperlink = false;
                        stack.forEach(function (tag) {
                            switch (tag.tag) {
                                case 'b': case 'strong':
                                    docx_part += '<w:b/><w:bCs/>';
                                    break;
                                case 'em': case 'i':
                                        docx_part += '<w:i/><w:iCs/>';
                                    break;
                                case 'span':
                                    for (var key in tag.attrs) {
                                        switch (key) {
                                            case 'color':
                                                docx_part += '<w:color w:val="' + tag.attrs[key] + '"/>';
                                                break;
                                            case 'backgroundColor':
                                                docx_part += '<w:shd w:fill="' + tag.attrs[key] + '"/>';
                                                break;
                                            case 'underline':
                                                docx_part += '<w:u w:val="single"/>';
                                                break;
                                            case 'strike':
                                                docx_part += '<w:strike/>';
                                                break;
                                        }
                                    }
                                    break;
                                case 'a':
                                    var id = relationships.length + 1;
                                    docx_part = '<w:hyperlink r:id="rrId' + id + '">' + docx_part;
                                    docx_part += '<w:rStyle w:val="Internetlink"/>'; // necessary?
                                    relationships.push({
                                        Id: 'rrId' + id,
                                        Type: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink',
                                        Target: tag.href,
                                        TargetMode: 'External'
                                    });
                                    hyperlink = true;
                                    break;
                            }
                        });
                        docx_part += '</w:rPr><w:t>' + part + '</w:t></w:r>';
                        if (hyperlink) {
                            docx_part += '</w:hyperlink>';
                        }

                        // append to docx
                        docx += docx_part;
                    }
                    isTag = !isTag;
                }
                if (part === '' || part == '\n') {
                    // just if two tags following eachother: <b><span> --> ...,'>', '', '<',...
                    // or there is a line break between: <b>\n<span> --> ...,'>', '\n', '<',...
                    isTag = !isTag;
                }
            });

            // for finishing close the last paragraph (if open)
            if (hasParagraph) {
                docx += '</w:p>';
            }

            // replacing of special symbols:
            docx = docx.replace(new RegExp('\&auml\;', 'g'), 'ä');
            docx = docx.replace(new RegExp('\&uuml\;', 'g'), 'ü');
            docx = docx.replace(new RegExp('\&ouml\;', 'g'), 'ö');
            docx = docx.replace(new RegExp('\&Auml\;', 'g'), 'Ä');
            docx = docx.replace(new RegExp('\&Uuml\;', 'g'), 'Ü');
            docx = docx.replace(new RegExp('\&Ouml\;', 'g'), 'Ö');
            docx = docx.replace(new RegExp('\&szlig\;', 'g'), 'ß');
            docx = docx.replace(new RegExp('\&nbsp\;', 'g'), ' ');
            docx = docx.replace(new RegExp('\&sect\;', 'g'), '§');

            // remove all entities except gt, lt and amp
            var rEntity = /\&(?!gt|lt|amp)\w+\;/g, matchEntry, indexes = [];
            while ((matchEntry = rEntity.exec(docx)) !== null) {
                indexes.push({
                    startId: matchEntry.index,
                    stopId: matchEntry.index + matchEntry[0].length
                });
            }
            for (var i = indexes.length - 1; i>=0; i--) {
                docx = docx.substring(0, indexes[i].startId) + docx.substring(indexes[i].stopId, docx.length);
            }

            return docx;
        };
        var updateRelationships = function (oldContent) {
            var content = oldContent.split('\n');
            relationships.forEach(function (rel) {
                content[1] += '<Relationship';
                for (var key in rel) {
                    content[1] += ' ' + key + '="' + rel[key] + '"';
                }
                content[1] += '/>';
            });
            return content.join('\n');
        };
        var updateContentTypes = function (oldContent) {
            var content = oldContent.split('\n');
            contentTypes.forEach(function (type) {
                content[1] += '<Override';
                for (var key in type) {
                    content[1] += ' ' + key + '="' + type[key] + '"';
                }
                content[1] += '/>';
            });
            return content.join('\n');
        };

        return {
            export: function (motions, categories) {
                images = [];
                relationships = [];
                contentTypes = [];
                $http.get('/motions/docxtemplate/').then(function (success) {
                    var content = window.atob(success.data);
                    var doc = new Docxgen(content);

                    doc.setData(getData(motions, categories));
                    doc.render();
                    var zip = doc.getZip();

                    // update relationships from 'relationships'
                    var rels = updateRelationships(zip.file('word/_rels/document.xml.rels').asText());
                    zip.file('word/_rels/document.xml.rels', rels);

                    // update content type from 'contentTypes'
                    var contentTypes = updateContentTypes(zip.file('[Content_Types].xml').asText());
                    zip.file('[Content_Types].xml', contentTypes);

                    var imgPromises = [];
                    images.forEach(function (img) {
                        imgPromises.push(
                            $http.get(img.url, {responseType: 'arraybuffer'}).then(function (resolvedImage) {
                                zip.file(img.zipPath, resolvedImage.data);
                            })
                        );
                    });
                    // wait for all images to be resolved
                    $q.all(imgPromises).then(function () {
                        var out = zip.generate({type: 'blob'});
                        FileSaver.saveAs(out, 'motions-export.docx');
                    });
                });
            },
        };
    }
]);

}());
