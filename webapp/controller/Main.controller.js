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

        onAddNewRecord: function () {
            if (!this.oDialog) {
                this.loadFragment({
                    name: "sapui5flightlk.fragments.CreateAirline",
                }).then(
                    function (oDialog) {
                        this.oDialog = oDialog;
                        this.oDialog.open();
                    }.bind(this)
                );
            } else {
                this.oDialog.open();
            }
        },

        onCancelRecord: function () {
            this.oDialog.close();
        },

        onCreateNewRecord: function () {
            var carrid = this.getView().byId("carrIDInput").getValue();
            var carrname = this.getView().byId("carrNameInput").getValue();
            var currcode = this.getView().byId("currCodeInput").getValue();
            var url = this.getView().byId("URLInput").getValue();

            var mParams = {
                Carrid : carrid, 
                Carrname : carrname, 
                Currcode : currcode, 
                Url : url
            };

            const oDataModel = this.getOwnerComponent().getModel();
            BusyIndicator.show(0);

            oDataModel.callFunction("/create_airline", {
                method: "POST",
                urlParameters: mParams,
                success: (oResponse) => {
                    MessageToast.show("Flight Created Succesfully");
                    this.oDialog.close();
                    this._loadFlights();
                },
                error: (oError) => {
                    console.log(oError);
                }
            });
        }
    });
});