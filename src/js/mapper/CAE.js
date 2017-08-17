/**
 * @module FrontendComponentMapper
 */
import _ from 'lodash';
import Util from '../misc/Util.js';
import {mxUtils} from '../misc/mxExport.js';

/**
 * Map a wireframe model to a CAE frontend component model
 * @param {Wireframe} graph the wireframe to transform to a SyncMeta model 
 * @return {Object} the CAE frontend component model
 */
function WirefarmeToModel(graph) {
    var model = {
        attributes: {},
        nodes: {},
        edges: {}
    };
    var model = graph.model;
    var nodeTpl = '{"label":<%=labelAttr%>, "left": 4500, "top":4500, "width":100, "height":100, "zIndex": 1, "type":"<%=type%>", "attributes":<%=attributes%>}';
    var attrTpl = '{"id":"<%=id%>[<%=attrName%>]", "name":"<%=attrName%>", "value":{"id":"<%=id%>[<%=attrName%>]", "name":"<%=attrName%>", "value":<%=value%>}<% if(option) {%> ,"option":<%=value%><%}%> }';
    var edgeTpl = '{"label":<%=labelAttr%>, "source":"<%=srcId%>", "target":"<%=targetId%>", "attributes":{}, "type":"<%=type%>"}';
    var attrCompiled = _.template(attrTpl);
    var nodeCompiled = _.template(nodeTpl);
    var edgeCompiled = _.template(edgeTpl);

    //Initialize the root Widget node
    var widgetNodeId = Util.GUID();

    var label;
    var attributes = {};
    for (var i = 0; i < model.getMeta().attributes.length; i++) {
        var attr = model.getMeta().attributes[i];
        var attrName = attr.name[0] === '_' ? attr.name.slice(1) : attr.name;
        var json = attrCompiled({
            id: widgetNodeId,
            attrName: attrName,
            value: '"' + attr.value + '"',
            option: false
        });
        if (attrName === 'name')
            label = json;
        var id = Util.GUID();
        attributes[id] = JSON.parse(json);

    }
    var node = JSON.parse(nodeCompiled({
        type: 'Widget',
        labelAttr: label,
        attributes: JSON.stringify(attributes)
    }));
    model.nodes[widgetNodeId] = node;

    function mapHTMLElement(cell) {
        //Create the HTML Elements node     
        var label = attrCompiled({
            id: cell.id,
            attrName: 'label',
            value: '"' + cell.value.getAttribute('label') + '"',
            option: false
        });
        var attributes = {};
        var id = Util.GUID();
        attributes[id] = JSON.parse(attrCompiled({
            id: cell.id,
            attrName: 'type',
            value: '"' + cell.constructor.HTML_NODE_NAME + '"',
            option: true
        }));
        id = Util.GUID();
        attributes[id] = JSON.parse(attrCompiled({
            id: cell.id,
            attrName: 'id',
            value: '""',
            option: false
        }));
        id = Util.GUID();
        attributes[id] = JSON.parse(attrCompiled({
            id: cell.id,
            attrName: 'static',
            value: false,
            option: false
        }));
        id = Util.GUID();
        var shared = false;
        if (cell.overlays) {
            for (var i = 0; i < cell.overlays.length; i++) {
                var overlay = cell.overlays[i];
                if (overlay.constructor.name === 'SharedTag') {
                    shared = true;
                    break;
                }
            }
        }
        attributes[id] = JSON.parse(attrCompiled({
            id: cell.id,
            attrName: 'collaborative',
            value: shared,
            option: false
        }));
        var node = JSON.parse(nodeCompiled({
            type: 'HTML Element',
            labelAttr: label,
            attributes: JSON.stringify(attributes)
        }));
        model.nodes[cell.id] = node;

        var edgeId = Util.GUID();
        var edgeLabel = attrCompiled({
            id: edgeId,
            attrName: 'label',
            value: '""',
            option: false
        });
        var edge = JSON.parse(edgeCompiled({
            type: 'Widget to HTML Element',
            labelAttr: edgeLabel,
            srcId: widgetNodeId,
            targetId: cell.id
        }));

        if (cell.parent.id != '1') {
            var childEdgeId = Util.GUID();
            var childEdgeLabel = attrCompiled({
                id: childEdgeId,
                attrName: 'label',
                value: '""',
                option: false
            });
            var childEdge = JSON.parse(edgeCompiled({
                type: 'hasChild',
                labelAttr: childEdgeLabel,
                srcId: cell.parent.id,
                targetId: cell.id
            }));
            model.edges[childEdgeId] = childEdge;
        }
        model.edges[edgeId] = edge;
    }

    function recursion(parent) {
        for (var i = 0; i < parent.children.length; i++) {
            var cell = parent.children[i];
            mapHTMLElement(cell);
            if (cell.children)
                recursion(cell);
        }

    }
    recursion(graph.getDefaultParent());

    return model;
}

