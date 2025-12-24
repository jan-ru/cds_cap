sap.ui.define([
    "demo/ui5/controller/BaseController",
    "sap/ui/model/json/JSONModel"
], function (BaseController, JSONModel) {
    "use strict";

    return BaseController.extend("demo.ui5.view.Imports", {
        onInit: function () {
            // Version Info is inherited from App View (parent) model "versionInfo"
            // Subscribe to Global SideNav Toggle
            this.getOwnerComponent().getEventBus().subscribe("demo.ui5", "toggleSideNav", this.onSideNavButtonPress, this);
        },

        onSideNavButtonPress: function () {
            var oToolPage = this.byId("toolPage"); // Fixed ID to match view
            var bSideExpanded = oToolPage.getSideExpanded();
            oToolPage.setSideExpanded(!bSideExpanded);
        },

        onItemSelect: function(oEvent) {
            var oItem = oEvent.getParameter("item");
            var sKey = oItem.getKey();
            var oNavContainer = this.byId("pageContainer");
            
            if (sKey === "version") {
                this.onVersionPress();
                return;
            }

            // Simple mapping since we currently only have one page
            if (sKey === "dataSources") {
                oNavContainer.to(this.byId("pageDataSources"));
            } else if (sKey === "preProcessing") {
                oNavContainer.to(this.byId("pagePreProcessing"));
            } else if (sKey === "tables") {
                oNavContainer.to(this.byId("pageTables"));
            } else if (sKey === "dataModel") {
                oNavContainer.to(this.byId("pageDataModel"));
            } else if (sKey === "metrics") {
                oNavContainer.to(this.byId("pageMetrics"));
            } else if (sKey === "log") {
                this._openFile("dbt.log", "log");
            }
        },

        // Refactored to be reusable
        onFilePress: function (oEvent) {
            var oItem = oEvent.getSource();
            var sFileName = oItem.getTitle();
            var sFileType = oItem.data("fileType");
            this._openFile(sFileName, sFileType);
        },

        _openFile: function(sFileName, sFileType) {
             var oNavContainer = this.byId("pageContainer");
            
            // Set viewer model
            var oViewerModel = new JSONModel({
                fileName: sFileName,
                content: "Loading...",
                type: "text", // default
                fileType: sFileType // store for back navigation context if needed
            });
            this.getView().setModel(oViewerModel, "viewer");

            // Navigate to viewer
            oNavContainer.to(this.byId("pageFileViewer"));

            // Fetch content
            var oModel = this.getView().getModel("odata");
            if (!oModel) {
                 // Fallback
                 oModel = this.getOwnerComponent().getModel("odata");
            }

            if (!oModel) {
                oViewerModel.setProperty("/content", "Error: OData model not found.");
                return;
            }
            var oBindContext = oModel.bindContext("/getFileContent(...)");
            oBindContext.setParameter("fileType", sFileType);
            oBindContext.setParameter("fileName", sFileName);

            oBindContext.execute().then(function () {
                var oContext = oBindContext.getBoundContext();
                var sResult = oContext.getObject().value; 
                try {
                    var oResultData = JSON.parse(sResult);
                    if (oResultData.error) {
                        oViewerModel.setProperty("/content", "Error: " + oResultData.error);
                    } else {
                        oViewerModel.setProperty("/content", oResultData.content);
                        // Map extension to editor type
                        var sType = oResultData.type;
                        if (sType === "js") sType = "javascript";
                        if (sType === "md") sType = "markdown";
                        if(sType === "csv") sType = "text"; 
                        if(sType === "log") sType = "text";
                        oViewerModel.setProperty("/type", sType);
                    }
                } catch (e) {
                    oViewerModel.setProperty("/content", "Error parsing response: " + sResult);
                }
            }).catch(function (oError) {
                oViewerModel.setProperty("/content", "Error fetching file: " + oError.message);
            });
        },

        onNavBackToFileList: function () {
            var oNavContainer = this.byId("pageContainer");
            var oViewerModel = this.getView().getModel("viewer");
            var sFileType = oViewerModel.getProperty("/fileType");

            // Navigate back to the correct list page based on file type
            if (sFileType === "dataSource") {
                oNavContainer.to(this.byId("pageDataSources"));
            } else if (sFileType === "staging") {
                oNavContainer.to(this.byId("pagePreProcessing"));
            } else if (sFileType === "table") {
                oNavContainer.to(this.byId("pageTables"));
            } else if (sFileType === "metrics") {
                oNavContainer.to(this.byId("pageMetrics"));
            } else {
                // Fallback default
                oNavContainer.back();
            }
        }
    });
});
