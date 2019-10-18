/// <reference types="Cypress" />

import { WebSocket, Server } from 'mock-socket';

context('Motion Detail Test', () => {
    before(() => {
        cy.startServer();
        cy.visit('motions/new', {
            // onBeforeLoad(win) {
            //     const mockServer = new Server("ws://localhost:4200/ws/")
            //     console.log("start")
            //     mockServer.on("connection", socket => {
            //         console.log("connected", socket.handshake.query)
            //         socket.on("message", data => {
            //             console.log(data)
            //         })
            //     })
            //     cy.stub(win, "WebSocket", url => new WebSocket(url))
            // }
        });
        // not working either, stub has to be created exactly between creating of service and connect call
        // cy.window().then(win => {
        //     let service = win.ng.probe(win.getAllAngularRootElements()[0])
        //                     .injector.view.root.ngModule._providers
        //                     .find(p => p && p.constructor && p.constructor.name === 'WebsocketService');
        //     cy.stub(service, "connect", (options, retry) => {
        //         console.log("connect", options, retry);
        //     })
        // })
    });

    it('has right title', () => {
        cy.title().should('eq', 'New motion - OpenSlides');
    });


    it('can create motion', () => {
        cy.get('.toolbar-right button')
            .should('have.length', 1)
            .and('be.disabled');
        cy.get('input[formcontrolname=title]').type('a');
        cy.get("editor[formcontrolname=text] button[title='Source code']").click();
        cy.focused()
            .type('a')
            .type('{ctrl}{enter}');
        cy.get('.toolbar-right button')
            .should('not.be.disabled')
            .click();
        cy.location('pathname').should('match', /^\/motions\/\d+$/);
    });

    it('has correct state', () => {
        cy.get('os-extension-field[ng-reflect-title=State] mat-basic-chip')
            .should('have.text', ' submitted ')
            .and('have.class', 'lightblue');
    });

    it('can delete motion', () => {
        cy.contains('mat-icon', 'more_vert').click();
        cy.contains('mat-icon', 'delete').click();
        cy.get('button[ng-reflect-dialog-result=true').click();
        cy.location('pathname').should('eq', '/motions');
    });
});
