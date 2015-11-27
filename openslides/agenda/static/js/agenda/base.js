(function () {

'use strict';

angular.module('OpenSlidesApp.agenda', ['OpenSlidesApp.users'])

.factory('Speaker', [
    'DS',
    function(DS) {
        return DS.defineResource({
            name: 'agenda/speaker',
            relations: {
                belongsTo: {
                    'users/user': {
                        localField: 'user',
                        localKey: 'user_id',
                    }
                }
            }
        });
    }
])

.factory('Agenda', [
    'DS',
    'Speaker',
    'jsDataModel',
    function(DS, Speaker, jsDataModel) {
        var name = 'agenda/item';
        return DS.defineResource({
            name: name,
            useClass: jsDataModel,
            methods: {
                getResourceName: function () {
                    return name;
                },
                getContentObject: function () {
                    return DS.get(this.content_object.collection, this.content_object.id);
                },
                getContentResource: function () {
                    return DS.definitions[this.content_object.collection];
                },
                getTitle: function () {
                    var title;
                    try {
                        title =  this.getContentObject().getAgendaTitle();
                    } catch (e) {
                        // Only use this.title when the content object is not
                        // in the DS store.
                        title = this.title;
                    }
                    return _.trim(
                        title + ' ' + (
                            this.getContentResource().agendaSupplement || ''
                        )
                    );
                }
            },
            relations: {
                hasMany: {
                    'core/tag': {
                        localField: 'tags',
                        localKeys: 'tags_id',
                    },
                    'agenda/speaker': {
                        localField: 'speakers',
                        foreignKey: 'item_id',
                    }
                }
            },
            beforeInject: function (resource, instance) {
                Speaker.ejectAll({where: {item_id: {'==': instance.id}}});
            }
        });
    }
])

.factory('AgendaTree', [
    function () {
        return {
            getTree: function (items) {
                // Sort items after there weight
                items.sort(function(itemA, itemB) {
                    return itemA.weight - itemB.weight;
                });

                // Build a dict with all children (dict-value) to a specific
                // item id (dict-key).
                var itemChildren = {};

                _.each(items, function (item) {
                    if (item.parent_id) {
                        // Add item to his parent. If it is the first child, then
                        // create a new list.
                        try {
                            itemChildren[item.parent_id].push(item);
                        } catch (error) {
                            itemChildren[item.parent_id] = [item];
                        }
                    }

                });

                // Recursive function that generates a nested list with all
                // items with there children
                function getChildren(items) {
                    var returnItems = [];
                    _.each(items, function (item) {
                        returnItems.push({
                            item: item,
                            children: getChildren(itemChildren[item.id]),
                            id: item.id,
                        });
                    });
                    return returnItems;
                }

                // Generates the list of root items (with no parents)
                var parentItems = items.filter(function (item) {
                    return !item.parent_id;
                });
                return getChildren(parentItems);
            },

            // Returns a list of all items as a flat tree the attribute parentCount
            getFlatTree: function(items) {
                var tree = this.getTree(items);
                var flatItems = [];

                function generateFatTree(tree, parentCount) {
                    _.each(tree, function (item) {
                        item.item.parentCount = parentCount;
                        flatItems.push(item.item);
                        generateFatTree(item.children, parentCount + 1);
                    });
                }
                generateFatTree(tree, 0);
                return flatItems;
            },
        };
    }
])

// Make sure that the Agenda resource is loaded.
.run(['Agenda', function(Agenda) {}]);

}());
