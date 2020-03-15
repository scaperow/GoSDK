import go from 'gojs'

// These parameters need to be set before defining the templates.
var MINLENGTH = 200;  // this controls the minimum length of any swimlane
var MINBREADTH = 20;  // this controls the minimum breadth of any non-collapsed swimlane

// some shared functions

// this may be called to force the lanes to be laid out again
function relayoutLanes(canvas) {
    canvas.nodes.each(function (lane) {
        if (lane instanceof go.Gropu && (lane.category === 'horizontalLane' || lane.category === 'verticalLane')) {
            lane.layout.isValidLayout = false;  // force it to be invalid
        }
    });

    canvas.layoutDiagram();
}

// this is called after nodes have been moved or lanes resized, to layout all of the Pool Groups again
function relayoutDiagram(canvas) {
    canvas.layout.invalidateLayout();
    canvas.findTopLevelGroups().each((g) => {
        if (g.category === "verticalPool" || g.category === 'horizontalPool') {
            g.layout.invalidateLayout();
        }
    })

    canvas.layoutDiagram();
}

// compute the minimum size of a Pool Group needed to hold all of the Lane Groups
function computeMinPoolSize(pool, direction) {
    // assert(pool instanceof go.Group && pool.category === "Pool");
    var len = MINLENGTH;
    pool.memberParts.each((lane) => {
        // pools ought to only contain lanes, not plain Nodes
        if (!(lane instanceof go.Group)) return;
        var holder = lane.placeholder;
        if (holder !== null) {
            var sz = holder.actualBounds;
            if (direction === 'Horizontal') {
                len = Math.max(len, sz.width);
            } else {
                len = Math.max(len, sz.height);
            }
        }
    });

    if (direction === 'Horizontal') {
        return new go.Size(len, NaN);
    } else {
        return new go.Size(NaN, len);
    }
}

// compute the minimum size for a particular Lane Group
function computeLaneSize(lane, direction) {
    // assert(lane instanceof go.Group && lane.category !== "Pool");
    var sz = computeMinLaneSize(lane, direction);
    var holder = null
    var hdr = null
    var hsz = null

    if (direction === 'Horizontal') {
        if (lane.isSubGraphExpanded) {
            lane.placeholder;
            if (holder !== null) {
                hsz = holder.actualBounds;
                sz.height = Math.max(sz.height, hsz.height);
            }
        }
        // minimum breadth needs to be big enough to hold the header
        hdr = lane.findObject("HEADER");
        if (hdr !== null) sz.height = Math.max(sz.height, hdr.actualBounds.height);
        return sz;
    } else {
        if (lane.isSubGraphExpanded) {
            lane.placeholder;
            if (holder !== null) {
                hsz = holder.actualBounds;
                sz.width = Math.max(sz.width, hsz.width);
            }
        }
        // minimum breadth needs to be big enough to hold the header
        hdr = lane.findObject("HEADER");
        if (hdr !== null) sz.width = Math.max(sz.width, hdr.actualBounds.width);
        return sz;
    }
}

// determine the minimum size of a Lane Group, even if collapsed
function computeMinLaneSize(lane, direction) {
    if (direction === 'Horizontal') {
        if (!lane.isSubGraphExpanded) return new go.Size(MINLENGTH, 1);
        return new go.Size(MINLENGTH, MINBREADTH);
    } else {
        if (!lane.isSubGraphExpanded) return new go.Size(1, MINLENGTH);
        return new go.Size(MINBREADTH, MINLENGTH);
    }
}


// end LaneResizingTool class


// define a custom grid layout that makes sure the length of each lane is the same
// and that each lane is broad enough to hold its subgraph
function PoolLayout() {
    go.GridLayout.call(this);
    this._direction = 'Horizontal'
    this.cellSize = new go.Size(1, 1);

    this.isRealtime = false;  // don't continuously layout while dragging
    this.alignment = go.GridLayout.Position;

}
go.Diagram.inherit(PoolLayout, go.GridLayout);

PoolLayout.prototype.doLayout = function (coll) {
    var diagram = this.diagram;
    if (diagram === null) return;
    diagram.startTransaction("PoolLayout");
    var pool = this.group;
    if (pool !== null && pool.category === "verticalPool" || pool.category === 'horizontalPool') {
        // make sure all of the Group Shapes are big enough
        var minsize = computeMinPoolSize(pool, this.direction);
        pool.memberParts.each((lane) => {
            if (lane instanceof go.Group && (lane.category !== "verticalPool" || lane.category !== "horizontalPool")) {
                var shape = lane.resizeObject;
                if (shape !== null) {  // change the desiredSize to be big enough in both directions
                    if (this.direction === 'Horizontal') {
                        var sz = computeLaneSize(lane);
                        shape.width = (isNaN(shape.width) ? minsize.width : Math.max(shape.width, minsize.width));
                        shape.height = (!isNaN(shape.height)) ? Math.max(shape.height, sz.height) : sz.height;
                        var cell = lane.resizeCellSize;
                        if (!isNaN(shape.width) && !isNaN(cell.width) && cell.width > 0) shape.width = Math.ceil(shape.width / cell.width) * cell.width;
                        if (!isNaN(shape.height) && !isNaN(cell.height) && cell.height > 0) shape.height = Math.ceil(shape.height / cell.height) * cell.height;
                    } else {
                        sz = computeLaneSize(lane);
                        shape.width = (!isNaN(shape.width)) ? Math.max(shape.width, sz.width) : sz.width;
                        shape.height = (isNaN(shape.height) ? minsize.height : Math.max(shape.height, minsize.height));
                        cell = lane.resizeCellSize;
                        if (!isNaN(shape.width) && !isNaN(cell.width) && cell.width > 0) shape.width = Math.ceil(shape.width / cell.width) * cell.width;
                        if (!isNaN(shape.height) && !isNaN(cell.height) && cell.height > 0) shape.height = Math.ceil(shape.height / cell.height) * cell.height;
                    }
                }
            }
        });
    }
    // now do all of the usual stuff, according to whatever properties have been set on this GridLayout
    go.GridLayout.prototype.doLayout.call(this, coll);
    diagram.commitTransaction("PoolLayout");
};


Object.defineProperty(PoolLayout.prototype, "direction", {
    get: function () { return this._direction; },
    set: function (val) {
        if (val === 'Horizontal') {
            this.wrappingColumn = 1;
            this.wrappingWidth = Infinity;
        } else {
            this.wrappingColumn = Infinity;
            this.wrappingWidth = Infinity;
        }

        // This sorts based on the location of each Group.
        // This is useful when Groups can be moved up and down in order to change their order.
        this.comparer = (a, b) => {
            if (val === 'Horizontal') {
                var ay = a.location.y;
                var by = b.location.y;
                if (isNaN(ay) || isNaN(by)) return 0;
                if (ay < by) return -1;
                if (ay > by) return 1;
                return 0;
            } else {
                var ax = a.location.x;
                var bx = b.location.x;
                if (isNaN(ax) || isNaN(bx)) return 0;
                if (ax < bx) return -1;
                if (ax > bx) return 1;
                return 0;
            }
        };

        if (this._direction !== (val)) {
            this._direction = val;
            this.invalidateLayout();
        }
    }
});

export { PoolLayout, computeLaneSize, computeMinLaneSize, computeMinPoolSize, relayoutLanes, relayoutDiagram }