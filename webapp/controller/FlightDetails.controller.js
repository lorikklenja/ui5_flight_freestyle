sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/routing/History",
    "sap/m/MessageToast",
    "sap/ui/core/BusyIndicator",
    "sap/ui/export/Spreadsheet",
    "sapui5flightlk/formatter/Formatter",
    "sap/m/MessageBox",
], (Controller, Filter, FilterOperator, History, MessageToast, BusyIndicator, Spreadsheet, Formatter, MessageBox) => {
    "use strict";

    return Controller.extend("sapui5flightlk.controller.FlightDetails", {
        formatter: Formatter,
        onInit: function () {
            const oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.getRoute("FlightDetails").attachPatternMatched(this._onObjectMatched, this);
        },

        _onObjectMatched: function (oEvent) {
            this._loadFlightsDetails(oEvent);
        },

        _loadFlightsDetails(oEvent) {
            const sCarrid = oEvent.getParameter("arguments").Carrid;
            const oView = this.getView();
            const oDataModel = this.getOwnerComponent().getModel();
            const oJSONModel = new sap.ui.model.json.JSONModel();

            BusyIndicator.show(0);

            oDataModel.read("/FlightLK(Carrid='" + sCarrid + "',IsActiveEntity=true)", {
                urlParameters: {
                    "$expand": "to_FlightDetailsLOR"
                },
                success: (oResponse) => {
                    oJSONModel.setData(oResponse);
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

        onDeleteDetail: function (oEvent) {
            const oDataModel = this.getOwnerComponent().getModel();
            const oItem = oEvent.getSource().getParent(); 
            const oCtx = oItem.getBindingContext("flightDetailsModel");

            const sConnid = oCtx.getProperty("Connid");
            const sCarrid = oCtx.getProperty("Carrid");
            
            var mParams = {
                Carrid : sCarrid, 
                Connid : sConnid
            };
            MessageBox.confirm("Delete this flight?", {
                onClose: (action) => {
                    if (action === "OK") {
                        oDataModel.callFunction("/deleteFlightDetail", {
                            method: "POST",
                            urlParameters: mParams,
                            success: (oResponse) => {
                                MessageToast.show("Connection Deleted Succesfully");
                                this._loadFlightsDetails();
                            },
                            error: (oError) => {
                                console.log(oError);
                            }
                        });
                    }
                }
            });
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
