(function () {

'use strict';

angular.module('OpenSlidesApp.users.pdf', ['OpenSlidesApp.core.pdf'])

.factory('UserListContentProvider', [
    'gettextCatalog',
    'PDFLayout',
    function(gettextCatalog, PDFLayout) {

    var createInstance = function(userList, groups) {

        //use the Predefined Functions to create the title
        var title = PDFLayout.createTitle(gettextCatalog.getString("List of participants"));

        //function to generate the user list
        var createUserList = function() {
            var userJsonList = [];

            angular.forEach(userList, function (user, counter) {

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
                        style: PDFLayout.flipTableRowStyle(userJsonList.length)
                    },
                    {
                        text: user.short_name,
                        style: PDFLayout.flipTableRowStyle(userJsonList.length)
                    },
                    {
                        text: user.structure_level,
                        style: PDFLayout.flipTableRowStyle(userJsonList.length)
                    },
                    {
                        text: userGroups.join(" "),
                        style: PDFLayout.flipTableRowStyle(userJsonList.length)
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

}])

.factory('UserAccessDataListContentProvider', [
    'gettextCatalog',
    'PDFLayout',
    function(gettextCatalog, PDFLayout) {

        var createInstance = function(userList, groups, Config) {

            var creadeUserHeadLine = function(user) {
                var titleLine = [];
                titleLine.push({
                    text: user.get_short_name(),
                    style: 'userDataTitle'
                });
                if (user.structure_level) {
                    titleLine.push({
                        text: user.structure_level,
                        style: 'userDataHeading'
                    });
                }
                return titleLine;
            };

            var createAccessDataContent = function(user) {
                // wlan access data
                var columnWifi = [
                    {
                        text: gettextCatalog.getString("WLAN access data"),
                        style: 'userDataHeading'
                    },
                    {
                        text: gettextCatalog.getString("WLAN name (SSID)") + ":",
                        style: 'userDataTopic'
                    },
                    {
                        text: Config.get('users_pdf_wlan_ssid').value || '-',
                        style: 'userDataValue'
                    },
                    {
                        text: gettextCatalog.getString("WLAN password") + ":",
                        style: 'userDataTopic'
                    },
                    {
                        text: Config.get('users_pdf_wlan_password').value || '-',
                        style: 'userDataValue'
                    },
                    {
                        text: gettextCatalog.getString("WLAN encryption") + ":",
                        style: 'userDataTopic'
                    },
                    {
                        text: Config.get('users_pdf_wlan_encryption').value || '-',
                        style: 'userDataValue'
                    },
                    {
                        text: "\n"
                    }
                ];
                // wifi qr code
                if (Config.get('users_pdf_wlan_ssid').value && Config.get('users_pdf_wlan_encryption').value) {
                    var wifiQrCode = "WIFI:S:" + Config.get('users_pdf_wlan_ssid').value +
                        ";T:" + Config.get('users_pdf_wlan_encryption').value +
                        ";P:" + Config.get('users_pdf_wlan_password').value + ";;";
                    columnWifi.push(
                        {
                            qr: wifiQrCode,
                            fit: 120,
                            margin: [0, 0, 0, 8]
                        },
                        {
                            text: gettextCatalog.getString("Scan this QR code to connect to WLAN."),
                            style: 'small'
                        }
                    );
                }

                // openslides access data
                var columnOpenSlides = [
                    {
                        text: gettextCatalog.getString("OpenSlides access data"),
                        style: 'userDataHeading'
                    },
                    {
                        text: gettextCatalog.getString("Username") + ":",
                        style: 'userDataTopic'
                    },
                    {
                        text: user.username,
                        style: 'userDataValue'
                    },
                    {
                        text: gettextCatalog.getString("Initial password") + ":",
                        style: 'userDataTopic'
                    },
                    {
                        text: user.default_password,
                        style: 'userDataValue'
                    },
                    {
                        text: "URL:",
                        style: 'userDataTopic'
                    },
                    {
                        text: Config.get('users_pdf_url').value  || '-',
                        link: Config.get('users_pdf_url').value,
                        style: 'userDataValue'
                    },
                    {
                        text: "\n"
                    }
                ];
                // url qr code
                if (Config.get('users_pdf_url').value) {
                    columnOpenSlides.push(
                        {
                            qr: Config.get('users_pdf_url').value,
                            fit: 120,
                            margin: [0, 0, 0, 8]
                        },
                        {
                            text: gettextCatalog.getString("Scan this QR code to open URL."),
                            style: 'small'
                        }
                    );
                }

                var accessDataColumns = {
                    columns: [
                        columnWifi,
                        columnOpenSlides,
                    ],
                    margin: [0, 20]
                };

                return accessDataColumns;
            };

            var createWelcomeText = function() {
                return [
                    {
                        text:   Config.translate(Config.get('users_pdf_welcometitle').value),
                        style: 'userDataHeading'
                    },
                    {
                        text:   Config.translate(Config.get('users_pdf_welcometext').value),
                        style: 'userDataTopic'
                    }
                ];
            };

            var getContent = function() {
                var content = [];
                angular.forEach(userList, function (user) {
                    content.push(creadeUserHeadLine(user));
                    content.push(createAccessDataContent(user));
                    content.push(createWelcomeText());
                    content.push({
                        text: '',
                        pageBreak: 'after'
                    });
                });

                return [
                    content
                ];
            };

            return {
                getContent: getContent
            };
        };

        return {
            createInstance: createInstance
        };
    }
]);
}());
