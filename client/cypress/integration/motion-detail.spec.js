/// <reference types="Cypress" />

context('Motion Detail Test', () => {
    before(() => {
        cy.login();
        cy.visit('motions/new');
    });

    beforeEach(() => {
        cy.stayLoggedIn();
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
