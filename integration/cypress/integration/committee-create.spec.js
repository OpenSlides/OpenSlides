/**
 * Some bugs
 */
// describe("Create a new committee", () => {
//   beforeEach(() => {
//     cy.login();
//     cy.visit("/committees");
//   });

//   it("Creates a committee", () => {
//     cy.visit("/committees/create");
//     const committeeName = `Cypress Committee ${Date.now().toString()}`;
//     cy.get("#mat-input-0").type(committeeName);

//     cy.intercept({
//       method: "POST",
//       url: "/system/action/handle_request",
//     }).as("handle_request");

//     cy.get("form").submit();
//     cy.wait("@handle_request");

//     cy.url().should("not.include", "create");
//     // only on clean db
//     //cy.contains(committeeName);
//   });
// });
