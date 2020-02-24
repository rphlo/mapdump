describe('The Home Page', function() {
    it('successfully loads', function() {
        cy.visit('/new')
        cy.contains('GPX File')
        const fileName = 'Jukola_1st_leg.gpx';
        cy.fixture(fileName).then(fileContent => {
            cy.get('[data-testid="dropzone"]').upload(
                { fileContent, fileName, mimeType: 'application/xml', encoding: 'utf-8' },
                { subjectType: 'drag-n-drop', events: ['dragenter', 'drop'] },
            );
            cy.contains('Map Image File')
        });
    })
})