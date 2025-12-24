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
        },

        onTablePress: function (oEvent) {
            var oItem = oEvent.getSource();
            var sTableName = oItem.data("tableName");
            this._loadTableData(sTableName);
        },

        _loadTableData: function (sTableName) {
            var oNavContainer = this.byId("pageContainer");
            var oTable = this.byId("dataTable");

            // Set table viewer model
            var oTableViewerModel = new JSONModel({
                tableName: sTableName,
                items: []
            });
            this.getView().setModel(oTableViewerModel, "tableViewer");

            // Navigate to table viewer
            oNavContainer.to(this.byId("pageTableViewer"));

            // Fetch data from OData
            var oModel = this.getView().getModel("odata");
            if (!oModel) {
                oModel = this.getOwnerComponent().getModel("odata");
            }

            if (!oModel) {
                console.error("OData model not found");
                return;
            }

            // Create binding
            var oBinding = oModel.bindList("/" + sTableName);
            oBinding.requestContexts(0, 1000).then(function (aContexts) {
                if (aContexts.length === 0) {
                    oTableViewerModel.setProperty("/items", []);
                    return;
                }

                // Get data from contexts
                var aData = aContexts.map(function (oContext) {
                    return oContext.getObject();
                });

                oTableViewerModel.setProperty("/items", aData);

                // Build dynamic columns from first row
                if (aData.length > 0) {
                    this._buildTableColumns(oTable, Object.keys(aData[0]));
                }
            }.bind(this)).catch(function (oError) {
                console.error("Error loading table data:", oError);
            });
        },

        _buildTableColumns: function (oTable, aFields) {
            var sap_m = sap.ui.require("sap/m");
            
            // Clear existing columns
            oTable.removeAllColumns();

            // Create columns for each field
            aFields.forEach(function (sField) {
                var oColumn = new sap_m.Column({
                    header: new sap_m.Text({ text: sField })
                });
                oTable.addColumn(oColumn);
            });

            // Update item template
            var oTemplate = new sap_m.ColumnListItem();
            aFields.forEach(function (sField) {
                oTemplate.addCell(new sap_m.Text({
                    text: "{tableViewer>" + sField + "}"
                }));
            });
            oTable.bindItems({
                path: "tableViewer>/items",
                template: oTemplate
            });
        },

        onNavBackToTableList: function () {
            var oNavContainer = this.byId("pageContainer");
            oNavContainer.to(this.byId("pageTables"));
        }
    });
});
