Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    logger: new Rally.technicalservices.Logger(),
    items: [
        {xtype:'container',itemId:'message_box'},
        {xtype:'container',itemId:'display_box'},
        {xtype:'tsinfolink'}
    ],
    launch: function() {
        this._addTree(this.down('#display_box'));
    },
    _addTree: function(container){
        container.removeAll();
        container.add({
            xtype:'insideouttree',
            targetType:'TestCase',
            targetQuery: '( TestFolder != "" )',
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
                aftertree:function(){
                    this.setLoading(false);
                }
            }
        });
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
    }
});