sap.ui.define([
    "shared/controller/BaseController",
    "sap/ui/model/json/JSONModel"
], function (BaseController, JSONModel) {
    "use strict";

    return BaseController.extend("logcustom.controller.Main", {
        onInit: function () {
            this._loadLog();
        },

        _loadLog: function () {
            var oLogModel = new JSONModel({
                content: "Loading log file..."
            });
            this.getView().setModel(oLogModel, "log");

            var oModel = this.getOwnerComponent().getModel("odata");
            var oBindContext = oModel.bindContext("/getFileContent(...)");
            oBindContext.setParameter("fileType", "log");
            oBindContext.setParameter("fileName", "dbt.log");

            oBindContext.execute().then(function () {
                var oContext = oBindContext.getBoundContext();
                var sResult = oContext.getObject().value;
                try {
                    var oResultData = JSON.parse(sResult);
                    if (oResultData.error) {
                        oLogModel.setProperty("/content", "Error: " + oResultData.error);
                    } else {
                        oLogModel.setProperty("/content", oResultData.content);
                    }
                } catch (e) {
                    oLogModel.setProperty("/content", "Error parsing log data: " + e.message);
                }
            }.bind(this)).catch(function (oError) {
                oLogModel.setProperty("/content", "Error loading log: " + oError.message);
            });
        }
    });
});
