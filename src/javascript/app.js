Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    logger: new Rally.technicalservices.Logger(),
    items: [
        {xtype:'container',itemId:'message_box'},
        {xtype:'container',itemId:'button_box',margin: 5},
        {xtype:'container',itemId:'display_box'},
        {xtype:'tsinfolink'}
    ],
    launch: function() {
        this.start_folder_oid = this.getSetting('start_folder_oid');
        
        this.button = this.down('#button_box').add({
            xtype:'rallybutton',
            itemId:'save_button',
            text:'Save As CSV',
            disabled: true,
            scope: this,
            handler: function() {
                this._makeCSV();
            }
        });
        this.down('#button_box').add({
            xtype:'rallybutton',
            itemId:'pick_button',
            text:'Choose Folder',
            disabled: false,
            scope: this,
            handler: function() {
                this._pickFolder();
            }
        });

        this.onSettingsUpdate(this.getSettings());
    },
    _pickFolder: function() {
        Ext.create('Rally.ui.dialog.SolrArtifactChooserDialog', {
            artifactTypes: ['testfolder'],
            autoShow: true,
            height: 250,
            title: 'Choose Test Folder',
            listeners: {
                artifactchosen: function(dialog,selected_record){
                    var start_folder_oid = selected_record.get('ObjectID');
                    this.logger.log("Selected ", selected_record.get('Name'), " - ", start_folder_oid);
                    this._setTopFolder(start_folder_oid);
                },
                scope: this
            }
         });
    },
    _setTopFolder: function(start_folder_oid) {
        this.start_folder_oid = start_folder_oid;
        
        this.updateSettingsValues({
            scope: this,
            settings: {
                start_folder_oid: start_folder_oid
            },
            success: function() {
                this.onSettingsUpdate(this.getSettings());
            }
        });
    },
    _addTree: function(container){
        container.removeAll();
        this.logger.log("Start folder OID:", this.start_folder_oid);
        
        var target_query = "( ObjectID > 0 )";
        if ( this.start_folder_oid ) {
            target_query = '( ObjectID = "' + this.start_folder_oid + '" )';
        }
        container.add({
            xtype:'insideouttree',
//            targetType:'TestCase',
//            targetQuery: '( TestFolder != "" )',
            targetType:'TestFolder',
            targetQuery: target_query,
            targetChunk: 70,
            columns: this._getColumns(),
            pruneFieldName: 'Name',
            pruneFieldValue: 'Archive',
            listeners: {
                scope:this,
                afterrender:function(){
                    this.setLoading("Loading tree...");
                },
                afterloadtargets:function() {
                    this.setLoading('Finding relatives...');
                },
                afterload:function(){
                    this.setLoading('Building tree...');
                },
                aftertree:function(tree_container,tree){
                    this.tree = tree;
                    this.tree.on('selectionchange',this._setSelected,this);
                    this.setLoading(false);
                    this.button.setDisabled(false);
                }
            }
        });
    },
    _setSelected: function(tree,selected) {
        this.selected = selected[0];
    },
    _getAvailableTreeHeight: function() {
        var body = Ext.getBody();
        var height;
        if ( body ) { height = body.getHeight(); }
        
        var body_height = this.getHeight() || height;
        this.logger.log("Body height: ", body_height);
        var available_height = body_height - 100;
        this.logger.log("Returning height: ", available_height);
        return available_height;
    },
    _getColumns: function() {
        var me = this;
        var name_renderer = function(value,meta_data,record) {
            return me._nameRenderer(value,meta_data,record);
        };
        
        var magic_renderer = function(field,value,meta_data,record){
            return me._magicRenderer(field,value,meta_data,record);
        }
        
        var columns = [
            {
                xtype: 'treecolumn',
                text: 'Item',
                dataIndex: 'Name',
                itemId: 'tree_column',
                renderer: name_renderer,
                width: 400,
                menuDisabled: true,
                otherFields: ['FormattedID','ObjectID']
            }, 
            {
                text: '# TCs Total',
                dataIndex: '__count_total',
                menuDisabled: true,
                leaves_only: true,
                calculator: function(item) {
                    if ( item.get('_type') == 'testcase' ) {
                        return 1;
                    }
                    return 0;
                }
            },
            {
                text: '# TCs Executed',
                dataIndex: '__count_executed',
                menuDisabled: true,
                leaves_only: true,
                calculator: function(item) {
                    if ( item.get('_type') == 'testcase' && item.get('LastVerdict')) {
                        return 1;
                    }
                    return 0;
                },
                otherFields: ['LastVerdict']
            },
            {
                text: '# TCs Passed',
                dataIndex: '__count_passed',
                menuDisabled: true,
                leaves_only: true,
                calculator: function(item) {
                    if ( item.get('_type') == 'testcase' && item.get('LastVerdict')) {
                        if ( item.get('LastVerdict') == "Pass") {
                            return 1;
                        }
                    }
                    return 0;
                },
                otherFields: ['LastVerdict']
            },
            {
                text: '# TCs Failed',
                dataIndex: '__count_failed',
                menuDisabled: true,
                leaves_only: true,
                calculator: function(item) {
                    if ( item.get('_type') == 'testcase' && item.get('LastVerdict')) {
                        if ( item.get('LastVerdict') == "Fail") {
                            return 1;
                        }
                    }
                    return 0;
                },
                otherFields: ['LastVerdict']
            },
            {
                text: '# TCs Blocked',
                dataIndex: '__count_blocked',
                menuDisabled: true,
                leaves_only: true,
                calculator: function(item) {
                    if ( item.get('_type') == 'testcase' && item.get('LastVerdict')) {
                        if ( item.get('LastVerdict') == "Blocked") {
                            return 1;
                        }
                    }
                    return 0;
                },
                otherFields: ['LastVerdict']
            },
            {
                text: 'Verdicts',
                dataIndex: 'LastVerdict'
            },
            {
                text: '# Defects Total',
                dataIndex: '__count_defects',
                menuDisabled: true,
                leaves_only: true,
                calculator: function(item) {
                    if ( item.get('_type') == 'defect' ) {
                        return 1;
                    }
                    return 0;
                }
            },
            {
                text: '# Defects Open',
                dataIndex: '__count_defects_open',
                menuDisabled: true,
                leaves_only: true,
                calculator: function(item) {
                    if ( item.get('_type') == 'defect' ) {
                        if (( item.get('State') == 'Submitted' ) || ( item.get('State') == 'Open' ) || ( item.get('State') == 'In Progress' )){
                            return 1;
                        }
                    }
                    return 0;
                },
                otherFields: ['State']
            },
            {
                text: '# Defects Fixed',
                dataIndex: '__count_defects_fixed',
                menuDisabled: true,
                leaves_only: true,
                calculator: function(item) {
                    if ( item.get('_type') == 'defect' ) {
                        if ( item.get('State') == 'Fixed' ) {
                            return 1;
                        }
                    }
                    return 0;
                },
                otherFields: ['State']
            },
            {
                text: '# Defects RFT',
                dataIndex: '__count_defects_rft',
                menuDisabled: true,
                leaves_only: true,
                calculator: function(item) {
                    if ( item.get('_type') == 'defect' ) {
                        if ( item.get('State') == 'Ready for Testing' ) {
                            return 1;
                        }
                    }
                    return 0;
                },
                otherFields: ['State']
            },
            {
                text: '# Defects Closed',
                dataIndex: '__count_defects_closed',
                menuDisabled: true,
                leaves_only: true,
                calculator: function(item) {
                    if ( item.get('_type') == 'defect' ) {
                        if ( item.get('State') == 'Closed' ) {
                            return 1;
                        }
                    }
                    return 0;
                },
                otherFields: ['State']
            },
            {
                text: 'State',
                dataIndex: 'State'
            }
        ];
        
        return columns;
    },
    _nameRenderer: function(value,meta_data,record) {
        var display_value = record.get('Name');
        if ( record.get('FormattedID') ) {
            var link_text = Ext.util.Format.ellipsis(record.get('FormattedID') + ": " + value, 50, true);
            var url = Rally.nav.Manager.getDetailUrl( record );
            display_value = "<a target='_blank' href='" + url + "'>" + link_text + "</a>";
        }
        return display_value;
    },
    _magicRenderer: function(field,value,meta_data,record){
        var field_name = field.get('name');
        var record_type = record.get('_type');
        var model = this.models[record_type];
        // will fail fi field is not on the record
        // (e.g., we pick accepted date, by are also showing features
        try {
            var template = Rally.ui.renderer.RendererFactory.getRenderTemplate(model.getField(field_name)) || "";
            return template.apply(record.data);
        } catch(e) {
            return ".";
        }
    },
    _loadAStoreWithAPromise: function(model_name, model_fields){
        var deferred = Ext.create('Deft.Deferred');
        
        var defectStore = Ext.create('Rally.data.wsapi.Store', {
            model: model_name,
            fetch: model_fields,
            autoLoad: true,
            listeners: {
                load: function(store, records, successful) {
                    if (successful){
                        deferred.resolve(store);
                    } else {
                        deferred.reject('Failed to load store for model [' + model_name + '] and fields [' + model_fields.join(',') + ']');
                    }
                }
            }
        });
        return deferred.promise;
    },
    _makeCSV: function() {
        var file_name = "test_folder_report.csv";
        
        var file_content = [];
        var header_line = [];
        Ext.Array.each(this._getColumns(), function(field){
            header_line.push(field.text);
        });
        file_content.push(header_line.join(','));
        
        var store = this.tree.getStore();
        
        this.logger.log("tree store", store);
        var root = store.getRootNode();
        
        if ( this.selected ) { 
            root = this.selected;
        }
        
        this.logger.log('root',root);
        
        var csv = this._getCSVFromNode(root,this._getColumns());
        
        file_content.push(csv);
        
        var blob = new Blob([file_content.join("\r\n")],{type:'text/csv;charset=utf-8'});
        saveAs(blob,file_name);
    },
    _getCSVFromNode: function(node,columns){
        var csv = [];
        Ext.Array.each(columns,function(column){
            var index = column.dataIndex;
            csv.push(node.data[index]);
        });
        
        var csv_string = csv.join('","');
        var csv_string = '"' + csv_string + '"\r\n';

        Ext.Array.each(node.childNodes,function(child_node){
            csv_string += this._getCSVFromNode(child_node,columns);
        },this);
        return csv_string;
    },
    
    isExternal: function(){
      return typeof(this.getAppId()) == 'undefined';
    },
    //onSettingsUpdate:  Override
    onSettingsUpdate: function (settings){
        //Build and save column settings...this means that we need to get the display names and multi-list
        this.logger.log('onSettingsUpdate',settings);
        
        var type = this.getSetting('type');
        this._addTree(this.down('#display_box'));
    }
});