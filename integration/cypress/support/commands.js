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
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

/**
 * Login
 */
Cypress.Commands.add("login", (username = "admin", password = "admin") => {
  cy.request({
    method: "POST",
    url: "/system/auth/login/",
    body: {
      username,
      password,
    },
  })
    .as("loginResponse")
    .then((response) => {
      Cypress.env("authToken", response.headers.authentication);
      return response;
    })
    .its("status")
    .should("eq", 200)
});

/**
 * Create models
 */
Cypress.Commands.add("os4request", (osAction, body) => {
  cy.request({
    method: "POST",
    url: "/system/action/handle_request",
    body: [
      {
        action: osAction,
        data: [
          {
            ...body,
          },
        ],
      },
    ],
  })
    .should((response) => {
      expect(response.status).to.eq(200);
    })
    .its("body")
    .should("contain", {
      success: true,
    })
    .then((body) => {
      return body.results[0][0]
    });
});

/**
 * Extend "request" with auth header
 */
Cypress.Commands.overwrite("request", (originalFn, ...options) => {
  const optionsObject = options[0];
  const token = Cypress.env("authToken");
  if (!!token && optionsObject === Object(optionsObject)) {
    optionsObject.headers = {
      authentication: token,
      ...optionsObject.headers,
    };
    return originalFn(optionsObject);
  }
  return originalFn(...options);
});
