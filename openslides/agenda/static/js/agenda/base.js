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

.factory('AgendaUpdate',[
    'Agenda',
    'operator',
    function(Agenda, operator) {
        return {
            saveChanges: function (item_id, changes) {
                // change agenda item only if user has the permission to do that
                if (operator.hasPerms('agenda.can_manage agenda.can_see_hidden_items')) {
                    Agenda.find(item_id).then(function (item) {
                        console.log(item);
                        var something = false;
                        _.each(changes, function(change) {
                            if (change.value !== item[change.key]) {
                                item[change.key] = change.value;
                                something = true;
                            }
                        });
                        if (something === true) {
                            Agenda.save(item);
                        }
                    });
                }
            }
        };
    }
])

.factory('Agenda', [
    '$http',
    'DS',
    'Speaker',
    'jsDataModel',
    'Projector',
    'gettextCatalog',
    'gettext',
    function($http, DS, Speaker, jsDataModel, Projector, gettextCatalog, gettext) {
        var name = 'agenda/item';
        return DS.defineResource({
            name: name,
            useClass: jsDataModel,
            verboseName: gettext('Agenda'),
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
                        // when the content object is not in the DS store.
                        title = this.title;
                    }
                    if (this.item_number) {
                        title = this.item_number + ' · ' + title;
                    }
                    return title;
                },
                getAgendaTitle: function () {
                    return this.title;
                },
                getListViewTitle: function () {
                    var title;
                    try {
                        title =  this.getContentObject().getAgendaListViewTitle();
                    } catch (e) {
                        // when the content object is not in the DS store
                        title = this.list_view_title;
                    }
                    if (this.item_number) {
                        title = this.item_number + ' · ' + title;
                    }
                    return title;
                },
                getItemNumberWithAncestors: function (agendaId) {
                    if (!agendaId) {
                        agendaId = this.id;
                    }
                    var agendaItem = DS.get(name, agendaId);
                    if (!agendaItem) {
                        return '';
                    } else if (agendaItem.item_number) {
                        return agendaItem.item_number;
                    } else if (agendaItem.parent_id) {
                        return this.getItemNumberWithAncestors(agendaItem.parent_id);
                    } else {
                        return '';
                    }
                },
                // override project function of jsDataModel factory
                project: function (projectorId, tree) {
                    var isProjectedIds = this.isProjected(tree);
                    _.forEach(isProjectedIds, function (id) {
                        $http.post('/rest/core/projector/' + id + '/clear_elements/');
                    });
                    // Activate, if the projector_id is a new projector.
                    if (_.indexOf(isProjectedIds, projectorId) == -1) {
                        var name = tree ? 'agenda/item-list' : this.content_object.collection;
                        var id = tree ? this.id : this.content_object.id;
                        return $http.post(
                            '/rest/core/projector/' + projectorId + '/prune_elements/',
                            [{name: name, tree: tree, id: id}]
                        );
                    }
                },
                // override isProjected function of jsDataModel factory
                isProjected: function (tree) {
                    // Returns all ids of all projectors with an agenda-item element. Otherwise an empty list.
                    if (typeof tree === 'undefined') {
                        tree = false;
                    }
                    var self = this;
                    var predicate = function (element) {
                        var value;
                        if (tree) {
                            // Item tree slide for sub tree
                            value = element.name == 'agenda/item-list' &&
                                typeof element.id !== 'undefined' &&
                                element.id == self.id;
                        } else {
                            // Releated item detail slide
                            value = element.name == self.content_object.collection &&
                                typeof element.id !== 'undefined' &&
                                element.id == self.content_object.id;
                        }
                        return value;
                    };
                    var isProjectedIds = [];
                    Projector.getAll().forEach(function (projector) {
                        if (typeof _.findKey(projector.elements, predicate) === 'string') {
                            isProjectedIds.push(projector.id);
                        }
                    });
                    return isProjectedIds;
                },
                // project list of speakers
                projectListOfSpeakers: function(projectorId) {
                    var isProjectedIds = this.isListOfSpeakersProjected();
                    _.forEach(isProjectedIds, function (id) {
                        $http.post('/rest/core/projector/' + id + '/clear_elements/');
                    });
                    if (_.indexOf(isProjectedIds, projectorId) == -1) {
                        return $http.post(
                            '/rest/core/projector/' + projectorId + '/prune_elements/',
                            [{name: 'agenda/list-of-speakers', id: this.id}]
                        );
                    }
                },
                // check if list of speakers is projected
                isListOfSpeakersProjected: function () {
                    // Returns all ids of all projectors with an element with the
                    // name 'agenda/list-of-speakers' and the same id. Else returns an empty list.
                    var self = this;
                    var predicate = function (element) {
                        return element.name == 'agenda/list-of-speakers' &&
                               typeof element.id !== 'undefined' &&
                               element.id == self.id;
                    };
                    var isProjecteds = [];
                    Projector.getAll().forEach(function (projector) {
                        if (typeof _.findKey(projector.elements, predicate) === 'string') {
                            isProjecteds.push(projector.id);
                        }
                    });
                    return isProjecteds;
                },
                hasSubitems: function(items) {
                    var self = this;
                    var hasChild = false;
                    // Returns true if the item has at least one child item.
                    _.each(items, function (item) {
                        if (item.parent_id == self.id) {
                            hasChild = true;
                        }
                    });
                    return hasChild;
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

            // Returns a list of all items as a flat tree
            getFlatTree: function(items) {
                var tree = this.getTree(items);
                var flatItems = [];

                function generateFlatTree(tree, parentCount) {
                    _.each(tree, function (item) {
                        item.item.parentCount = parentCount;
                        flatItems.push(item.item);
                        generateFlatTree(item.children, parentCount + 1);
                    });
                }
                generateFlatTree(tree, 0);
                return flatItems;
            }
        };
    }
])

