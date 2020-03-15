import go from 'gojs'
import Maps from './Maps'
import { createTextBlock, makeNodeDragable, makeTextEditable, makeDataBinding, makeStyleBinding, createIconHolder } from '../helper';

let $ = go.GraphObject.make

// some parameters
var LinePrefix = 20;  // vertical starting point in document for all Messages and Activations
var LineSuffix = 30;  // vertical length beyond the last message time
var MessageSpacing = 20;  // vertical distance between Messages at different steps
var ActivityWidth = 10;  // width of each vertical activity bar
var ActivityStart = 5;  // height before start message time
var ActivityEnd = 5;  // height beyond end message time

function computeLifelineHeight(duration) {
    return LinePrefix + duration * MessageSpacing + LineSuffix;
}

// time is just an abstract small non-negative integer
// here we map between an abstract time and a vertical position
function computeActivityLocation(act, node) {
    var groupdata = node.diagram.model.findNodeDataForKey(act.group)

    if (groupdata === null) {
        return new go.Point()
    }

    // get location of Lifeline's starting point
    var grouploc = go.Point.parse(groupdata.loc)
    return new go.Point(grouploc.x, convertTimeToY(act.start) - ActivityStart)
}

function backComputeActivityLocation(loc, act) {
    act.start = convertYToTime(loc.y + ActivityStart)

    this.diagram.model.setDataProperty(act, "start", convertYToTime(loc.y + ActivityStart));
}

function computeActivityHeight(duration) {
    return ActivityStart + duration * MessageSpacing + ActivityEnd;
}

function backComputeActivityHeight(height) {
    return (height - ActivityStart - ActivityEnd) / MessageSpacing;
}

function ensureLifelineHeights(diagram) {
    // iterate over all Activities (ignore Groups)
    var arr = diagram.model.nodeDataArray;
    var max = -1;
    var i = 0;
    for (i = 0; i < arr.length; i++) {
        var act = arr[i];
        if (act.isGroup) continue;
        max = Math.max(max, act.start + act.duration);
    }
    if (max > 0) {
        // now iterate over only Groups
        for (i = 0; i < arr.length; i++) {
            var gr = arr[i];
            if (!gr.isGroup) continue;
            if (max > gr.duration) {  // this only extends, never shrinks

                diagram.model.setDataProperty(gr, "duration", max)
            }
        }
    }
}

// time is just an abstract small non-negative integer
// here we map between an abstract time and a vertical position
function convertTimeToY(t) {
    return t * MessageSpacing + LinePrefix;
}
function convertYToTime(y) {
    return (y - LinePrefix) / MessageSpacing;
}


// a custom routed Link
function MessageLink() {
    go.Link.call(this);
    this.time = 0;  // use this "time" value when this is the temporaryLink
}
go.Diagram.inherit(MessageLink, go.Link);

MessageLink.prototype.getLinkPoint = function (node, port, spot, from, ortho, othernode, otherport) {

    var p = port.getDocumentPoint(go.Spot.Center);
    //var r = port.getDocumentBounds();
    var op = otherport.getDocumentPoint(go.Spot.Center);

    var data = this.data;
    var time = data !== null ? data.time : this.time;  // if not bound, assume this has its own "time" property

    var aw = this.findActivityWidth(node, time);
    var x = (op.x > p.x ? p.x + aw / 2 : p.x - aw / 2);
    var y = convertTimeToY(time);
    return new go.Point(x, y);
};

MessageLink.prototype.findActivityWidth = function (node, time) {
    var aw = ActivityWidth;
    if (node instanceof go.Group) {
        // see if there is an Activity Node at this point -- if not, connect the link directly with the Group's lifeline
        if (!node.memberParts.any(function (mem) {
            var act = mem.data;
            return (act !== null && act.start <= time && time <= act.start + act.duration);
        })) {
            aw = 0;
        }
    }
    return aw;
};

