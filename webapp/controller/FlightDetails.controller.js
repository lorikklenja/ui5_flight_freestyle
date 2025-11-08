sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/routing/History",
    "sap/m/MessageToast",
    "sap/ui/core/BusyIndicator",
    "sap/ui/core/format/DateFormat",
    "sap/ui/export/Spreadsheet"
], (Controller, Filter, FilterOperator, History, MessageToast, BusyIndicator, DateFormat, Spreadsheet) => {
    "use strict";

    return Controller.extend("sapui5flightlk.controller.FlightDetails", {
        onInit: function () {
            const oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.getRoute("FlightDetails").attachPatternMatched(this._onObjectMatched, this);
        },

        _onObjectMatched: function (oEvent) {
            const sCarrid = oEvent.getParameter("arguments").Carrid;
            const oView = this.getView();
            const oDataModel = this.getOwnerComponent().getModel();
            const oJSONModel = new sap.ui.model.json.JSONModel();

            BusyIndicator.show(0);

            const aFilters = [new Filter("Carrid", FilterOperator.EQ, sCarrid)];

            oDataModel.read("/FlightDetailsLOR", {
                filters: aFilters,
                success: (oResponse) => {
                    const oDateFormat = DateFormat.getDateInstance({ pattern: "yyyy-MM-dd" });

                    oResponse.results.forEach((item) => {
                        if (item.Fldate) {
                            item.FldateFormatted = oDateFormat.format(new Date(item.Fldate));
                        }
                    });

                    oJSONModel.setData(oResponse.results);
                    oView.setModel(oJSONModel, "flightDetailsModel");
                    BusyIndicator.hide();
                },
                error: (oError) => {
                    console.error("Error loading details:", oError);
                    MessageToast.show("Failed to load flight details.");
                    BusyIndicator.hide();
                }
            });
        },

        onSearch: function (oEvent) {
            const sQuery = oEvent.getSource().getValue();
            const oTable = this.byId("flightDetailsTable");
            const oBinding = oTable.getBinding("items");

            if (sQuery) {
                const aFilters = [
                    new Filter({
                        filters: [
                            new Filter("PlaneType", FilterOperator.Contains, sQuery),
                            new Filter("Connid", FilterOperator.Contains, sQuery),
                            new Filter("Carrname", FilterOperator.Contains, sQuery)
                        ],
                        and: false
                    })
                ];
                oBinding.filter(aFilters);
            } else {
                oBinding.filter([]);
            }
        },

        onExport: function () {
            const oModel = this.getView().getModel("flightDetailsModel");
            const aData = oModel.getData();

            if (!aData || !aData.length) {
                MessageToast.show("No data available to export.");
                return;
            }

            const aColumns = [
                { label: "Carrier ID", property: "Carrid" },
                { label: "Connection ID", property: "Connid" },
                { label: "Date", property: "FldateFormatted" },
                { label: "Plane Type", property: "PlaneType" },
                { label: "Seats Max", property: "SeatsMax" },
                { label: "Seats Occupied", property: "SeatsOcc" },
                { label: "Price", property: "Price", type: "number", scale: 2 },
                { label: "Currency", property: "Currency" },
                { label: "Total Payment", property: "PaymentSum", type: "number", scale: 2, delimiter: true }
            ];

            const oSettings = {
                workbook: { columns: aColumns },
                dataSource: aData,
                fileName: "Flight_Details.xlsx"
            };

            const oSheet = new Spreadsheet(oSettings);
            oSheet.build().then(() => {
                MessageToast.show("Excel file exported successfully!");
            }).finally(() => {
                oSheet.destroy();
            });
        },

        onNavBack: function () {
            const oHistory = History.getInstance();
            const sPreviousHash = oHistory.getPreviousHash();

            if (sPreviousHash !== undefined) {
                window.history.go(-1);
            } else {
                this.getOwnerComponent().getRouter().navTo("RouteMain", {}, true);
            }
        },

        onNavHome: function () {
            this.getOwnerComponent().getRouter().navTo("RouteMain");
        },

        onRefresh: function () {
            const oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            const sHash = window.location.hash;
            const sCarrid = sHash.split("/").pop();

            MessageToast.show("Refreshing flight details...");
            this._onObjectMatched({ getParameter: () => ({ Carrid: sCarrid }) });
        }
    });
});
