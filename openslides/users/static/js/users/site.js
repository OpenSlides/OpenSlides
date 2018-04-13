(function () {

'use strict';

angular.module('OpenSlidesApp.users.site', [
    'OpenSlidesApp.users',
    'OpenSlidesApp.core.pdf',
    'OpenSlidesApp.users.pdf',
    'OpenSlidesApp.users.csv',
])

.config([
    'mainMenuProvider',
    'gettext',
    function (mainMenuProvider, gettext) {
        mainMenuProvider.register({
            'ui_sref': 'users.user.list',
            'img_class': 'user',
            'title': gettext('Participants'),
            'weight': 500,
            'perm': 'users.can_see_name',
        });
    }
])
.config([
    'SearchProvider',
    'gettext',
    function (SearchProvider, gettext) {
        SearchProvider.register({
            'verboseName': gettext('Participants'),
            'collectionName': 'users/user',
            'urlDetailState': 'users.user.detail',
            'weight': 500,
        });
    }
])

.config([
    '$stateProvider',
    'gettext',
    function($stateProvider, gettext) {
        $stateProvider
        .state('users', {
            url: '/users',
            abstract: true,
            template: "<ui-view/>",
            data: {
                title: gettext('Participants'),
                basePerm: 'users.can_see_name',
            },
        })
        .state('users.user', {
            abstract: true,
            template: "<ui-view/>",
        })
        .state('users.user.list', {})
        .state('users.user.create', {})
        .state('users.user.detail', {
            resolve: {
                userId: ['$stateParams', function($stateParams) {
                    return $stateParams.id;
                }]
            }
        })
        .state('users.user.change-password', {
            url: '/change-password/{id}',
            controller: 'UserChangePasswordCtrl',
            templateUrl: 'static/templates/users/user-change-password.html',
            resolve: {
                userId: ['$stateParams', function($stateParams) {
                    return $stateParams.id;
                }]
            }
        })
        .state('users.user.import', {
            url: '/import',
            controller: 'UserImportCtrl',
        })
        .state('users.user.presence', {
            url: '/presence',
            controller: 'UserPresenceCtrl',
        })
        // groups
        .state('users.group', {
            url: '/groups',
            abstract: true,
            template: "<ui-view/>",
            data: {
                title: gettext('Groups'),
            },
        })
        .state('users.group.list', {})
        .state('login', {
            template: null,
            url: '/login',
            params: {
                guest_enabled: false,
                msg: null,
            },
            onEnter: ['$state', '$stateParams', 'ngDialog', 'LoginDialog', function($state, $stateParams, ngDialog, LoginDialog) {
                LoginDialog.id = ngDialog.open({
                    template: 'static/templates/core/login-form.html',
                    controller: 'LoginFormCtrl',
                    showClose: $stateParams.guest_enabled,
                    closeByEscape: $stateParams.guest_enabled,
                    closeByDocument: $stateParams.guest_enabled,
                }).id;
            }],
            data: {
                title: 'Login',
            },
        });
    }
])

.value('LoginDialog', {})

/*
 * Directive to check for permissions
 *
 * This is the Code from angular.js ngIf.
 *
 * TODO: find a way not to copy the code.
*/
.directive('osPerms', [
    '$animate',
    function($animate) {
        return {
            multiElement: true,
            transclude: 'element',
            priority: 600,
            terminal: true,
            restrict: 'A',
            $$tlb: true,
            link: function($scope, $element, $attr, ctrl, $transclude) {
                var block, childScope, previousElements, perms;
                if ($attr.osPerms[0] === '!') {
                    perms = _.trimStart($attr.osPerms, '!');
                } else {
                    perms = $attr.osPerms;
                }
                $scope.$watch(
                    function (scope) {
                        return scope.operator && scope.operator.hasPerms(perms);
                    },
                    function (value) {
                        if ($attr.osPerms[0] === '!') {
                            value = !value;
                        }
                        if (value) {
                            if (!childScope) {
                                $transclude(function(clone, newScope) {
                                    childScope = newScope;
                                    clone[clone.length++] = document.createComment(' end ngIf: ' + $attr.ngIf + ' ');
                                    // Note: We only need the first/last node of the cloned nodes.
                                    // However, we need to keep the reference to the jqlite wrapper as it might be changed later
                                    // by a directive with templateUrl when its template arrives.
                                    block = {
                                        clone: clone
                                    };
                                    $animate.enter(clone, $element.parent(), $element);
                                });
                            }
                        } else {
                            if (previousElements) {
                                previousElements.remove();
                                previousElements = null;
                            }
                            if (childScope) {
                                childScope.$destroy();
                                childScope = null;
                            }
                            if (block) {
                                previousElements = getBlockNodes(block.clone);
                                $animate.leave(previousElements).then(function() {
                                    previousElements = null;
                                });
                                block = null;
                            }
                        }
                    }
                );
            }
        };
    }
])

.factory('PasswordGenerator', [
    function () {
        return {
            generate: function (length) {
                if (!length) {
                    length = 8;
                }
                var chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789',
                pw = '';
                for (var i = 0; i < length; ++i) {
                    pw += chars.charAt(Math.floor(Math.random() * chars.length));
                }
                return pw;
            }
        };
    }
])

.factory('PersonalNoteManager', [
    'PersonalNote',
    'operator',
    function (PersonalNote, operator) {
        var _getPersonalNoteObject = function (resourceName) {
            var personalNote = _.find(PersonalNote.getAll(), function (pn) {
                return pn.user_id === operator.user.id;
            });
            if (!personalNote) {
                personalNote = {
                    notes: {},
                };
            }
            if (!personalNote.notes[resourceName]) {
                personalNote.notes[resourceName] = {};
            }
            return personalNote;
        };
        var get = function (resourceName, id) {
            return _getPersonalNoteObject(resourceName).notes[resourceName][id];
        };
        var save = function (resourceName, id, note) {
            var personalNote = _getPersonalNoteObject(resourceName);
            personalNote.notes[resourceName][id] = note;
            if (personalNote.id) {
                return PersonalNote.save(personalNote);
            } else {
                return PersonalNote.create(personalNote);
            }
        };
        return {
            getNote: function (obj) {
                if (typeof obj.getResourceName === 'undefined') {
                    throw 'The Object has to be a js data model!';
                }
                return get(obj.getResourceName(), obj.id);
            },
            saveNote: function (obj, note) {
                if (typeof obj.getResourceName === 'undefined') {
                    throw 'The Object has to be a js data model!';
                }
                return save(obj.getResourceName(), obj.id, note);
            },
        };
    }
])

// Service for generic assignment form (create and update)
.factory('UserForm', [
    '$http',
    'gettextCatalog',
    'Editor',
    'Group',
    'Mediafile',
    'PasswordGenerator',
    function ($http, gettextCatalog, Editor, Group, Mediafile, PasswordGenerator) {
        return {
            // ngDialog for user form
            getDialog: function (user) {
                return {
                    template: 'static/templates/users/user-form.html',
                    controller: (user) ? 'UserUpdateCtrl' : 'UserCreateCtrl',
                    className: 'ngdialog-theme-default wide-form',
                    closeByEscape: false,
                    closeByDocument: false,
                    resolve: {
                        userId: function () {return user ? user.id : void 0;},
                    }
                };
            },
            // angular-formly fields for user form
            getFormFields: function (hideOnCreateForm) {
                var images = Mediafile.getAllImages();
                return [
                {
                    className: "row",
                    fieldGroup: [
                        {
                            key: 'title',
                            type: 'input',
                            className: "col-xs-2 no-padding-left",
                            templateOptions: {
                                label: gettextCatalog.getString('Title')
                            }
                        },
                        {
                            key: 'first_name',
                            type: 'input',
                            className: "col-xs-5 no-padding",
                            templateOptions: {
                                label: gettextCatalog.getString('Given name')
                            }
                        },
                        {
                            key: 'last_name',
                            type: 'input',
                            className: "col-xs-5 no-padding-right",
                            templateOptions: {
                                label: gettextCatalog.getString('Surname')
                            }
                        }
                    ]
                },
                {
                    key: 'email',
                    type: 'input',
                    templateOptions: {
                        label: gettextCatalog.getString('Email')
                    },
                },
                {
                    className: "row",
                    fieldGroup: [
                        {
                            key: 'structure_level',
                            type: 'input',
                            className: "col-xs-9 no-padding-left",
                            templateOptions: {
                                label: gettextCatalog.getString('Structure level'),
                            }
                        },
                        {   key: 'number',
                            type: 'input',
                            className: "col-xs-3 no-padding-left no-padding-right",
                            templateOptions: {
                                label:gettextCatalog.getString('Participant number')
                            }
                        }
                    ]
                },
                {
                    key: 'username',
                    type: 'input',
                    templateOptions: {
                        label: gettextCatalog.getString('Username')
                    },
                    hide: hideOnCreateForm
                },
                {
                    key: 'groups_id',
                    type: 'select-multiple',
                    templateOptions: {
                        label: gettextCatalog.getString('Groups'),
                        options: Group.filter({where: {id: {'>': 1}}}),
                        ngOptions: "option.id as option.name | translate for option in to.options | orderBy: 'id'",
                        placeholder: gettextCatalog.getString('Select or search a group ...')
                    }
                },
                {
                    key: 'default_password',
                    type: 'input',
                    templateOptions: {
                        label: gettextCatalog.getString('Initial password'),
                        description: gettextCatalog.getString('Initial password can not be changed.'),
                        addonRight: {
                            text: gettextCatalog.getString('Generate'),
                            class: 'fa fa-magic',
                            onClick:function (options, scope) {
                                scope.$parent.model.default_password = PasswordGenerator.generate();
                            }
                        }
                    },
                    hide: !hideOnCreateForm
                },
                {
                    key: 'comment',
                    type: 'input',
                    templateOptions: {
                        label: gettextCatalog.getString('Comment'),
                        description: gettextCatalog.getString('Only for internal notes.')
                    }
                },
                {
                    key: 'more',
                    type: 'checkbox',
                    templateOptions: {
                        label: gettextCatalog.getString('Show extended fields')
                    }
                },
                {
                    template: '<hr class="smallhr">',
                    hideExpression: '!model.more'
                },
                {
                    key: 'is_present',
                    type: 'checkbox',
                    templateOptions: {
                        label: gettextCatalog.getString('Is present'),
                        description: gettextCatalog.getString('Designates whether this user is in the room or not.')
                    },
                    defaultValue: true,
                    hideExpression: '!model.more'
                },
                {
                    key: 'is_active',
                    type: 'checkbox',
                    templateOptions: {
                        label: gettextCatalog.getString('Is active'),
                        description: gettextCatalog.getString(
                            'Designates whether this user should be treated as ' +
                            'active. Unselect this instead of deleting the account.')
                    },
                    defaultValue: true,
                    hideExpression: '!model.more'
                },
                {
                    key: 'is_committee',
                    type: 'checkbox',
                    templateOptions: {
                        label: gettextCatalog.getString('Is a committee'),
                        description: gettextCatalog.getString(
                            'Designates whether this user should be treated as a committee.')
                    },
                    defaultValue: false,
                    hideExpression: '!model.more'
                },
                {
                    key: 'about_me',
                    type: 'editor',
                    templateOptions: {
                        label: gettextCatalog.getString('About me'),
                    },
                    data: {
                        ckeditorOptions: Editor.getOptions(images)
                    },
                    hideExpression: '!model.more'
                }
                ];
            }
        };
    }
])

.factory('UserProfileForm', [
    'gettextCatalog',
    'Editor',
    'Mediafile',
    function (gettextCatalog, Editor, Mediafile) {
        return {
            // ngDialog for user form
            getDialog: function () {
                return {
                    template: 'static/templates/users/profile-password-form.html',
                    controller: 'UserProfileCtrl',
                    className: 'ngdialog-theme-default wide-form',
                    closeByEscape: false,
                    closeByDocument: false,
                };
            },
            // angular-formly fields for user form
            getFormFields: function (hideOnCreateForm) {
                var images = Mediafile.getAllImages();
                return [
                {
                    key: 'username',
                    type: 'input',
                    templateOptions: {
                        label: gettextCatalog.getString('Username'),
                        required: true
                    },
                },
                {
                    key: 'email',
                    type: 'input',
                    templateOptions: {
                        label: gettextCatalog.getString('Email')
                    },
                },
                {
                    key: 'about_me',
                    type: 'editor',
                    templateOptions: {
                        label: gettextCatalog.getString('About me'),
                    },
                    data: {
                        ckeditorOptions: Editor.getOptions(images)
                    },
                }
                ];
            }
        };
    }
])

.factory('UserPasswordForm', [
    'gettextCatalog',
    function (gettextCatalog) {
        return {
            // ngDialog for user form
            getDialog: function () {
                return {
                    template: 'static/templates/users/profile-password-form.html',
                    controller: 'UserPasswordCtrl',
                    className: 'ngdialog-theme-default',
                    closeByEscape: false,
                    closeByDocument: false,
                };
            },
            // angular-formly fields for user form
            getFormFields: function (hideOnCreateForm) {
                return [
                {
                    key: 'oldPassword',
                    type: 'password',
                    templateOptions: {
                        label: gettextCatalog.getString('Old password'),
                        required: true
                    },
                },
                {
                    key: 'newPassword',
                    type: 'password',
                    templateOptions: {
                        label: gettextCatalog.getString('New password'),
                        required: true
                    },
                },
                {
                    key: 'newPassword2',
                    type: 'password',
                    templateOptions: {
                        label: gettextCatalog.getString('Confirm new password'),
                        required: true
                    },
                },
                ];
            }
        };
    }
])

.controller('UserListCtrl', [
    '$scope',
    '$http',
    'ngDialog',
    'UserForm',
    'User',
    'Group',
    'PasswordGenerator',
    'Projector',
    'ProjectionDefault',
    'Config',
    'UserCsvExport',
    'osTableFilter',
    'osTableSort',
    'osTablePagination',
    'gettext',
    'UserPdfExport',
    'InvitationEmails',
    'ErrorMessage',
    function($scope, $http, ngDialog, UserForm, User, Group, PasswordGenerator,
        Projector, ProjectionDefault, Config, UserCsvExport, osTableFilter, osTableSort,
        osTablePagination, gettext, UserPdfExport, InvitationEmails, ErrorMessage) {
        $scope.$watch(function () {
            return User.lastModified();
        }, function () {
            $scope.users = _.orderBy(User.getAll(), ['first_name']);
            _.forEach($scope.users, function (user) {
                user.has_last_email_send = !!user.last_email_send;
            });
            if ($scope.updateUsers) {
                $scope.updateUsers();
            }
        });
        Group.bindAll({where: {id: {'>': 1}}}, $scope, 'groups');
        $scope.$watch(function () {
            return Projector.lastModified();
        }, function () {
            var projectiondefault = ProjectionDefault.filter({name: 'users'})[0];
            if (projectiondefault) {
                $scope.defaultProjectorId = projectiondefault.projector_id;
            }
        });
        $scope.alert = {};

        // Filtering
        $scope.filter = osTableFilter.createInstance('UserTableFilter');

        if (!$scope.filter.existsStorageEntry()) {
            $scope.filter.multiselectFilters = {
                group: [],
            };
            $scope.filter.booleanFilters = {
                isPresent: {
                    value: undefined,
                    displayName: gettext('Present'),
                    choiceYes: gettext('Is present'),
                    choiceNo: gettext('Is not present'),
                    needExtraPermission: true,
                },
                isActive: {
                    value: undefined,
                    displayName: gettext('Active'),
                    choiceYes: gettext('Is active'),
                    choiceNo: gettext('Is not active'),
                    needExtraPermission: true,
                },
                isCommittee: {
                    value: undefined,
                    displayName: gettext('Committee'),
                    choiceYes: gettext('Is a committee'),
                    choiceNo: gettext('Is not a committee'),
                },
                hasLastEmailSend: {
                    value: undefined,
                    displayName: gettext('Last email send'),
                    choiceYes: gettext('Got an email'),
                    choiceNo: gettext("Didn't get an email"),
                },
            };
        }
        $scope.filter.propertyList = ['first_name', 'last_name', 'username', 'title',
            'number', 'comment', 'structure_level'];
        $scope.filter.propertyDict = {
            'groups_id' : function (group_id) {
                return Group.get(group_id).name;
            },
        };
        $scope.getItemId = {
            group: function (user) {return user.groups_id;},
        };
        // Sorting
        $scope.sort = osTableSort.createInstance('UserTableSort');
        if (!$scope.sort.column) {
            $scope.sort.column = $scope.config('users_sort_by');
        }
        $scope.sortOptions = [
            {name: 'first_name',
             display_name: gettext('Given name')},
            {name: 'last_name',
             display_name: gettext('Surname')},
            {name: 'is_present',
             display_name: gettext('Present')},
            {name: 'is_active',
             display_name: gettext('Active')},
            {name: 'is_committee',
             display_name: gettext('Committee')},
            {name: 'number',
             display_name: gettext('Number')},
            {name: 'structure_level',
             display_name: gettext('Structure level')},
            {name: 'comment',
             display_name: gettext('Comment')},
            {name: 'last_email_send',
             display_name: gettext('Last email send')},
        ];

        // pagination
        $scope.pagination = osTablePagination.createInstance('UserTablePagination');

        // Toggle group from user
        $scope.toggleGroup = function (user, group) {
            if (_.indexOf(user.groups_id, group.id) > -1) {
                user.groups_id = _.filter(user.groups_id, function (group_id) {
                    return group_id != group.id;
                });
            } else {
                user.groups_id.push(group.id);
            }
            $scope.save(user);
        };
        // open new/edit dialog
        $scope.openDialog = function (user) {
            ngDialog.open(UserForm.getDialog(user));
        };
        // save changed user
        $scope.save = function (user) {
            User.save(user).then(
                function(success) {
                    //user.quickEdit = false;
                    $scope.alert.show = false;
                },
                function(error){
                    $scope.alert = ErrorMessage.forAlert(error);
                });
        };
        // delete single user
        $scope.delete = function (user) {
            User.destroy(user.id);
        };
        // *** select mode functions ***
        $scope.isSelectMode = false;
        // check all checkboxes
        $scope.checkAll = function () {
            $scope.selectedAll = !$scope.selectedAll;
            _.forEach($scope.usersFiltered, function (user) {
                user.selected = $scope.selectedAll;
            });
        };
        // uncheck all checkboxes if isSelectMode is closed
        $scope.uncheckAll = function () {
            if (!$scope.isSelectMode) {
                $scope.selectedAll = false;
                angular.forEach($scope.users, function (user) {
                    user.selected = false;
                });
            }
        };
        var selectModeAction = function (predicate) {
            angular.forEach($scope.usersFiltered, function (user) {
                if (user.selected) {
                    predicate(user);
                }
            });
            $scope.isSelectMode = false;
            $scope.uncheckAll();
        };
        // delete all selected users
        $scope.deleteMultiple = function () {
            selectModeAction(function (user) {
                $scope.delete(user);
            });
        };
        // add group for selected users
        $scope.addGroupMultiple = function (group) {
            if (group) {
                selectModeAction(function (user) {
                    user.groups_id.push(group);
                    User.save(user);
                });
            }
        };
        // remove group for selected users
        $scope.removeGroupMultiple = function (group) {
            if (group) {
                selectModeAction(function (user) {
                    var groupIndex = _.indexOf(user.groups_id, parseInt(group));
                    if (groupIndex > -1) {
                        user.groups_id.splice(groupIndex, 1);
                        User.save(user);
                    }
                });
            }
        };
        // generate new passwords
        $scope.generateNewPasswordsMultiple = function () {
            selectModeAction(function (user) {
                var newPassword = PasswordGenerator.generate();
                user.default_password = newPassword;
                User.save(user);
                $http.post(
                    '/rest/users/user/' + user.id + '/reset_password/',
                    {'password': newPassword}
                );
            });
        };
        // set boolean properties (is_active, is_present, is_committee)
        $scope.setBoolPropertyMultiple = function (property, value) {
            selectModeAction(function (user) {
                user[property] = value;
                User.save(user);
            });
        };
        // Send invitation emails
        $scope.sendInvitationEmails = function () {
            InvitationEmails.send($scope.usersFiltered).then(function (success) {
                $scope.alert = success;
                $scope.isSelectMode = false;
                $scope.uncheckAll();
            }, function (error) {
                $scope.alert = ErrorMessage.forAlert(error);
                $scope.isSelectMode = false;
                $scope.uncheckAll();
            });
        };

        // Export as PDF
        $scope.pdfExportUserList = function () {
            UserPdfExport.exportUserList($scope.usersFiltered);
        };
        $scope.pdfExportUserAccessDataList = function () {
            UserPdfExport.exportUserAccessDataList($scope.usersFiltered);
        };
        // Export as a csv file
        $scope.csvExport = function () {
            UserCsvExport.export($scope.usersFiltered);
        };
    }
])

.factory('InvitationEmails', [
    '$http',
    'User',
    'Config',
    'gettextCatalog',
    function ($http, User, Config, gettextCatalog) {
        return {
            // Returns the request promise. If it was successfull, a nice message for
            // an alert is generated and the alert-object is returned.
            send: function (users) {
                var user_ids = _
                    .chain(users)
                    .filter(function (user) {
                        return user.selected;
                    })
                    .map(function (user) {
                        return user.id;
                    })
                    .value();
                var subject = gettextCatalog.getString(Config.get('users_email_subject').value);
                var message = gettextCatalog.getString(Config.get('users_email_body').value);

                return $http.post('/rest/users/user/mass_invite_email/', {
                    user_ids: user_ids,
                    subject: subject,
                    message: message,
                }).then(function (success) {
                    var numEmails = success.data.count;
                    var noEmailIds = success.data.no_email_ids;
                    var type = 'success', msg;
                    if (numEmails === 0) {
                        type = 'danger';
                        msg = gettextCatalog.getString('No emails were send.');
                    } else if (numEmails === 1) {
                        msg = gettextCatalog.getString('One email was send sucessfully.');
                    } else {
                        msg = gettextCatalog.getString('%num% emails were send sucessfully.').replace('%num%', numEmails);
                    }

                    if (noEmailIds.length) {
                        type = 'warning';
                        msg += ' ';

                        if (noEmailIds.length === 1) {
                            msg += gettextCatalog.getString('The user %user% has no email, so the invitation email could not be send.');
                        } else {
                            msg += gettextCatalog.getString('The users %user% have no email, so the invitation emails could not be send.');
                        }

                        // This one builds a username string like "user1, user2 and user3" with the full names.
                        var lastUsername, userString = _
                            .chain(noEmailIds)
                            .map(function (id) {
                                var user = User.get(id);
                                return user ? user.get_full_name() : '';
                            })
                            .filter(function (username) {
                                return username;
                            })
                            .tap(function (names) {
                                if (names.length !== 1) {
                                    lastUsername = names.pop();
                                }
                            })
                            .join(', ')
                            .thru(function (names) {
                                return lastUsername ? names + ' ' + gettextCatalog.getString('and') + ' ' + lastUsername : names;
                            })
                            .value();
                        msg = msg.replace('%user%', userString);
                    }

                    return {
                        msg: msg,
                        type: type,
                        show: true,
                    };
                });
            },
        };
    }
])

.controller('UserDetailCtrl', [
    '$scope',
    'ngDialog',
    'UserForm',
    'User',
    'userId',
    'Group',
    'Projector',
    'ProjectionDefault',
    'gettextCatalog',
    'WebpageTitle',
    function($scope, ngDialog, UserForm, User, userId, Group, Projector, ProjectionDefault, gettextCatalog,
        WebpageTitle) {
        Group.bindAll({where: {id: {'>': 1}}}, $scope, 'groups');
        $scope.$watch(function () {
            return User.lastModified(userId);
        }, function () {
            $scope.user = User.get(userId);
            WebpageTitle.updateTitle(gettextCatalog.getString('Participant') + ' ' + $scope.user.get_short_name());
        });
        $scope.$watch(function () {
            return Projector.lastModified();
        }, function () {
            var projectiondefault = ProjectionDefault.filter({name: 'users'})[0];
            if (projectiondefault) {
                $scope.defaultProjectorId = projectiondefault.projector_id;
            }
        });

        // open edit dialog
        $scope.openDialog = function (user) {
            ngDialog.open(UserForm.getDialog(user));
        };
    }
])

.controller('UserCreateCtrl', [
    '$scope',
    '$state',
    'User',
    'UserForm',
    'ErrorMessage',
    function($scope, $state, User, UserForm, ErrorMessage) {
        $scope.alert = {};
        // get all form fields
        $scope.formFields = UserForm.getFormFields(true);

        // save user
        $scope.save = function (user) {
            if (!user.groups_id) {
                user.groups_id = [];
            }
            User.create(user).then(
                function (success) {
                    $scope.closeThisDialog();
                },
                function (error) {
                    $scope.alert = ErrorMessage.forAlert(error);
                }
            );
        };
    }
])

.controller('UserUpdateCtrl', [
    '$scope',
    '$state',
    'User',
    'UserForm',
    'userId',
    'ErrorMessage',
    function($scope, $state, User, UserForm, userId, ErrorMessage) {
        $scope.alert = {};
        // set initial values for form model by create deep copy of user object
        // so list/detail view is not updated while editing
        $scope.model = angular.copy(User.get(userId));

        // get all form fields
        $scope.formFields = UserForm.getFormFields();

        // save user
        $scope.save = function (user) {
            if (!user.groups_id) {
                user.groups_id = [];
            }
            // inject the changed user (copy) object back into DS store
            User.inject(user);
            // save change user object on server
            User.save(user).then(
                function (success) {
                    $scope.closeThisDialog();
                },
                function (error) {
                    // save error: revert all changes by restore
                    // (refresh) original user object from server
                    User.refresh(user);
                    $scope.alert = ErrorMessage.forAlert(error);
                }
            );
        };
    }
])

.controller('UserProfileCtrl', [
    '$scope',
    'Editor',
    'User',
    'operator',
    'UserProfileForm',
    'gettext',
    'ErrorMessage',
    function($scope, Editor, User, operator, UserProfileForm, gettext, ErrorMessage) {
        $scope.model = angular.copy(operator.user);
        $scope.title = gettext('Edit profile');
        $scope.formFields = UserProfileForm.getFormFields();
        $scope.save = function (user) {
            User.inject(user);
            User.save(user).then(
                function(success) {
                    $scope.closeThisDialog();
                },
                function(error) {
                    // save error: revert all changes by restore
                    // (refresh) original user object from server
                    User.refresh(user);
                    $scope.alert = ErrorMessage.forAlert(error);
                }
            );
        };
    }
])

.controller('UserChangePasswordCtrl', [
    '$scope',
    '$state',
    '$http',
    'User',
    'userId',
    'gettextCatalog',
    'PasswordGenerator',
    'ErrorMessage',
    function($scope, $state, $http, User, userId, gettextCatalog, PasswordGenerator, ErrorMessage) {
        User.bindOne(userId, $scope, 'user');
        $scope.alert = {};
        $scope.generatePassword = function () {
            $scope.new_password = PasswordGenerator.generate();
        };
        $scope.save = function (user) {
            if ($scope.new_password !== '') {
                $http.post(
                    '/rest/users/user/' + user.id + '/reset_password/',
                    {'password': $scope.new_password}
                ).then(
                    function (success) {
                        $scope.alert = {type: 'success', msg: success.data.detail, show: true};
                        $scope.new_password = '';
                    },
                    function (error) {
                        $scope.alert = ErrorMessage.forAlert(error);
                    }
                );
            }
        };
    }
])

.directive("showPassword", function() {
    return function linkFn(scope, elem, attrs) {
        scope.$watch(attrs.showPassword, function(value) {
            if (value) {
                elem.attr("type", "text");
            } else {
                elem.attr("type", "password");
            }
        });
    };
})

.controller('UserPasswordCtrl', [
    '$scope',
    '$state',
    '$http',
    'gettext',
    'UserPasswordForm',
    'ErrorMessage',
    function($scope, $state, $http, gettext, UserPasswordForm, ErrorMessage) {
        $scope.title = 'Change password';
        $scope.alert = {};
        $scope.model = {};
        $scope.formFields = UserPasswordForm.getFormFields();
        $scope.save = function (data) {
            if (data.newPassword != data.newPassword2) {
                data.newPassword = data.newPassword2 = '';
                $scope.alert = {
                    type: 'danger',
                    msg: gettext('Password confirmation does not match.'),
                    show: true,
                };
            } else {
                $http.post(
                    '/users/setpassword/',
                    {'old_password': data.oldPassword, 'new_password': data.newPassword}
                ).then(
                    function (success) {
                        $scope.closeThisDialog();
                    },
                    function (error) {
                        // Error, e. g. wrong old password.
                        $scope.model = {};
                        $scope.alert = ErrorMessage.forAlert(error);
                    }
                );
            }
        };
    }
])

.controller('UserPresenceCtrl', [
    '$scope',
    'User',
    'gettextCatalog',
    'ErrorMessage',
    function ($scope, User, gettextCatalog, ErrorMessage) {
        $scope.alert = {};
        $('#userNumber').focus();

        $scope.changeState = function () {
            if (!$scope.number) {
                return;
            }
            var enteredNumber = $scope.number.trim();
            var user = _.find(User.getAll(), function (user) {
                return user.number === enteredNumber;
            });
            if (user) {
                user.is_present = !user.is_present;
                User.save(user).then(function (success) {
                    var messageText = user.full_name + ' ' + gettextCatalog.getString('is now') + ' ';
                    messageText += gettextCatalog.getString(user.is_present ? 'present' : 'not present') + '.';
                    $scope.alert = {
                        msg: messageText,
                        show: true,
                        type: 'success',
                    };
                    $scope.number = '';
                }, function (error) {
                    $scope.alert = ErrorMessage.forAlert(error);
                });
            } else {
                $scope.alert = {
                    msg: gettextCatalog.getString('Cannot find the participant with the participant number') + ' "' + enteredNumber + '".',
                    show: true,
                    type: 'danger',
                };
            }
            $('#userNumber').focus();
        };
    }
])

.controller('UserImportCtrl', [
    '$scope',
    '$http',
    '$q',
    'gettext',
    'gettextCatalog',
    'User',
    'Group',
    'UserCsvExport',
    'osTablePagination',
    'ErrorMessage',
    function($scope, $http, $q, gettext, gettextCatalog, User, Group, UserCsvExport,
        osTablePagination, ErrorMessage) {
        // import from textarea
        $scope.importByLine = function () {
            var usernames = $scope.userlist[0].split("\n");
            var users = _.map(usernames, function (name) {
                // Split each full name in first and last name.
                // The last word is set as last name, rest is the first name(s).
                // (e.g.: "Max Martin Mustermann" -> last_name = "Mustermann")
                var names = name.split(" ");
                var last_name = names.slice(-1)[0];
                var first_name = names.slice(0, -1).join(" ");
                return {
                    first_name: first_name,
                    last_name: last_name,
                    groups_id: [],
                };
            });
            $http.post('/rest/users/user/mass_import/', {
                users: users
            }).then(function (success) {
                $scope.alert = {
                    show: true,
                    type: 'success',
                    msg: success.data.detail,
                };
            }, function (error) {
                $scope.alert = ErrorMessage.forAlert(error);
            });
        };

        // pagination
        $scope.pagination = osTablePagination.createInstance('UserImportTablePagination', 100);

        // Duplicates
        $scope.duplicateActions = [
            gettext('keep original'),
            gettext('override new'),
            gettext('create duplicate')
        ];

        // *** csv import ***
        $scope.csvConfig = {
            accept: '.csv, .txt',
            encodingOptions: ['UTF-8', 'ISO-8859-1'],
            parseConfig: {
                skipEmptyLines: true,
            },
        };

        var FIELDS = ['title', 'first_name', 'last_name', 'structure_level', 'number',
        'groups', 'comment', 'is_active', 'is_present', 'is_committee', 'default_password', 'email'];
        $scope.users = [];
        $scope.onCsvChange = function (csv) {
            $scope.csvImporting = false;
            // All user objects are already loaded via the resolve statement from ui-router.
            var users = User.getAll();
            $scope.users = [];

            var csvUsers = [];
            _.forEach(csv.data, function (row) {
                if (row.length >= 2) {
                    var filledRow = _.zipObject(FIELDS, row);
                    csvUsers.push(filledRow);
                }
            });
            $scope.duplicates = 0;
            _.forEach(csvUsers, function (user, index) {
                user.importTrackId = index;
                user.selected = true;
                if (!user.first_name && !user.last_name) {
                    user.importerror = true;
                    user.name_error = gettext('Error: Given name or surname is required.');
                }
                // number
                if (!user.number) {
                    user.number = "";
                }
                // groups
                user.groups_id = []; // will be overwritten if there are groups
                if (user.groups) {
                    user.groups = user.groups.split(',');
                    user.groups = _.map(user.groups, function (group) {
                        return _.trim(group); // remove whitespaces on start or end
                    });

                    // All group objects are already loaded via the resolve statement from ui-router.
                    var allGroups = Group.getAll();
                    // in allGroupsNames ar all original group names and translated names if a
                    // translation exists (e.g. for default group Delegates)
                    var allGroupsNames = [];
                    _.forEach(allGroups, function (group) {
                        var groupTranslation = gettextCatalog.getString(group.name);
                        if (group.name !== groupTranslation) {
                            allGroupsNames.push(groupTranslation);
                        }
                        allGroupsNames.push(group.name);
                    });
                    user.groupsToCreate = _.difference(user.groups, allGroupsNames);

                    // for template:
                    user.groupsNotToCreate = _.difference(user.groups, user.groupsToCreate);
                } else {
                    user.groups = [];
                }
                user.is_active = (user.is_active !== undefined && user.is_active === '1');
                user.is_present = (user.is_present !== undefined && user.is_present === '1');
                user.is_committee = (user.is_committee !== undefined && user.is_committee === '1');

                // Check for duplicates
                user.duplicate = false;
                users.forEach(function(user_) {
                    user_.fullname = [
                        user_.title,
                        user_.first_name,
                        user_.last_name,
                        user_.structure_level].join(' ').trim();
                    user.fullname = [
                        user.title,
                        user.first_name,
                        user.last_name,
                        user.structure_level].join(' ').trim();
                    if (user_.fullname === user.fullname) {
                        if (user.duplicate) {
                            // there are multiple duplicates!
                            user.duplicate_info += '\n' + gettextCatalog.getString('There are more than one duplicates of this user!');
                        } else {
                            user.duplicate = true;
                            user.duplicateAction = $scope.duplicateActions[1];
                            user.duplicate_info = '';
                            if (user_.title)
                                user.duplicate_info += user_.title + ' ';
                            if (user_.first_name)
                                user.duplicate_info += user_.first_name;
                            if (user_.first_name && user_.last_name)
                                user.duplicate_info += ' ';
                            if (user_.last_name)
                                user.duplicate_info += user_.last_name;
                            user.duplicate_info += ' (';
                            if (user_.number)
                                user.duplicate_info += gettextCatalog.getString('Number') + ': ' + user_.number + ', ';
                            if (user_.structure_level)
                                user.duplicate_info += gettextCatalog.getString('Structure level') + ': ' + user_.structure_level + ', ';
                            user.duplicate_info += gettextCatalog.getString('Username') + ': ' + user_.username + ') '+
                                gettextCatalog.getString('already exists.');

                            $scope.duplicates++;
                        }
                    }
                });
                $scope.users.push(user);
            });
            $scope.calcStats();
        };

        // Stats
        $scope.calcStats = function() {
            // not imported: if importerror or duplicate->keep original
            $scope.usersWillNotBeImported = 0;
            // imported: all others
            $scope.usersWillBeImported = 0;

            $scope.users.forEach(function(user) {
                if (!user.selected || user.importerror || (user.duplicate && user.duplicateAction == $scope.duplicateActions[0])) {
                    $scope.usersWillNotBeImported++;
                } else {
                    $scope.usersWillBeImported++;
                }
            });
        };

        $scope.setGlobalAction = function (action) {
            $scope.users.forEach(function (user) {
                if (user.duplicate)
                    user.duplicateAction = action;
            });
            $scope.calcStats();
        };

        // import from csv file
        $scope.import = function () {
            $scope.csvImporting = true;

            // collect all needed groups and create non existing groups
            var groupsToCreate = [];
            _.forEach($scope.users, function (user) {
                if (user.selected && !user.importerror && user.groups.length) {
                    _.forEach(user.groupsToCreate, function (group) { // Just append groups, that are not listed yet.
                        if (_.indexOf(groupsToCreate, group) == -1) {
                            groupsToCreate.push(group);
                        }
                    });
                }
            });
            var createPromises = [];
            $scope.groupsCreated = 0;
            _.forEach(groupsToCreate, function (groupname) {
                var group = {
                    name: groupname,
                    permissions: []
                };
                createPromises.push(Group.create(group).then( function (success) {
                    $scope.groupsCreated++;
                }));
            });

            $q.all(createPromises).then(function () {
                // reload allGroups, now all new groups are created
                var allGroups = Group.getAll();
                var existingUsers = User.getAll();

                // For option 'delete existing user' on duplicates
                var deletePromises = [];
                // Array of users for mass import
                var usersToBeImported = [];

                _.forEach($scope.users, function (user) {
                    if (user.selected && !user.importerror) {
                        // Assign all groups
                        _.forEach(user.groups, function(csvGroup) {
                            allGroups.forEach(function (allGroup) {
                                // check with and without translation
                                if (csvGroup === allGroup.name ||
                                    csvGroup === gettextCatalog.getString(allGroup.name)) {
                                    user.groups_id.push(allGroup.id);
                                }
                            });
                        });

                        // Do nothing on duplicateAction==duplicateActions[0] (keep original)
                        if (user.duplicate && (user.duplicateAction == $scope.duplicateActions[1])) {
                            // delete existing user
                            existingUsers.forEach(function(user_) {
                                user_.fullname = [
                                    user_.title,
                                    user_.first_name,
                                    user_.last_name,
                                    user_.structure_level].join(' ').trim();
                                user.fullname = [
                                    user.title,
                                    user.first_name,
                                    user.last_name,
                                    user.structure_level].join(' ').trim();
                                if (user_.fullname === user.fullname) {
                                    deletePromises.push(User.destroy(user_.id));
                                }
                            });
                            usersToBeImported.push(user);
                        } else if (!user.duplicate ||
                                   (user.duplicateAction == $scope.duplicateActions[2])) {
                            // create user
                            usersToBeImported.push(user);
                        }
                    }
                });
                $q.all(deletePromises).then(function () {
                    $http.post('/rest/users/user/mass_import/', {
                        users: usersToBeImported
                    }).then(function (success) {
                        _.forEach(success.data.importedTrackIds, function (trackId) {
                            _.find($scope.users, function (user) {
                                return user.importTrackId === trackId;
                            }).imported = true;
                        });
                        $scope.csvimported = true;
                    }, function (error) {
                        $scope.alert = ErrorMessage.forAlert(error);
                    });
                });
            });
        };
        $scope.clear = function () {
            $scope.users = null;
        };
        $scope.excludeImportedUsers = function () {
            $scope.users = _.filter($scope.users, function (user) {
                return !user.imported;
            });
            $scope.csvImporting = false;
            $scope.calcStats();
        };
        $scope.someImportedUsers = function () {
            return _.some($scope.users, function (user) {
                return user.imported;
            });
        };
        // download CSV example file
        $scope.downloadCSVExample = function () {
            UserCsvExport.downloadExample();
        };
    }
])

.controller('GroupListCtrl', [
    '$scope',
    '$http',
    '$filter',
    'operator',
    'Group',
    'permissions',
    'gettext',
    'Agenda',
    'Assignment',
    'Mediafile',
    'Motion',
    'User',
    'ngDialog',
    'OpenSlidesPlugins',
    function($scope, $http, $filter, operator, Group, permissions, gettext, Agenda,
        Assignment, Mediafile, Motion, User, ngDialog, OpenSlidesPlugins) {
        $scope.permissions = permissions;

        $scope.$watch(function() {
            return Group.lastModified();
        }, function() {
            $scope.groups = $filter('orderBy')(Group.getAll(), 'id');

            // find all groups with the 2 dangerous permissions
            var groups_danger = [];
            $scope.groups.forEach(function (group) {
                if ((_.indexOf(group.permissions, 'users.can_see_name') > -1) &&
                    (_.indexOf(group.permissions, 'users.can_manage') > -1)){
                    if (operator.isInGroup(group)){
                        groups_danger.push(group);
                    }
                }
            });
            // if there is only one dangerous group, block it.
            $scope.group_danger = groups_danger.length == 1 ? groups_danger[0] : null;
        });

        // Dict to map plugin name -> display_name
        var pluginTranslation = {};
        _.forEach(OpenSlidesPlugins.getAll(), function (plugin) {
            pluginTranslation[plugin.name] = plugin.display_name;
        });
        $scope.apps = [];
        // Create the main clustering with appname->permissions
        angular.forEach(permissions, function(perm) {
            var permissionApp = perm.value.split('.')[0]; // get appname

            // To insert perm in the right spot in $scope.apps
            var insert = function (id, perm, verboseName) {
                if (!$scope.apps[id]) {
                    $scope.apps[id] = {
                        app_name: verboseName,
                        app_visible: true,
                        permissions: []
                    };
                }
                $scope.apps[id].permissions.push(perm);
            };

            switch(permissionApp) {
                case 'core': // id 0 (projector) and id 6 (general)
                    if (perm.value.indexOf('projector') > -1) {
                        insert(0, perm, gettext('Projector'));
                    } else {
                        insert(6, perm, gettext('General'));
                    }
                    break;
                case 'agenda': // id 1
                    insert(1, perm, Agenda.verboseName);
                    break;
                case 'motions': // id 2
                    insert(2, perm, Motion.verboseNamePlural);
                    break;
                case 'assignments': // id 3
                    insert(3, perm, Assignment.verboseNamePlural);
                    break;
                case 'mediafiles': // id 4
                    insert(4, perm, Mediafile.verboseNamePlural);
                    break;
                case 'users': // id 5
                    insert(5, perm, User.verboseNamePlural);
                    break;
                default: // plugins: id>5
                    var display_name = pluginTranslation[permissionApp] || permissionApp.charAt(0).toUpperCase() +
                        permissionApp.slice(1);
                    // does the app exists?
                    var result = -1;
                    angular.forEach($scope.apps, function (app, index) {
                        if (app.app_name === display_name)
                            result = index;
                    });
                    var id = result == -1 ? $scope.apps.length : result;
                    insert(id, perm, display_name);
                    break;
            }
        });

        // sort each app: first all permission with 'see', then 'manage', then the rest
        // save the permissions in different lists an concat them in the right order together
        // Special Users: the two "see"-permissions are normally swapped. To create the right
        // order, we could simply reverse the whole permissions.
        angular.forEach($scope.apps, function (app, index) {
            if(index == 5) { // users
                app.permissions.reverse();
            } else { // rest
                var see = [];
                var manage = [];
                var others = [];
                angular.forEach(app.permissions, function (perm) {
                    if (perm.value.indexOf('see') > -1) {
                        see.push(perm);
                    } else if (perm.value.indexOf('manage') > -1) {
                        manage.push(perm);
                    } else {
                        others.push(perm);
                    }
                });
                app.permissions = see.concat(manage.concat(others));
            }
        });

        // check if the given group has the given permission
        $scope.hasPerm = function (group, permission) {
            return _.indexOf(group.permissions, permission.value) > -1;
        };

        // The current user is not allowed to lock himself out of the configuration:
        // - if the permission is 'users.can_manage' or 'users.can_see'
        // - if the user is in only one group with these permissions (group_danger is set)
        $scope.danger = function (group, permission){
            if ($scope.group_danger){
                if (permission.value == 'users.can_see_name' ||
                    permission.value == 'users.can_manage'){
                    return $scope.group_danger == group;
                }
            }
            return false;
        };

        // delete selected group
        $scope.delete = function (group) {
            Group.destroy(group.id);
        };

        // save changed permission
        $scope.changePermission = function (group, perm) {
            if (!$scope.danger(group, perm)) {
                if (!$scope.hasPerm(group, perm)) { // activate perm
                    group.permissions.push(perm.value);
                } else {
                    // delete perm in group.permissions
                    group.permissions = _.filter(group.permissions, function(value) {
                        return value != perm.value; // remove perm
                    });
                }
                Group.save(group);
            }
        };

        $scope.openDialog = function (group) {
            ngDialog.open({
                template: 'static/templates/users/group-edit.html',
                controller: group ? 'GroupRenameCtrl' : 'GroupCreateCtrl',
                className: 'ngdialog-theme-default wide-form',
                closeByEscape: false,
                closeByDocument: false,
                resolve: {
                    group: function () {return group;},
                }
            });
        };
    }
])

.controller('GroupRenameCtrl', [
    '$scope',
    'Group',
    'group',
    'gettextCatalog',
    'ErrorMessage',
    function($scope, Group, group, gettextCatalog, ErrorMessage) {
        $scope.group = group;
        $scope.new_name = gettextCatalog.getString(group.name);

        $scope.alert = {};
        $scope.save = function() {
            var old_name = gettextCatalog.getString($scope.group.name);
            $scope.group.name = $scope.new_name;
            Group.save($scope.group).then(
                function (success) {
                    $scope.closeThisDialog();
                },
                function (error) {
                   $scope.alert = ErrorMessage.forAlert(error);
                   $scope.group.name = old_name;
                }
            );
        };
    }
])

.controller('GroupCreateCtrl', [
    '$scope',
    'Group',
    'ErrorMessage',
    function($scope, Group, ErrorMessage) {
        $scope.new_name = '';
        $scope.alert = {};

        $scope.save = function() {
            var group = {
                name: $scope.new_name,
                permissions: []
            };

            Group.create(group).then(
                function (success) {
                    $scope.closeThisDialog();
                },
                function (error) {
                   $scope.alert = ErrorMessage.forAlert(error);
                }
            );
        };
    }
])

.factory('UserMenu', [
    '$http',
    'OpenSlides',
    'ngDialog',
    'UserProfileForm',
    'UserPasswordForm',
    function ($http, OpenSlides, ngDialog, UserProfileForm, UserPasswordForm) {
        return {
            logout: function () {
                $http.post('/users/logout/').then(function (response) {
                    // Success: User logged out, so reboot OpenSlides.
                    OpenSlides.reboot();
                });
            },
            editProfile: function () {
                ngDialog.open(UserProfileForm.getDialog());
            },
            changePassword: function () {
                ngDialog.open(UserPasswordForm.getDialog());
            },
        };
    }
])

.controller('userMenu', [
    '$scope',
    'UserMenu',
    function($scope, UserMenu) {
        $scope.logout = UserMenu.logout;
        $scope.editProfile = UserMenu.editProfile;
        $scope.changePassword = UserMenu.changePassword;

    }
])

.controller('LoginFormCtrl', [
    '$rootScope',
    '$scope',
    '$http',
    '$state',
    '$stateParams',
    '$q',
    'operator',
    'gettext',
    'autoupdate',
    'mainMenu',
    'DS',
    'ngDialog',
    function ($rootScope, $scope, $http, $state, $stateParams, $q, operator, gettext,
        autoupdate, mainMenu, DS, ngDialog) {
        $scope.alerts = [];

        if ($stateParams.msg) {
            $scope.alerts.push({
                type: 'danger',
                msg: $stateParams.msg,
            });
        }

        // check if guest login is allowed
        $scope.guestAllowed = $rootScope.guest_enabled;

        // get login info-text from server
        $http.get('/users/login/').then(function (success) {
            if(success.data.info_text) {
                $scope.alerts.push({
                    type: 'success',
                    msg: success.data.info_text
                });
            }
        });
        // check if cookies are enabled
        if (!navigator.cookieEnabled) {
            $scope.alerts.push({
                type: 'danger',
                msg: gettext('You have to enable cookies to use OpenSlides.'),
            });
        }

        // close alert function
        $scope.closeAlert = function(index) {
            $scope.alerts.splice(index, 1);
        };
        // login
        $scope.login = function () {
            $scope.closeThisDialog();
            $scope.alerts = [];
            var data = { 'username': $scope.username, 'password': $scope.password };
            if (!navigator.cookieEnabled) {
                data.cookies = false;
            }
            $http.post('/users/login/', data).then(
                function (response) {
                    // Success: User logged in.
                    // Clear store and reset deferred first message, if guests was enabled before.
                    DS.clear();
                    autoupdate.firstMessageDeferred = $q.defer();
                    // The next lines are partly the same lines as in core/start.js
                    autoupdate.newConnect();
                    autoupdate.firstMessageDeferred.promise.then(function () {
                        operator.setUser(response.data.user_id, response.data.user);
                        $rootScope.operator = operator;
                        mainMenu.updateMainMenu();
                        $state.go('home');
                        $rootScope.openslidesBootstrapDone = true;
                    });
                },
                function (error) {
                    // Error: Username or password is not correct.
                    $state.transitionTo($state.current, {msg: error.data.detail}, {
                          reload: true, inherit: false, notify: true
                    });
                }
            );
        };
        // guest login
        $scope.guestLogin = function () {
            $scope.closeThisDialog();
            $state.go('home');
        };
    }
])

// Mark all users strings for translation in JavaScript.
.config([
    'gettext',
    function (gettext) {
        // permission strings (see models.py of each Django app)
        // agenda
        gettext('Can see agenda');
        gettext('Can manage agenda');
        gettext('Can manage list of speakers');
        gettext('Can see hidden items and time scheduling of agenda');
        gettext('Can put oneself on the list of speakers');
        // assignments
        gettext('Can see elections');
        gettext('Can nominate another participant');
        gettext('Can nominate oneself');
        gettext('Can manage elections');
        // core
        gettext('Can see the projector');
        gettext('Can manage the projector');
        gettext('Can see the front page');
        gettext('Can manage tags');
        gettext('Can manage configuration');
        gettext('Can use the chat');
        gettext('Can manage the chat');
        gettext('Can manage logos and fonts');
        // mediafiles
        gettext('Can see the list of files');
        gettext('Can upload files');
        gettext('Can manage files');
        gettext('Can see hidden files');
        // motions
        gettext('Can see motions');
        gettext('Can create motions');
        gettext('Can support motions');
        gettext('Can manage motions');
        gettext('Can see comments');
        gettext('Can manage comments');
        // users
        gettext('Can see names of users');
        gettext('Can see extra data of users (e.g. present and comment)');
        gettext('Can manage users');

        // config strings in users/config_variables.py
        gettext('General');
        gettext('Sort name of participants by');
        gettext('Enable participant presence view');
        gettext('Participants');
        gettext('Given name');
        gettext('Surname');
        gettext('PDF');
        gettext('Welcome to OpenSlides');
        gettext('Title for access data and welcome PDF');
        gettext('[Place for your welcome and help text.]');
        gettext('Help text for access data and welcome PDF');
        gettext('System URL');
        gettext('Used for QRCode in PDF of access data.');
        gettext('WLAN name (SSID)');
        gettext('Used for WLAN QRCode in PDF of access data.');
        gettext('WLAN password');
        gettext('Used for WLAN QRCode in PDF of access data.');
        gettext('WLAN encryption');
        gettext('Used for WLAN QRCode in PDF of access data.');
        gettext('WEP');
        gettext('WPA/WPA2');
        gettext('No encryption');
        gettext('Email');
        gettext('Email sender');
        gettext('Email subject');
        gettext('Your login for {event_name}');
        gettext('You can use {event_name} as a placeholder.');
        gettext('Email body');
        gettext('Dear {name},\n\nthis is your OpenSlides login for the event {event_name}:\n\n    {url}\n    username: {username}\n    password: {password}\n\nThis email was generated automatically.');
        gettext('Use these placeholders: {name}, {event_name}, {url}, {username}, {password}. The url referrs to the system url.');
    }
]);


// this is code from angular.js. Find a way to call this function from this file
function getBlockNodes(nodes) {
  // TODO(perf): just check if all items in `nodes` are siblings and if they are return the original
  //             collection, otherwise update the original collection.
  var node = nodes[0];
  var endNode = nodes[nodes.length - 1];
  var blockNodes = [node];

  do {
    node = node.nextSibling;
    if (!node) break;
    blockNodes.push(node);
  } while (node !== endNode);

  return $(blockNodes);
}

}());
