describe("The Home Page", function () {
  it("successfully loads", function () {
    cy.visit("/");
    cy.wait(1000);
    cy.contains("Login");
    cy.contains("Test without Registering");
    cy.contains("No routes have been yet uploaded...");
  });
});
