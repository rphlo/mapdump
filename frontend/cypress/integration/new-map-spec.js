describe('Create a new map', function() {
    it('successfully create a new map', function() {
        cy.visit('/new')
        cy.contains('GPX File')
        const fileName = 'Jukola_1st_leg.gpx';
        cy.fixture(fileName).then(fileContent => {
            cy.get('[data-testid="dropzone"]').upload(
                { fileContent, fileName, mimeType: 'application/xml', encoding: 'utf-8' },
                { subjectType: 'drag-n-drop', events: ['dragenter', 'drop'] },
            );
            cy.contains('Map Image File')
            const mapFileName = 'Jukola_1st_leg_blank_61.45075_24.18994_61.44656_24.24721_61.42094_24.23851_61.42533_24.18156_.jpg'
            cy.fixture(mapFileName, 'base64').then(mapFileContent => {
                cy.get('[data-testid="dropzoneImg"]').upload(
                    { fileContent: mapFileContent, fileName: mapFileName, mimeType: 'image/png' },
                    { subjectType: 'drag-n-drop', events: ['dragenter', 'drop'] },
                );
                cy.contains('Loading')
                cy.contains('Jukola_1st_leg')
                cy.contains('Download')
                cy.wait(3000)
                cy.get('.final-image')
                cy.get('[data-testid="saveBtn"]').should('not.exist');
                cy.login()
                cy.get('[data-testid="saveBtn"]').contains('Save').click()
                cy.url().should('include', '/routes/')
            });
        });
    })
    it('successfully create a new map from tcx', function() {
        cy.visit('/new')
        cy.contains('GPX File')
        const fileName = 'Jukola_1st_leg.tcx';
        cy.fixture(fileName).then(fileContent => {
            cy.get('[data-testid="dropzone"]').upload(
                { fileContent, fileName, mimeType: 'application/xml', encoding: 'utf-8' },
                { subjectType: 'drag-n-drop', events: ['dragenter', 'drop'] },
            );
            cy.contains('Map Image File')
            const mapFileName = 'Jukola_1st_leg_blank_61.45075_24.18994_61.44656_24.24721_61.42094_24.23851_61.42533_24.18156_.jpg'
            cy.fixture(mapFileName, 'base64').then(mapFileContent => {
                cy.get('[data-testid="dropzoneImg"]').upload(
                    { fileContent: mapFileContent, fileName: mapFileName, mimeType: 'image/png' },
                    { subjectType: 'drag-n-drop', events: ['dragenter', 'drop'] },
                );
                cy.contains('Loading')
                cy.contains('Jukola_1st_leg')
                cy.contains('Download')
                cy.wait(3000)
                cy.get('.final-image')
            });
        });
    })
    it('successfully create a new map with coords input', function() {
        cy.visit('/new')
        cy.contains('GPX File')
        const fileName = 'Jukola_1st_leg.gpx';
        cy.fixture(fileName).then(fileContent => {
            cy.get('[data-testid="dropzone"]').upload(
                { fileContent, fileName, mimeType: 'application/xml', encoding: 'utf-8' },
                { subjectType: 'drag-n-drop', events: ['dragenter', 'drop'] },
            );
            cy.contains('Map Image File')
            const mapFileName = 'Jukola_1st_leg_blank_61.45075_24.18994_61.44656_24.24721_61.42094_24.23851_61.42533_24.18156_.jpg'
            cy.fixture(mapFileName, 'base64').then(mapFileContent => {
                cy.get('[data-testid="dropzoneImg"]').upload(
                    { fileContent: mapFileContent, fileName: 'Jukola_1st_leg_blank.jpg', mimeType: 'image/png' },
                    { subjectType: 'drag-n-drop', events: ['dragenter', 'drop'] },
                );
                cy.contains('Calibration')
                cy.contains('Corners Coordinates')
                cy.get('#cornersCoordsInput').type('61.45075,24.18994,61.44656,24.24721,61.42094,24.23851,61.42533,24.18156')
                cy.get('[data-testid="nextBtn"]').click()
                cy.contains('Jukola_1st_leg')
                cy.contains('Download')
                cy.get('.final-image')
            });
        });
    })
})