MessageLink.prototype.getLinkDirection = function (node, port, linkpoint, spot, from, ortho, othernode, otherport) {
    var p = port.getDocumentPoint(go.Spot.Center);
    var op = otherport.getDocumentPoint(go.Spot.Center);
    var right = op.x > p.x;
    return right ? 0 : 180;
};

MessageLink.prototype.computePoints = function () {
    if (this.fromNode === this.toNode) {  // also handle a reflexive link as a simple orthogonal loop
        var data = this.data;
        var time = data !== null ? data.time : this.time;  // if not bound, assume this has its own "time" property
        var p = this.fromNode.port.getDocumentPoint(go.Spot.Center);
        var aw = this.findActivityWidth(this.fromNode, time);

        var x = p.x + aw / 2;
        var y = convertTimeToY(time);
        this.clearPoints();
        this.addPoint(new go.Point(x, y));
        this.addPoint(new go.Point(x + 50, y));
        this.addPoint(new go.Point(x + 50, y + 5));
        this.addPoint(new go.Point(x, y + 5));
        return true;
    } else {
        return go.Link.prototype.computePoints.call(this);
    }
}
// end MessageLink


// A custom LinkingTool that fixes the "time" (i.e. the Y coordinate)
// for both the temporaryLink and the actual newly created Link
function MessagingTool() {
    go.LinkingTool.call(this);
    this.temporaryLink =
        $(MessageLink,
            $(go.Shape, "Rectangle",
                { stroke: "magenta", strokeWidth: 2 }),
            $(go.Shape,
                { toArrow: "OpenTriangle", stroke: "magenta" }));
}
go.Diagram.inherit(MessagingTool, go.LinkingTool);

MessagingTool.prototype.doActivate = function () {
    go.LinkingTool.prototype.doActivate.call(this);
    var time = convertYToTime(this.diagram.firstInput.documentPoint.y);
    this.temporaryLink.time = Math.ceil(time);  // round up to an integer value
};

MessagingTool.prototype.insertLink = function (fromnode, fromport, tonode, toport) {
    var newlink = go.LinkingTool.prototype.insertLink.call(this, fromnode, fromport, tonode, toport);
    if (newlink !== null) {
        var model = this.diagram.model;
        // specify the time of the message
        var start = this.temporaryLink.time;
        var duration = 1;
        newlink.data.time = start;
        //model.setDataProperty(newlink.data, "text", "消息");
        // and create a new Activity node data in the "to" group data
        var newact = {
            category: 'Activity',
            group: newlink.data.to,
            start: start,
            duration: duration
        };
        model.addNodeData(newact);
        // now make sure all Lifelines are long enough
        ensureLifelineHeights(this.diagram);
    }
    return newlink;
};
// end MessagingTool


// A custom DraggingTool that supports dragging any number of MessageLinks up and down --
// changing their data.time value.
function MessageDraggingTool() {
    go.DraggingTool.call(this);
}
go.Diagram.inherit(MessageDraggingTool, go.DraggingTool);

// override the standard behavior to include all selected Links,
// even if not connected with any selected Nodes
MessageDraggingTool.prototype.computeEffectiveCollection = function (parts, options) {
    var result = go.DraggingTool.prototype.computeEffectiveCollection.call(this, parts, options);
    // add a dummy Node so that the user can select only Links and move them all
    result.add(new go.Node(), new go.DraggingInfo(new go.Point()));
    // normally this method removes any links not connected to selected nodes;
    // we have to add them back so that they are included in the "parts" argument to moveParts
    parts.each(function (part) {
        if (part instanceof go.Link) {
            result.add(part, new go.DraggingInfo(part.getPoint(0).copy()));
        }
    })
    return result;
}

// override to allow dragging when the selection only includes Links
MessageDraggingTool.prototype.mayMove = function () {
    return !this.diagram.isReadOnly && this.diagram.allowMove;
}

