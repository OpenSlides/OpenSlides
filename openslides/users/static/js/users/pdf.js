(function () {

'use strict';

angular.module('OpenSlidesApp.users.pdf', ['OpenSlidesApp.core.pdf'])

.factory('UserListContentProvider', [
    'gettextCatalog',
    'PdfPredefinedFunctions',
    function(gettextCatalog, PdfPredefinedFunctions) {

    var createInstance = function(userList, groups) {

        //use the Predefined Functions to create the title
        var title = PdfPredefinedFunctions.createTitle(gettextCatalog.getString("List of participants"));

        //function to generate the user list
        var createUserList = function() {
            var userJsonList = [];

            angular.forEach(userList, function (user, counter) {

                //check if the row is even or odd
                var rowStyle = [];
                if (counter % 2 === 0) {
                    rowStyle = 'tableEven';
                } else {
                    rowStyle = 'tableOdd';
                }

                //parse for the group names
                var userGroups = [];
                angular.forEach(user.groups_id, function (id) {
                    if (id) {
                        angular.forEach(groups, function(group) {
                            if (id == group.id) {
                                userGroups.push(gettextCatalog.getString(group.name));
                            }
                        });
                    }
                });

                var userJsonObj = [
                    {
                        text: "" + (counter+1),
                        style: rowStyle
                    },
                    {
                        text: user.short_name,
                        style: rowStyle
                    },
                    {
                        text: user.structure_level,
                        style: rowStyle
                    },
                    {
                        text: userGroups.join(" "),
                        style: rowStyle
                    }
                ];
                userJsonList.push(userJsonObj);
            });

            var userTableBody = [
                [
                    {
                        text: '#',
                        style: 'tableHeader'
                    },
                    {
                        text: gettextCatalog.getString("Name"),
                        style: 'tableHeader'
                    },
                    {
                        text: gettextCatalog.getString("Structure level"),
                        style: 'tableHeader'
                    },
                    {
                        text: gettextCatalog.getString("Groups"),
                        style: 'tableHeader'
                    }
                ]
            ];
            userTableBody = userTableBody.concat((userJsonList));

            var userTableJsonString = {
                table: {
                    widths: ['auto', '*', 'auto', 'auto'],
                    headerRows: 1,
                    body: userTableBody
                },
                layout: 'headerLineOnly'
            };

            return userTableJsonString;
        };

        var getContent = function() {
            return [
                title,
                createUserList()
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
