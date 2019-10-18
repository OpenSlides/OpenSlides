// ***********************************************************
// This example support/index.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

import './commands';

// import { WebSocket as MockSocket, Server } from 'mock-socket';

// let sockets = []
// Cypress.on("window:before:load", win => {
//     // if comment this out, it magically works
//     var res = win.indexedDB.deleteDatabase("ngStorage")
//     res.onsuccess = function(event) {
//         console.log("db cleaned")
//     }

//     for (const socket in sockets) {
//         socket.close()
//     }
//     sockets = [];

//     const mockServer = new Server("ws://localhost:4200/ws/")
//     mockServer.on("connection", socket => {
//         console.log("connected")
//         sockets.push(socket);
//         socket.send(JSON.stringify({
//             type: "autoupdate",
//             content: {
//                 all_data: false,
//                 changed: {},
//                 deleted: {},
//                 from_change_id: 0,
//                 to_change_id: 1
//             }
//         }));
//         socket.on("message", data => {
//             console.log(data)
//         })
//     })
//     cy.stub(win, "WebSocket", url => new MockSocket(url))
//     console.log("onbeforeload finish", win.WebSocket);
// });

Cypress.on("window:load", win => {
})