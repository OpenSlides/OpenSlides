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
    cy.get('.login-container input[formcontrolname=username]')
        .clear()
        .type('admin');
    cy.get('.login-container input[formcontrolname=password]')
        .clear()
        .type('admin');
    cy.get('.login-button').click();
    cy.location('pathname').should('eq', '/');
    cy.get('os-overlay').should('not.be.visible');
});

const user = {"user_id":1,"guest_enabled":false,"user":{"is_present":false,"last_email_send":null,"default_password":"admin","groups_id":[2],"username":"admin","email":"admin@admin.admin","number":"","first_name":"","is_committee":false,"comment":"","gender":"","last_name":"Administrator","structure_level":"","id":1,"is_active":true,"title":"","about_me":""},"permissions":[]};

Cypress.Commands.add("startServer", () => {
    cy.server({ force404: true });
    cy.route("/assets/i18n/*.json", {})
    cy.route("/apps/core/servertime/", () => Date.now())
    cy.route("/apps/users/whoami/", user)
})
