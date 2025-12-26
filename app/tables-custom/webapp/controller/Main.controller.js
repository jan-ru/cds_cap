sap.ui.define(["shared/controller/BaseController","sap/ui/model/json/JSONModel","sap/m/Column","sap/m/Text","sap/m/ColumnListItem"], function (BaseController, JSONModel, Column, Text, ColumnListItem) {
    "use strict";
    return BaseController.extend("tablescustom.controller.Main", {
        onInit: function () {
            this._fetchVersionInfo();
        },
        onTablePress: function (oEvent) {
            var sTableName = oEvent.getSource().getTitle();
            this._loadTableData(sTableName);
        },
        _loadTableData: function (sTableName) {
            var oNavContainer = this.byId("navContainer");
            var oTable = this.byId("dataTable");
            var oTableViewerModel = new JSONModel({ tableName: sTableName, items: [] });
            this.getView().setModel(oTableViewerModel, "tableViewer");
            oNavContainer.to(this.byId("tablePage"));
            var oModel = this.getOwnerComponent().getModel("odata");
            var oBinding = oModel.bindList("/" + sTableName);
            oBinding.requestContexts(0, 1000).then(function (aContexts) {
                var aData = aContexts.map(function (oContext) { return oContext.getObject(); });
                oTableViewerModel.setProperty("/items", aData);
                if (aData.length > 0) {
                    this._buildTableColumns(oTable, Object.keys(aData[0]));
                }
            }.bind(this));
        },
        _buildTableColumns: function (oTable, aFields) {
            oTable.removeAllColumns();
            aFields.forEach(function (sField) {
                oTable.addColumn(new Column({ header: new Text({ text: sField }) }));
            });
            var oTemplate = new ColumnListItem();
            aFields.forEach(function (sField) {
                oTemplate.addCell(new Text({ text: "{tableViewer>" + sField + "}" }));
            });
            oTable.bindItems({ path: "tableViewer>/items", template: oTemplate });
        },
        onNavBack: function () {
            this.byId("navContainer").back();
        },
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
