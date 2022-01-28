describe('Update a committee', () => {
  let committeeName;
  let committeeId;

  beforeEach(() => {
    cy.login();
    committeeName = `Cypress ${Date.now().toString()}`;
    const committeeData = {
      organization_id: 1,
      name: committeeName,
      user_$can_manage_management_level: [1],
    };
    cy.os4request('committee.create', committeeData).then((res) => {
      committeeId = res.id;
    });
    cy.visit('/committees/');
  });

  it('Has new Committee', () => {
    cy.visit(`/committees/${committeeId}`);
    cy.url().should('include', committeeId);
    cy.get('h1').contains(committeeName);
  });

  /**
   * Some bugs
   */
  // it("Can just update a new Committee", () => {
  //   cy.visit(`/committees/${committeeId}/edit-committee`);
  //   cy.url().should("include", `${committeeId}/edit-committee`);
  //   cy.get(".title-slot").contains("Edit committee");
  //   cy.get("#mat-input-0").type("edit");

  //   // cy.intercept({
  //   //   method: "POST",
  //   //   url: "/system/action/handle_request",
  //   // }).as("au");
  //   // cy.wait("@au");
  //   cy.get("form").submit();

  //   cy.url().should("not.include", `edit-committee`);
  // });
});
