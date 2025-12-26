sap.ui.define([
    "datasourcescustom/controller/BaseController",
    "sap/ui/model/json/JSONModel"
], function (BaseController, JSONModel) {
    "use strict";

    return BaseController.extend("datasourcescustom.controller.Main", {
        onInit: function () {
            this._fetchVersionInfo();
        },

        onFilePress: function (oEvent) {
            var sFileName = oEvent.getSource().getTitle();
            this._openFile(sFileName, "dataSource");
        },

        _openFile: function(sFileName, sFileType) {
            var oNavContainer = this.byId("navContainer");
            var oViewerModel = new JSONModel({
                fileName: sFileName,
                content: "Loading...",
                type: "text"
            });
            this.getView().setModel(oViewerModel, "viewer");
            oNavContainer.to(this.byId("detailPage"));

            var oModel = this.getOwnerComponent().getModel("odata");
            var oBindContext = oModel.bindContext("/getFileContent(...)");
            oBindContext.setParameter("fileType", sFileType);
            oBindContext.setParameter("fileName", sFileName);

            oBindContext.execute().then(function () {
                var sResult = oBindContext.getBoundContext().getObject().value;
                try {
                    var oResultData = JSON.parse(sResult);
                    if (oResultData.error) {
                        oViewerModel.setProperty("/content", "Error: " + oResultData.error);
                    } else {
                        oViewerModel.setProperty("/content", oResultData.content);
                        var sType = oResultData.type;
                        if (sType === "csv") sType = "text";
                        oViewerModel.setProperty("/type", sType);
                    }
                } catch (e) {
                    oViewerModel.setProperty("/content", "Error parsing response");
                }
            }).catch(function (oError) {
                oViewerModel.setProperty("/content", "Error: " + oError.message);
            });
        },

        onNavBack: function () {
            this.byId("navContainer").back();
        },

        _fetchVersionInfo: function() {
            var oModel = this.getOwnerComponent().getModel("odata");
            var oContext = oModel.bindContext("/getAppInfo(...)");
            
            oContext.execute().then(function() {
                var oResult = oContext.getBoundContext().getObject();
                var sValue = oResult && oResult.value ? oResult.value : oResult;
                try {
                    var oInfo = JSON.parse(sValue);
                    var oVersionModel = new JSONModel(oInfo);
                    this.getView().setModel(oVersionModel, "versionInfo");
                } catch (e) {
                    console.error("Failed to parse AppInfo", e);
                }
            }.bind(this));
        }
    });
});
