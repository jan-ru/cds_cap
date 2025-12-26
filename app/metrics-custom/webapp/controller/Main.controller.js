sap.ui.define(["shared/controller/BaseController","sap/ui/model/json/JSONModel"], function (BaseController, JSONModel) {
    "use strict";
    return BaseController.extend("metricscustom.controller.Main", {
        onInit: function () { this._fetchVersionInfo(); },
        onFilePress: function (oEvent) { this._openFile(oEvent.getSource().getTitle(), "metrics"); },
        _openFile: function(sFileName, sFileType) {
            var oNavContainer = this.byId("navContainer");
            var oViewerModel = new JSONModel({ fileName: sFileName, content: "Loading...", type: "text" });
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
                    oViewerModel.setProperty("/content", oResultData.error ? "Error: " + oResultData.error : oResultData.content);
                    oViewerModel.setProperty("/type", oResultData.type === "js" ? "javascript" : oResultData.type);
                } catch (e) {
                    oViewerModel.setProperty("/content", "Error parsing response");
                }
            }).catch(function (oError) {
                oViewerModel.setProperty("/content", "Error: " + oError.message);
            });
        },
        onNavBack: function () { this.byId("navContainer").back(); },
        _fetchVersionInfo: function() {
            var oModel = this.getOwnerComponent().getModel("odata");
            var oContext = oModel.bindContext("/getAppInfo(...)");
            oContext.execute().then(function() {
                var sValue = oContext.getBoundContext().getObject().value;
                this.getView().setModel(new JSONModel(JSON.parse(sValue)), "versionInfo");
            }.bind(this));
        }
    });
});
