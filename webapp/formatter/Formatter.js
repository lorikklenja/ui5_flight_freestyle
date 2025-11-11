sap.ui.define([

], function () {
    "use strict";
    return {
        formatDate: function (date) {
            if (!date) {
                return "";
            }

            var date = new Date(date);

            var day = String(date.getDate()).padStart(2, "0");
            var month = String(date.getMonth() + 1).padStart(2, "0");
            var year = date.getFullYear();

            return day + "." + month + "." + year;
        },

        getCarrierLogo: function (sCarrid) {
            switch (sCarrid) {
                case "LH":
                    return "/img/lufthansa.png";
                case "AB":
                    return "/img/airberlin.png";
                default:
                    return "/img/default_logo.png";
            }
        }
    };
});