// override to move Links (which are all assumed to be MessageLinks) by
// updating their Link.data.time property so that their link routes will
// have the correct vertical position
MessageDraggingTool.prototype.moveParts = function (parts, offset, check) {
    go.DraggingTool.prototype.moveParts.call(this, parts, offset, check);
    var it = parts.iterator;
    while (it.next()) {
        if (it.key instanceof go.Link) {
            var link = it.key;
            var startY = it.value.point.y;  // DraggingInfo.point.y
            var y = startY + offset.y;  // determine new Y coordinate value for this link
            var cellY = this.gridSnapCellSize.height;
            y = Math.round(y / cellY) * cellY;  // snap to multiple of gridSnapCellSize.height
            var t = Math.max(0, convertYToTime(y));
            link.diagram.model.set(link.data, "time", t);
            link.invalidateRoute();
        }
    }
}
// end MessageDraggingTool

const DefaultModel = {
}


const Link = {
    name: 'SequenceLink',
    node: 'LINE',
    createTemplate(opts) {
        var stroke = '#333',
            toArrow = '',
            strokeDashArray = []


        return $(MessageLink,  // defined below
            {
                selectionAdorned: true,
                curviness: 0,
                relinkableFrom: true,
                relinkableTo: true,
            },
            makeTextEditable(),
            $(go.Shape, "Rectangle",
                {
                    stroke,
                    strokeWidth: 1,
                    strokeDashArray
                },
                ...makeStyleBinding('link', 'stroke', 'strokeDashArray'),
                ...makeDataBinding('stroke', 'strokeDashArray')
                //...makeDataBinding(false, 'stroke', 'strokeDashArray')
            ),
            $(go.Shape,
                {
                    fill: stroke,
                    toArrow, stroke
                },
                new go.Binding('fill', 'stroke'),
                ...makeDataBinding(false, 'stroke', 'toArrow')
            ),

            createTextBlock(this.name, null, '消息', {
                segmentIndex: 0,
                segmentOffset: new go.Point(NaN, NaN),
            })
        ),
            opts
    }
}


/**
 * Group
 */
const Sequential = {
    //node: 'SHAPE,TABLE',
    styleSetter: {
        stroke(part, value) {
            part.findObject('TABLE').defaultColumnSeparatorStroke = value
            part.findObject('TABLE').defaultRowSeparatorStroke = value
        },
        strokeDashArray(part, value) {
            part.findObject('TABLE').defaultRowSeparatorDashArray = value
            part.findObject('TABLE').defaultColumneparatorDashArray = value
        },
        strokeWidth(part, value) {
            part.findObject('TABLE').defaultColumnSeparatorStrokeWidth = value
            part.findObject('TABLE').defaultWidthSeparatorStrokeWidth = value
        },

    },
    style: { radius: 0, fill: '#f3f3f3', stroke: '#333', strokeWidth: 1, strokeDashArray: [3, 3], fontColor: '#333', fontFamily: 'arial,sans-serif', fontSize: 14, fontBold: false, fontItalic: false, isUnderline: false, isStrikethrough: false },
    allowAction: ['insertLane', 'cut', 'delete', 'paste', 'group', 'copy', 'ungroup'],

    /**
     * 
     * @return {GraphObject} 
     */
    createTemplate(opts) {
        var { fill, stroke, strokeWidth, radius, strokeDashArray } = this.style

        return $(go.Group, "Vertical",
            {
                locationSpot: go.Spot.Bottom,
                locationObjectName: "HEADER",
                minLocation: new go.Point(0, 0),
                maxLocation: new go.Point(9999, 0),
                selectionObjectName: "HEADER"
            },
            new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
            [
                makeNodeDragable('icons', ['FontIcon']),
                makeTextEditable()
            ],

            $(go.Panel, "Auto",
                { name: "HEADER" },
                $(go.Shape, "RoundedRectangle",
                    {
                        fill,
                        stroke: null,
                        parameter1: radius
                    },
                    ...makeDataBinding(false, 'fill', 'radius'),
                    new go.Binding('fill', 'isHighlighted', (isHighlighted, object) => isHighlighted ? '#FFC107' : object.part.data.fill || fill).ofObject()),
                $(go.Panel, "Vertical",
                    createIconHolder({
                        fontSize: 32
                    }),
                    createTextBlock(this.name, this.style, '参与者', {
                        margin: 5
                    })
                )
            ),
            $(go.Shape,
                {
                    figure: "LineV",
                    fill,
                    stroke,
                    strokeWidth,
                    strokeDashArray,
                    width: 1,
                    alignment: go.Spot.Center,
                    portId: "",
                    fromLinkable: true,
                    fromLinkableDuplicates: true,
                    toLinkable: true,
                    toLinkableDuplicates: true,
                    cursor: "pointer"
                },
                new go.Binding("height", "duration", computeLifelineHeight),
                [makeDataBinding(false, 'fill', 'stroke', 'strokeWidth', 'strokeDashArray')]),
            opts
        );
    }
}