// TODO: Remove all find() calls from the projector logic. It is also used on the site so this has to be
// changed with the refactoring of the site autoupdate.
.factory('CurrentListOfSpeakersItem', [
    'Projector',
    'Assignment', // TODO: Remove this after refactoring of data loading on start.
    'Topic', // TODO: Remove this after refactoring of data loading on start.
    'Motion', // TODO: Remove this after refactoring of data loading on start.
    'MotionBlock', // TODO: Remove this after refactoring of data loading on start.
    'Agenda',
    function (Projector, Assignment, Topic, Motion, MotionBlock, Agenda) {
        return {
            getItem: function (projectorId) {
                var elementPromise;
                return Projector.find(projectorId).then(function (projector) {
                    // scan all elements
                    _.forEach(projector.elements, function(element) {
                        switch(element.name) {
                            case 'motions/motion':
                                elementPromise = Motion.find(element.id).then(function(motion) {
                                    return Motion.loadRelations(motion, 'agenda_item').then(function() {
                                        return motion.agenda_item;
                                    });
                                });
                                break;
                            case 'motions/motion-block':
                                elementPromise = MotionBlock.find(element.id).then(function(motionBlock) {
                                    return MotionBlock.loadRelations(motionBlock, 'agenda_item').then(function() {
                                        return motionBlock.agenda_item;
                                    });
                                });
                                break;
                            case 'topics/topic':
                                elementPromise = Topic.find(element.id).then(function(topic) {
                                    return Topic.loadRelations(topic, 'agenda_item').then(function() {
                                        return topic.agenda_item;
                                    });
                                });
                                break;
                            case 'assignments/assignment':
                                elementPromise = Assignment.find(element.id).then(function(assignment) {
                                    return Assignment.loadRelations(assignment, 'agenda_item').then(function() {
                                        return assignment.agenda_item;
                                    });
                                });
                                break;
                            case 'agenda/list-of-speakers':
                                elementPromise = Agenda.find(element.id).then(function(item) {
                                    return item;
                                });
                        }
                    });
                    return elementPromise;
                });
            }
        };
    }
])

.factory('ListOfSpeakersOverlay', [
    '$http',
    'Projector',
    'gettextCatalog',
    'gettext',
    function($http, Projector, gettextCatalog, gettext) {
        var name = 'agenda/current-list-of-speakers-overlay';
        return {
            name: name,
            verboseName: gettext('List of speakers overlay'),
            project: function (projectorId, overlay) {
                var isProjectedId = this.isProjected(overlay);
                if (isProjectedId.length > 0) {
                    // Deactivate
                    var projector = Projector.get(isProjectedId[0]);
                    var uuid;
                    _.forEach(projector.elements, function (element) {
                        if (element.name == 'agenda/current-list-of-speakers-overlay') {
                            uuid = element.uuid;
                        }
                    });
                    $http.post('/rest/core/projector/' + isProjectedId + '/deactivate_elements/',
                               [uuid]);
                }
                // Activate, if the projector_id is a new projector.
                if (isProjectedId != projectorId) {
                    return $http.post(
                        '/rest/core/projector/' + projectorId + '/activate_elements/',
                         [{name: 'agenda/current-list-of-speakers-overlay',stable: true}]);
                }
            },
            isProjected: function () {
                // Returns the ids of all projectors with an agenda-item element. Else return an empty list.
                var predicate = function (element) {
                    var value;
                    value = element.name == 'agenda/current-list-of-speakers-overlay';
                    return value;
                };
                var isProjectedIds = [];
                Projector.getAll().forEach(function (projector) {
                    if (typeof _.findKey(projector.elements, predicate) === 'string') {
                        isProjectedIds.push(projector.id);
                    }
                });
                return isProjectedIds;
            }
        };
    }
])



// Make sure that the Agenda resource is loaded.
.run(['Agenda', function(Agenda) {}]);

}());
