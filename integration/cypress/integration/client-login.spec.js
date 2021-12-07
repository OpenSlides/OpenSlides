describe("Login using UI", () => {
  it("Login over login-form, set cookie", () => {

    const username = "admin"
    const password = "admin"

    cy.visit("/");
    cy.wait(1000)
    cy.url().should("include", "login");
    cy.get("#mat-input-0").type(username);
    cy.get("#mat-input-1").type(`${password}{enter}`);
    cy.wait(1000)
    cy.url().should("not.include", "login");
    cy.getCookie("refreshId").should("exist");
  });
});