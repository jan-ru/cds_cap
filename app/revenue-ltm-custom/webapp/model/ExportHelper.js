sap.ui.define([
    "sap/ui/export/Spreadsheet"
], function (Spreadsheet) {
    "use strict";

    return {
        export: function(oSettings, oTable) {
            return new Spreadsheet(oSettings).build().finally(function() {
                if (oTable) {
                    oTable.setBusy(false);
                }
            });
        }
    };
});
