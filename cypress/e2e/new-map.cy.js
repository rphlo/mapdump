describe("Create a new map", function () {
  it("successfully create a new map", function () {
    cy.visit("/new");
    cy.contains("GPS File");
    const fileName = "Jukola_1st_leg.gpx";
    cy.fixture(fileName).then((fileContent) => {
      cy.get('[data-testid="dropzone"]').attachFile(
        {
          fileContent,
          fileName,
          mimeType: "application/xml",
          encoding: "utf-8",
        },
        { subjectType: "drag-n-drop", events: ["dragenter", "drop"] }
      );
      cy.contains("Map Image File");
      const mapFileName =
        "Jukola_1st_leg_blank_61.45075_24.18994_61.44656_24.24721_61.42094_24.23851_61.42533_24.18156_.jpg";
      cy.fixture(mapFileName, "base64").then((mapFileContent) => {
        cy.get('[data-testid="dropzoneImg"]').attachFile(
          {
            fileContent: mapFileContent,
            fileName: mapFileName,
            mimeType: "image/png",
            encoding: "base64",
          },
          {
            subjectType: "drag-n-drop",
            force: true,
            events: ["dragenter", "drop"],
          }
        );
        cy.contains("Loading");
        cy.get('input[data-testid="nameInput"]').should(
          "have.value",
          "Jukola_1st_leg"
        );
        cy.contains("JPEG");
        cy.wait(3000);
        cy.get(".final-image");
        cy.get('[data-testid="saveBtnDisabled"]').should("be.disabled");
        cy.login();
        cy.get('[data-testid="saveBtn"]').contains("Save").click();
        cy.wait(10000);
        cy.url().should("include", "/routes/");
        cy.get('button[data-testid="actionMenuBtn"]').click();
        cy.get('a[data-testid="editNameBtn"]').click();
        cy.get('input[data-testid="editNameInput"]')
          .clear()
          .type("Jukola 2019 - First Leg")
          .blur();
        cy.wait(2000);
        cy.reload();
        cy.contains("Jukola 2019 - First Leg");
        cy.visit("/athletes/tester");
        cy.get('[data-testid="routeCount"]').contains("1 Route");
      });
    });
  });
  it("successfully create a new map from tcx", function () {
    cy.visit("/new");
    const fileName = "Jukola_1st_leg.tcx";
    cy.fixture(fileName).then((fileContent) => {
      cy.get('[data-testid="dropzone"]').attachFile(
        {
          fileContent,
          fileName,
          mimeType: "application/xml",
          encoding: "utf-8",
        },
        { subjectType: "drag-n-drop", events: ["dragenter", "drop"] }
      );
      cy.contains("Map Image File");
      const mapFileName =
        "Jukola_1st_leg_blank_61.45075_24.18994_61.44656_24.24721_61.42094_24.23851_61.42533_24.18156_.jpg";
      cy.fixture(mapFileName, "base64").then((mapFileContent) => {
        cy.get('[data-testid="dropzoneImg"]').attachFile(
          {
            fileContent: mapFileContent,
            fileName: mapFileName,
            mimeType: "image/png",
            encoding: "base64",
          },
          {
            subjectType: "drag-n-drop",
            force: true,
            events: ["dragenter", "drop"],
          }
        );
        cy.contains("Loading");
        cy.get('input[data-testid="nameInput"]').should(
          "have.value",
          "Jukola_1st_leg"
        );
        cy.contains("JPEG");
        cy.wait(3000);
        cy.get(".final-image");
      });
    });
  });
  it("successfully create a new map with coords input", function () {
    cy.visit("/new");
    const fileName = "Jukola_1st_leg.gpx";
    cy.fixture(fileName).then((fileContent) => {
      cy.get('[data-testid="dropzone"]').attachFile(
        {
          fileContent,
          fileName,
          mimeType: "application/xml",
          encoding: "utf-8",
        },
        {
          subjectType: "drag-n-drop",
          force: true,
          events: ["dragenter", "drop"],
        }
      );
      cy.contains("Map Image File");
      const mapFileName =
        "Jukola_1st_leg_blank_61.45075_24.18994_61.44656_24.24721_61.42094_24.23851_61.42533_24.18156_.jpg";
      cy.fixture(mapFileName, "base64").then((mapFileContent) => {
        cy.get('[data-testid="dropzoneImg"]').attachFile(
          {
            fileContent: mapFileContent,
            fileName: "Jukola_1st_leg_blank.jpg",
            mimeType: "image/png",
            encoding: "base64",
          },
          { subjectType: "drag-n-drop", events: ["dragenter", "drop"] }
        );
        cy.contains("Calibration");
        cy.contains("Corners Coordinates");
        cy.get("#cornersCoordsInput").type(
          "61.45075,24.18994,61.44656,24.24721,61.42094,24.23851,61.42533,24.18156"
        );
        cy.get('[data-testid="nextBtn"]').click();
        cy.wait(3000);
        cy.get('input[data-testid="nameInput"]').should(
          "have.value",
          "Jukola_1st_leg"
        );
        cy.contains("JPEG");
        cy.get(".final-image");
      });
    });
  });
  it("successfully create a new map with calibration tool", function () {
    cy.visit("/new");
    const fileName = "Jukola_1st_leg.gpx";
    cy.fixture(fileName).then((fileContent) => {
      cy.get('[data-testid="dropzone"]').attachFile(
        {
          fileContent,
          fileName: "🌓 Jukola 1st Leg.gpx",
          mimeType: "application/xml",
          encoding: "utf-8",
        },
        {
          subjectType: "drag-n-drop",
          force: true,
          events: ["dragenter", "drop"],
        }
      );
      cy.contains("Map Image File");
      const mapFileName =
        "Jukola_1st_leg_blank_61.45075_24.18994_61.44656_24.24721_61.42094_24.23851_61.42533_24.18156_.jpg";
      cy.fixture(mapFileName, "base64").then((mapFileContent) => {
        cy.get('[data-testid="dropzoneImg"]').attachFile(
          {
            fileContent: mapFileContent,
            fileName: "Jukola_1st_leg_blank.jpg",
            mimeType: "image/png",
            encoding: "base64",
          },
          { subjectType: "drag-n-drop", events: ["dragenter", "drop"] }
        );
        cy.contains("Calibration");
        cy.contains("Corners Coordinates");
        cy.get('[data-testid="to-calib-tool-link"]').click();
        cy.get("#mapRaster").click(10, 10);
        cy.get("#mapWorld").click(10, 10);
        cy.get("#mapRaster").click(200, 10);
        cy.get("#mapWorld").click(200, 10);
        cy.get("#mapRaster").click(200, 200);
        cy.get("#mapWorld").click(200, 200);
        cy.get("#mapRaster").click(10, 200);
        cy.get("#mapWorld").click(10, 200);
        cy.get('[data-testid="to-validation"]').click();
        cy.get('[data-testid="validate-button"]').click();
        cy.get('input[data-testid="nameInput"]').should(
          "have.value",
          "🌓 Jukola 1st Leg"
        );
        cy.contains("JPEG");
        cy.get(".final-image");
        cy.get('[data-testid="dl-kmz"]').click();
        cy.verifyDownload("🌓 Jukola 1st Leg_blank.kmz");
      });
    });
  });
});
