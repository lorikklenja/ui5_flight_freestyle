sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/BusyIndicator",
    "sap/ui/export/Spreadsheet",
    "sap/m/MessageToast"
], (Controller, BusyIndicator, Spreadsheet, MessageToast) => {
    "use strict";

    return Controller.extend("sapui5flightlk.controller.Main", {
        onInit() {
            this._loadFlights();
        },

        _loadFlights() {
            const oFlightJSONModel = new sap.ui.model.json.JSONModel();
            const oDataModel = this.getOwnerComponent().getModel();
            const sPath = "/FlightLK";

            BusyIndicator.show(0);
            oDataModel.read(sPath, {
                sorters: [new sap.ui.model.Sorter("Carrid", false)],
                success: (oResponse) => {
                    oFlightJSONModel.setData(oResponse.results);
                    this.getView().setModel(oFlightJSONModel, "flightDataModel");
                    BusyIndicator.hide();
                },
                error: () => BusyIndicator.hide()
            });
        },

        onRowPress(oEvent) {
            const oSelectedItem = oEvent.getSource();
            const oContext = oSelectedItem.getBindingContext("flightDataModel");
            const sCarrid = oContext.getProperty("Carrid");

            const oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.navTo("FlightDetails", { Carrid: sCarrid });
        },

        onExport() {
            const oModel = this.getView().getModel("flightDataModel");
            const aData = oModel.getData();

            if (!aData || !aData.length) {
                MessageToast.show("No data available to export.");
                return;
            }

            const aColumns = [
                { label: "Carrier ID", property: "Carrid" },
                { label: "Carrier Name", property: "Carrname" },
                { label: "URL", property: "Url" }
            ];

            const oSettings = {
                workbook: { columns: aColumns },
                dataSource: aData,
                fileName: "Airlines.xlsx"
            };

            const oSheet = new Spreadsheet(oSettings);
            oSheet.build().then(() => {
                MessageToast.show("Excel file exported successfully!");
            }).finally(() => oSheet.destroy());
        },

        onRefresh() {
            MessageToast.show("Refreshing flight list...");
            this._loadFlights();
        }
    });
});