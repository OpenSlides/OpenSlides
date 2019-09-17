// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This is will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })

// make sure to provide valid credentials
Cypress.Commands.add('login', () => {
    cy.clearCookies();
    cy.visit('');
    cy.get('.login-container input[formcontrolname=username')
        .clear()
        .type('admin');
    cy.get('.login-container input[formcontrolname=password')
        .clear()
        .type('admin');
    cy.get('.login-button').click();
    cy.location('pathname').should('eq', '/');
    cy.get('os-overlay').should('not.be.visible');
});

Cypress.Commands.add('stayLoggedIn', () => {
    Cypress.Cookies.preserveOnce('OpenSlidesCsrfToken', 'OpenSlidesSessionID');
});
