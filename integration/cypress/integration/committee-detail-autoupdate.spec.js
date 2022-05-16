describe("Get autoupdates for committees detail view", () => {
	let committeeName;
	let committeeId;

	beforeEach(() => {
		cy.login();
		committeeName = `Cypress ${Date.now().toString()}`;
		const committeeData = {
			organization_id: 1,
			name: committeeName,
			user_$_management_level: { can_manage: [1] },
		};
		cy.os4request("committee.create", committeeData).then((res) => {
			committeeId = res.id;
		});
	});

	it("Receives a name change", () => {
		// cy.visit(`/committees/${committeeId}`);
		// cy.contains(committeeName);
		// const updatedName = committeeName + "update";
		// const committeeData = {
		//   id: committeeId,
		//   name: updatedName,
		// };
		// cy.os4request("committee.update", committeeData).then(() => {
		//   cy.contains(updatedName);
		// });
	});
});
