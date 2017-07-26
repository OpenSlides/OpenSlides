(function () {

'use strict';

angular.module('OpenSlidesApp.core.docx', [])

.factory('Html2DocxConverter', [
    '$q',
    'ImageConverter',
    function ($q, ImageConverter) {
        var PAGEBREAK = '<w:p><w:r><w:br w:type="page" /></w:r></w:p>';

        var createInstance = function () {
            var converter = {
                imageMap: {},
                documentImages: [],
                relationships: [],
                contentTypes: [],
            };

            var html2docx = function (html) {
                var docx = '';
                var tagStack = [];

                // With this variable, we keep track, if we are currently inside or outside of a paragraph.
                var inParagraph = true;
                // the text may not begin with a paragraph. If so, append one because word needs it.
                var skipFirstParagraphClosing = true;

                var handleTag = function (tag) {
                    if (tag.charAt(0) == "/") {  // A closing tag
                        // remove from stack
                        tagStack.pop();

                        // Special: end paragraphs
                        if (tag.indexOf('/p') === 0) {
                            docx += '</w:p>';
                            inParagraph = false;
                        }
                    } else { // now all other tags
                        var tagname = tag.split(' ')[0];
                        handleNamedTag(tagname, tag);
                    }
                    return docx;
                };
                var handleNamedTag = function (tagname, fullTag) {
                    var tag = {
                        tag: tagname,
                        attrs: {},
                    };
                    switch (tagname) {
                        case 'p':
                            if (inParagraph && !skipFirstParagraphClosing) {
                                // End the paragrapth, if there is one
                                docx += '</w:p>';
                            }
                            skipFirstParagraphClosing = false;
                            docx += '<w:p>';
                            inParagraph = true;
                            break;
                        case 'span':
                            var styleRegex = /(?:\"|\;\s?)([a-zA-z\-]+)\:\s?([a-zA-Z0-9\-\#]+)/g, matchSpan;
                            while ((matchSpan = styleRegex.exec(fullTag)) !== null) {
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
                            break;
                        case 'a':
                            var hrefRegex = /href="([^"]+)"/g;
                            var href = hrefRegex.exec(fullTag)[1];
                            tag.href = href;
                            break;
                        case 'img':
                            imageTag(tag, fullTag);
                            break;
                    }
                    if (tagname !== 'img' && tagname !== 'p') {
                        tagStack.push(tag);
                    }
                };
                var imageTag = function (tag, fullTag) {
                    // images has to be placed instantly, so there is no use of 'tag'.
                    var image = {};
                    var attributeRegex = /(\w+)=\"([^\"]*)\"/g, attributeMatch;
                    while ((attributeMatch = attributeRegex.exec(fullTag)) !== null) {
                        image[attributeMatch[1]] = attributeMatch[2];
                    }
                    if (image.src && converter.imageMap[image.src]) {
                        image.width = converter.imageMap[image.src].width;
                        image.height = converter.imageMap[image.src].height;

                        var rrId = converter.relationships.length + 1;
                        var imageId = converter.documentImages.length + 1;

                        // set name ('pic.jpg'), title, ext ('jpg'), mime ('image/jpeg')
                        image.name = _.last(image.src.split('/'));

                        var tmp = image.name.split('.');
                        image.ext = tmp.splice(-1);

                        // set name without extension as title if there isn't a title
                        if (!image.title) {
                            image.title = tmp.join('.');
                        }

                        image.mime = 'image/' + image.ext;
                        if (image.ext == 'jpe' || image.ext == 'jpg') {
                            image.mime = 'image/jpeg';
                        }

                        // x and y for the container and picture size in EMU (assuming 96dpi)!
                        var x = image.width * 914400 / 96;
                        var y = image.height * 914400 / 96;

                        // the image does not belong into a paragraph in ooxml
                        if (inParagraph) {
                            docx += '</w:p>';
                        }
                        docx += '<w:p><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extend cx="' + x +'" cy="' + y + '"/><wp:effectExtent l="0" t="0" r="0" b="0"/>' +
                            '<wp:docPr id="' + imageId + '" name="' + image.name + '" title="' + image.title + '" descr="' + image.title + '"/><wp:cNvGraphicFramePr>' +
                            '<a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr>' +
                            '<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">' +
                            '<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="' + imageId + '" name="' +
                            image.name + '" title="' + image.title + '" descr="' + image.title + '"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="rrId' + rrId + '"/><a:stretch>' +
                            '<a:fillRect/></a:stretch></pic:blipFill><pic:spPr bwMode="auto"><a:xfrm><a:off x="0" y="0"/><a:ext cx="' + x + '" cy="' + y + '"/></a:xfrm>' +
                            '<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>';

                        // inParagraph stays untouched, the documents paragraph state is restored here
                        if (inParagraph) {
                            docx += '<w:p>';
                        }

                        // entries in documentImages, relationships and contentTypes
                        converter.documentImages.push({
                            src: image.src,
                            zipPath: 'word/media/' + image.name
                        });
                        converter.relationships.push({
                            Id: 'rrId' + rrId,
                            Type: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/image',
                            Target: 'media/' + image.name
                        });
                        converter.contentTypes.push({
                            PartName: '/word/media/' + image.name,
                            ContentType: image.mime
                        });
                    }
                };
                var handleText = function (text) {
                    // Start a new paragraph, if only loose text is there
                    if (!inParagraph) {
                        docx += '<w:p>';
                        inParagraph = true;
                    }
                    var docxPart = '<w:r><w:rPr>';
                    var hyperlink = false;
                    tagStack.forEach(function (tag) {
                        switch (tag.tag) {
                            case 'b':
                            case 'strong':
                                docxPart += '<w:b/><w:bCs/>';
                                break;
                            case 'em':
                            case 'i':
                                docxPart += '<w:i/><w:iCs/>';
                                break;
                            case 'span':
                                for (var key in tag.attrs) {
                                    switch (key) {
                                        case 'color':
                                            docxPart += '<w:color w:val="' + tag.attrs[key] + '"/>';
                                            break;
                                        case 'backgroundColor':
                                            docxPart += '<w:shd w:fill="' + tag.attrs[key] + '"/>';
                                            break;
                                        case 'underline':
                                            docxPart += '<w:u w:val="single"/>';
                                            break;
                                        case 'strike':
                                            docxPart += '<w:strike/>';
                                            break;
                                    }
                                }
                                break;
                            case 'u':
                                docxPart += '<w:u w:val="single"/>';
                                break;
                            case 'strike':
                                docxPart += '<w:strike/>';
                                break;
                            case 'a':
                                var id = converter.relationships.length + 1;
                                docxPart = '<w:hyperlink r:id="rrId' + id + '">' + docxPart;
                                docxPart += '<w:rStyle w:val="Internetlink"/>';
                                converter.relationships.push({
                                    Id: 'rrId' + id,
                                    Type: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink',
                                    Target: tag.href,
                                    TargetMode: 'External'
                                });
                                hyperlink = true;
                                break;
                        }
                    });
                    docxPart += '</w:rPr><w:t>' + text + '</w:t></w:r>';
                    if (hyperlink) {
                        docxPart += '</w:hyperlink>';
                    }

                    // append to docx
                    docx += docxPart;
                    return docx;
                };

                var replaceEntities = function () {
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
                    var entityRegex = /\&(?!gt|lt|amp)\w+\;/g, matchEntry, indexes = [];
                    while ((matchEntry = entityRegex.exec(docx)) !== null) {
                        indexes.push({
                            startId: matchEntry.index,
                            stopId: matchEntry.index + matchEntry[0].length
                        });
                    }
                    for (var i = indexes.length - 1; i>=0; i--) {
                        docx = docx.substring(0, indexes[i].startId) + docx.substring(indexes[i].stopId, docx.length);
                    }
                };

                var parse = function () {
                    if (html.substring(0,3) != '<p>') {
                        docx += '<w:p>';
                        skipFirstParagraphClosing = false;
                    }
                    html = html.split(/(<|>)/g);
                    // remove whitespaces and > brackets. Leave < brackets in there to check, whether
                    // the following string is a tag or text.
                    html = _.filter(html, function (part) {
                        var skippedCharsRegex = new RegExp('^([\s\n\r]|>)*$', 'g');
                        return !skippedCharsRegex.test(part);
                    });

                    for (var i = 0; i < html.length; i++) {
                        if (html[i] === '<') {
                            i++;
                            handleTag(html[i]);
                        } else {
                            handleText(html[i]);
                        }
                    }
                    // for finishing close the last paragraph (if open)
                    if (inParagraph) {
                        docx += '</w:p>';
                    }

                    replaceEntities();

                    return docx;
                };

                return parse();
            };

            // return a wrapper function for html2docx, that fetches all the images.
            converter.html2docx = function (html) {
                var imageSources = _.map($(html).find('img'), function (element) {
                    return element.getAttribute('src');
                });
                // Don't get images multiple times; just if the converter has not seen them befor.
                imageSources = _.filter(imageSources, function (src) {
                    return !converter.imageMap[src];
                });
                return $q(function (resolve) {
                    ImageConverter.toBase64(imageSources).then(function (_imageMap) {
                        _.forEach(_imageMap, function (value, key) {
                            converter.imageMap[key] = value;
                        });
                        var docx = html2docx(html);
                        resolve(docx);
                    });
                });
            };

            converter.updateZipFile = function (zip) {
                var updateRelationships = function (oldContent) {
                    var content = oldContent.split('\n');
                    _.forEach(converter.relationships, function (relationship) {
                        content[1] += '<Relationship';
                        _.forEach(relationship, function (value, key) {
                            content[1] += ' ' + key + '="' + value + '"';
                        });
                        content[1] += '/>';
                    });
                    return content.join('\n');
                };
                var updateContentTypes = function (oldContent) {
                    var content = oldContent.split('\n');
                    _.forEach(converter.contentTypes, function (type) {
                        content[1] += '<Override';
                        _.forEach(type, function (value, key) {
                            content[1] += ' ' + key + '="' + value + '"';
                        });
                        content[1] += '/>';
                    });
                    return content.join('\n');
                };
                // update relationships from 'relationships'
                var relationships = updateRelationships(zip.file('word/_rels/document.xml.rels').asText());
                zip.file('word/_rels/document.xml.rels', relationships);

                // update content type from 'contentTypes'
                var contentTypes = updateContentTypes(zip.file('[Content_Types].xml').asText());
                zip.file('[Content_Types].xml', contentTypes);

                converter.documentImages = _.uniqBy(converter.documentImages, 'src');
                _.forEach(converter.documentImages, function (image) {
                    var dataUrl = converter.imageMap[image.src].data;
                    var base64 = dataUrl.split(',')[1];
                    zip.file(image.zipPath, base64, {base64: true});
                });
                return zip;
            };

            return converter;
        };

        return {
            createInstance: createInstance,
        };
    }
]);

})();