/**
 * Node
 */
const Activity = {
    diagram: null,
    // style: { fill: '#fff', radius: 2, stroke: '#333', strokeDashArray: [], strokeWidth: 1, opacity: 1, width: 20, height: 40, fontColor: '#333', fontSize: 14, fontFamily: 'arial,sans-serif', fontBold: null, fontItalic: null, isUnderline: null, isStrikethrough: false },
    allowAction: ['cut', 'paste', 'group', 'copy', 'ungroup'],
    createTemplate(opts) {
        //var fill = '#fff', stroke = '#333', strokeWidth = 1, width = 80, height = 80, radius = 2, strokeDashArray = []

        return $(go.Node,
            {
                locationSpot: go.Spot.Top,
                locationObjectName: "SHAPE",
                minLocation: new go.Point(NaN, LinePrefix - ActivityStart),
                maxLocation: new go.Point(NaN, 19999),
                selectionObjectName: "SHAPE",
                resizable: true,
                resizeObjectName: "SHAPE",
                resizeAdornmentTemplate:
                    $(go.Adornment, "Spot",
                        $(go.Placeholder),
                        $(go.Shape,  // only a bottom resize handle
                            {
                                alignment: go.Spot.Bottom, cursor: "col-resize",
                                desiredSize: new go.Size(6, 6), fill: "yellow"
                            })
                    )
            },
            new go.Binding("location", "", computeActivityLocation).makeTwoWay(backComputeActivityLocation.bind(this)),

            $(go.Shape, "Rectangle",
                {
                    name: "SHAPE",
                    fill: "white", stroke: "black",
                    width: ActivityWidth,
                    // allow Activities to be resized down to 1/4 of a time unit
                    minSize: new go.Size(ActivityWidth, computeActivityHeight(0.25))
                },
                new go.Binding("height", "duration", computeActivityHeight).makeTwoWay(backComputeActivityHeight.bind(this))),
            opts
        );
    }
}

class SequenceMap extends Maps {
    name = "SEQUENCEMAP"
    allowActions = ['undo', 'redo', 'cut', 'paste', 'copy', 'ceiling', 'floor', 'lock', 'unlock', 'merge', 'split']

    getProperties() {
        this.templateMaker.resetLink(Link)
        this.templateMaker.setGroup('Sequential', Sequential)
        this.templateMaker.setNode('Activity', Activity)

        return {
            allowCopy: false,
            linkingTool: $(MessagingTool),  // defined below
            "resizingTool.isGridSnapEnabled": true,
            draggingTool: $(MessageDraggingTool),  // defined below
            "draggingTool.gridSnapCellSize": new go.Size(1, MessageSpacing / 4),
            "draggingTool.isGridSnapEnabled": true,
            // automatically extend Lifelines as Activities are moved or resized
            "SelectionMoved": () => ensureLifelineHeights(this.canvas),
            "PartResized": () => ensureLifelineHeights(this.canvas),
            "undoManager.isEnabled": true,

            ...this.toolMaker.makeMeshTemplate(),
            ...this.templateMaker.makeGroupTemplate(),
            ...this.templateMaker.makeNodeTemplates(),
            ...this.templateMaker.makeLinkTemplate(),
        }
    }

    parseModel(model) {

        return go.Model.fromJson(model || DefaultModel)
    }
}

export default SequenceMap