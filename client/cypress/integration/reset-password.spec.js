/// <reference types="Cypress" />

context('Reset Password Test', () => {
    before(() => {
        cy.clearLocalStorage();
        cy.clearCookies();
        // dumb workaround cause it somehow always redirects to /login
        cy.visit('login');
        cy.wait(1000);
        cy.get('.forgot-password-button').click({ force: true });
    });

    it('has right title', () => {
        cy.title().should('eq', 'Reset password - OpenSlides');
    });

    it('has all fields & buttons and right defaults', () => {
        cy.get('input')
            .should('have.length', 1)
            .should('be.visible')
            .should('have.value', '');
        cy.get('input')
            .parents('.mat-form-field')
            .should('not.have.class', 'mat-form-field-invalid');
        cy.get('button[type=submit]').should('have.length', 1);
        cy.get('button[type=button]').should('have.length', 1);
        cy.get('button[type=submit]')
            .should('be.visible')
            .should('be.disabled');
        cy.get('button[type=button]').should('be.visible');
    });

    it('adds error class on blur', () => {
        cy.get('input')
            .parents('.mat-form-field')
            .should('not.have.class', 'mat-form-field-invalid');
        cy.get('input')
            .focus()
            .parents('.mat-form-field')
            .should('not.have.class', 'mat-form-field-invalid');
        cy.get('input')
            .blur()
            .parents('.mat-form-field')
            .should('have.class', 'mat-form-field-invalid');
        cy.get('.mat-error').should('be.visible');
        cy.get('button[type=submit]').should('be.disabled');
    });

    it('rejects invalid mail addresses', () => {
        const invalid_emails = [
            'plainaddress',
            '#@%^%#$@#$@#.com',
            '@example.com',
            'Joe Smith <email@example.com>',
            'email.example.com',
            'email@example@example.com',
            '.email@example.com',
            'email.@example.com',
            'email..email@example.com',
            'あいうえお@example.com',
            'email@example.com (Joe Smith)',
            'email@-example.com',
            'email@[123.123.123.123]',
            'email@example..com',
            'Abc..123@example.com',
            '"email"@example.com',
            '“(),:;<>[\\]@example.com',
            'just"not"right@example.com',
            'this\\ is"really"not\\allowed@example.com',
            'much."more unusual"@example.com'
        ];
        for (const e of invalid_emails) {
            cy.get('input')
                .clear()
                .type(e, { delay: 0 })
                .parents('.mat-form-field')
                .should('have.class', 'mat-form-field-invalid');
            cy.get('button[type=submit]').should('be.disabled');
        }
    });

    it('accepts valid mail addresses', () => {
        const valid_emails = [
            'email@example',
            'email@example.com',
            'firstname.lastname@example.com',
            'email@subdomain.example.com',
            'firstname+lastname@example.com',
            'email@123.123.123.123',
            '1234567890@example.com',
            'email@example-one.com',
            '_______@example.com',
            'email@example.name',
            'email@example.museum',
            'email@example.co.jp',
            'firstname-lastname@example.com'
        ];
        for (const e of valid_emails) {
            cy.get('input')
                .clear()
                .type(e, { delay: 0 })
                .parents('.mat-form-field')
                .should('not.have.class', 'mat-form-field-invalid');
            cy.get('button[type=submit]').should('not.be.disabled');
        }
    });

    it('links to openslides.com', () => {
        cy.contains('© Copyright by OpenSlides')
            .should('have.attr', 'href', 'https://openslides.com')
            .should('be.visible');
        // TODO: somehow test if right window is opened
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

    it('links to login page', () => {
        cy.contains('button[type=button]', 'Back').click();
        cy.location('pathname').should('eq', '/login');
        cy.go('back');
    });

    it("shows dismissable error if user doesn't exist", () => {
        // 'a@a' needs to not exist
        cy.get('input')
            .clear()
            .type('a@a', { delay: 0 });
        cy.contains('button[type=submit]', 'Reset password').click();
        cy.contains('.mat-simple-snackbar span', 'Error: No users with email a@a found.').should('be.visible');
        cy.contains('.mat-simple-snackbar button span', 'OK').click();
        cy.get('.mat-simple-snackbar').should('not.exist');
    });

    it('shows success message on valid email', () => {
        // needs to be valid user email
        cy.get('input')
            .clear()
            .type('admin@admin.admin', { delay: 0 });
        cy.contains('button[type=submit]', 'Reset password').click();
        cy.location('pathname').should('eq', '/login');
        cy.contains('.mat-simple-snackbar span', 'An email with a password reset link was send!').should('be.visible');
        cy.contains('.mat-simple-snackbar button span', 'OK').click();
        cy.get('.mat-simple-snackbar').should('not.exist');
    });
});