/**
 * Transform a frontend component model from syncmeta to a wireframe XML
 * @param {Object} model the front end component model 
 * @param {mxEditor} editor the editor
 * @return {XMLDocument} the wireframe model as XML
 */
function ModelToWireframe(model, editor) {

    var xml = '<WireframeMeta><WireframeModel><root><mxCell id="0"/><mxCell id="1" parent="0"/></root></WireframeModel></WireframeMeta>';
    var doc = mxUtils.parseXml(xml);
    var wireframe = doc.documentElement;
    var root = wireframe.getElementsByTagName('root')[0];
     function GetValueFormAttributes(node, name){
        for(var key in node.attributes){
            if(node.attributes.hasOwnProperty(key) && node.attributes[key].name  === name){
                return node.attributes[key].value.value;
            }
        }
        return undefined;
    }

    var childMap = {};
    for (var key in model.edges) {
        if (model.edges.hasOwnProperty(key)) {
            var edge = model.edges[key];
            if (edge.type === 'hasChild') {
                childMap[edge.target] = edge.source;
            }
        }
    }

    for (var key in model.nodes) {
        if (model.nodes.hasOwnProperty(key)) {
            var node = model.nodes[key];
            switch(node.type){
                case 'Widget':{
                    wireframe.setAttribute('height', GetValueFormAttributes(node, 'height'));
                    wireframe.setAttribute('width', GetValueFormAttributes(node, 'height'));
                    break;
                }
                case 'HTML Element':{
                    var type = GetValueFormAttributes(node, 'type');
                    var Ctor = editor.getUIComponentFromHTMLName(type);
                    if(Ctor){
                        var ui = new Ctor();
                        ui.setId(key);
                        var doc = mxUtils.parseXml(ui.toXML());
                        var uiObj = doc.documentElement;
                        
                        //geometry
                        uiObj.lastElementChild.firstChild.setAttribute('x', 0);
                        uiObj.lastElementChild.firstChild.setAttribute('y', 0);

                        //tagRoot
                        var collaborative = GetValueFormAttributes(node, 'collaborative');
                        if(collaborative){
                            var sharedTagXml = '<tagObj id="'+ key + '_'+ Util.GUID() +'" parent="#" tagType="Shared" isUnique="true"/>';
                            var tagObj = mxUtils.parseXml(sharedTagXml).documentElement;
                            uiObj.firstChild.appendChild(tagObj);
                        }

                        if(childMap.hasOwnProperty(key))
                            uiObj.lastElementChild.setAttribute('parent', childMap[key]);
                        else uiObj.lastElementChild.setAttribute('parent', '1');
                            root.appendChild(uiObj);
                    }
                    break;
                }
            }
        }
    }

   //return mxUtils.getPrettyXml(wireframe);
   return mxUtils.getXml(wireframe);
}

export {
    WirefarmeToModel,
    ModelToWireframe
};