/// <reference types="Cypress" />

context('Login Test', () => {
    before(() => {
        cy.visit('');
    });

    beforeEach(() => {
        cy.get('.login-container input[formcontrolname=username')
            .as('user')
            .parents('.mat-form-field')
            .as('user-ff');
        cy.get('.login-container input[formcontrolname=password')
            .as('pw')
            .parents('.mat-form-field')
            .as('pw-ff');
    });

    it('redirects to login page', () => {
        cy.location('pathname').should('eq', '/login');
    });

    it('has right title', () => {
        cy.title().should('eq', 'Login - OpenSlides');
    });

    it('has fields & buttons', () => {
        cy.get('@user').should('have.value', '');
        cy.get('@pw').should('have.value', '');
        cy.contains('.forgot-password-button', 'Forgot Password?').should('be.visible');
        cy.get('.login-button').should('be.visible');
    });

    it('has right defaults', () => {
        cy.get('@user').should('be.focused');
        cy.get('@user-ff').should('not.have.class', 'mat-form-field-invalid');
        cy.get('@pw').should('not.have.class', 'mat-form-field-invalid');
        cy.get('@pw').should('have.attr', 'type', 'password');
    });

    it('adds error class on blur', () => {
        cy.focused().blur();
        cy.get('@user-ff').should('have.class', 'mat-form-field-invalid');
        cy.get('@pw').focus();
        cy.get('@pw-ff').should('not.have.class', 'mat-form-field-invalid');
        cy.focused().blur();
        cy.get('@pw-ff').should('have.class', 'mat-form-field-invalid');
    });

    it('shows error message', () => {
        cy.get('.login-container .mat-error').should('not.be.visible');
        cy.get('.login-button').click();
        cy.get('.login-container .mat-error').should('have.text', 'Error: Username or password is not correct.');
        cy.get('@user-ff').should('have.class', 'mat-form-field-invalid');
        cy.get('@pw-ff').should('have.class', 'mat-form-field-invalid');
    });

    it('can make password visible', () => {
        cy.get('@pw').should('have.attr', 'type', 'password');
        cy.contains('.mat-icon', 'visibility').click();
        cy.get('@pw').should('have.attr', 'type', 'text');
    });

    it('removes error classes', () => {
        // test (hopefully) wrong user/pw combination
        cy.get('@user').type(
            '00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
            { delay: 0 }
        );
        cy.get('@pw').type('wrong_password', { delay: 0 });
        cy.get('@user-ff').should('not.have.class', 'mat-form-field-invalid');
        cy.get('@pw-ff').should('not.have.class', 'mat-form-field-invalid');
    });

    it('rejects wrong login data', () => {
        cy.get('.login-button').click();
        cy.location('pathname').should('eq', '/login');
        cy.get('.login-container .mat-error').should('have.text', 'Error: Username or password is not correct.');
    });

    it('links to openslides.com', () => {
        cy.contains('© Copyright by OpenSlides')
            .should('have.attr', 'href', 'https://openslides.com')
            .should('be.visible');
        // somehow test if right window is opened
    });

    it('links to legal notice', () => {
        cy.contains('Legal notice')
            .should('be.visible')
            .click();
        cy.location('pathname').should('eq', '/login/legalnotice');
        cy.go('back');
    });

    it('links to privacy policy', () => {
        cy.contains('Privacy policy')
            .should('be.visible')
            .click();
        cy.location('pathname').should('eq', '/login/privacypolicy');
        cy.go('back');
    });

    it('links to reset pw page', () => {
        cy.contains('.forgot-password-button', 'Forgot Password?')
            .should('be.visible')
            .click();
        cy.location('pathname').should('eq', '/login/reset-password');
        cy.go('back'); // go back, test of back button belongs in another file
    });

    it('redirects to homepage on successful login', () => {
        // need to be valid credentials
        cy.get('@user')
            .clear()
            .type('admin');
        cy.get('@pw')
            .clear()
            .type('admin');
        cy.get('.login-button').click();
        cy.location('pathname').should('eq', '/');
    });
});
