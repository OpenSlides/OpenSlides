describe("Load client", () => {
  it("successfully loads", () => {
    cy.visit("/");
    cy.url().should("include", "/login");
    cy.contains("OpenSlides");
  });
});
