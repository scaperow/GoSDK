import go from 'gojs'
import Maps from './Maps'

const DefaultModel = {
    "class": "go.TreeModel",
    "nodeDataArray": [
        { "key": 0, "text": "Boss", "location": "0 0", category: 'TreeFree' }
    ]
}


const $ = go.GraphObject.make

class StructMap extends Maps {
    name = "STRUCTMAP"

    allowActions = ['undo', 'redo', 'insertChild', 'insertParent', 'insertBrother', 'delete']

    getProperties() {

        return {
            layout: $(go.TreeLayout,
                {
                    treeStyle: go.TreeLayout.StyleLastParents,
                    arrangement: go.TreeLayout.ArrangementHorizontal,
                    // properties for most of the tree:
                    angle: 90,
                    layerSpacing: 35,
                    // properties for the "last parents":
                    alternateAngle: 90,
                    alternateLayerSpacing: 35,
                    alternateAlignment: go.TreeLayout.AlignmentBus,
                    alternateNodeSpacing: 20
                }),
            maxSelectionCount: 1, // users can select only one part at a time
            validCycle: go.Diagram.CycleDestinationTree, // make sure users can only create trees
            "clickCreatingTool.archetypeNodeData": { // allow double-click in background to create a new node
                name: "(new person)",
                title: "",
                comments: "",
                category: 'Personal'
            },
            "clickCreatingTool.insertPart": function (loc) {  // scroll to the new node
                var node = go.ClickCreatingTool.prototype.insertPart.call(this, loc);
                if (node !== null) {
                    this.diagram.select(node);
                    this.diagram.commandHandler.scrollToPart(node);
                    //this.diagram.commandHandler.editTextBlock(node.findObject("NAMETB"));
                }
                return node;
            },

            "undoManager.isEnabled": true,// enable undo & redo
            //...this.toolMaker.makeDraggingTreeTool(),
            ...this.toolMaker.makeMeshTemplate(),
            ...this.templateMaker.makeNodeTemplates(),
            ...this.templateMaker.makeLinkTemplate(),
        }
    }

    parseModel(model) {
        return go.Model.fromJson(model || DefaultModel)
    }
    
    created() {
        this.toolMaker.setupRule(this.canvas)
        var child,bossText = null

        this.canvas.addDiagramListener("SelectionDeleting", (e) => {
            var part = e.subject.first(); // e.subject is the myDiagram.selection collection,
            // so we'll get the first since we know we only have one selection
            this.canvas.startTransaction("clear boss");
            if (part instanceof go.Node) {
                var it = part.findTreeChildrenNodes(); // find all child nodes
                while (it.next()) { // now iterate through them and clear out the boss information
                     child = it.value;
                     bossText = child.findObject("boss"); // since the boss TextBlock is named, we can access it by name
                    if (bossText === null) return;
                    bossText.text = "";
                }
            } else if (part instanceof go.Link) {
                child = part.toNode;
                 bossText = child.findObject("boss"); // since the boss TextBlock is named, we can access it by name
                if (bossText === null) return;
                bossText.text = "";
            }

            this.canvas.commitTransaction("clear boss");
        });

        this.canvas.layout.commitNodes = () => {
            go.TreeLayout.prototype.commitNodes.call(this.canvas.layout);  // do the standard behavior
            // then go through all of the vertexes and set their corresponding node's Shape.fill
            // to a brush dependent on the TreeVertex.level value
            // this.canvas.layout.network.vertexes.each(function (v) {
            //     if (v.node) {
            //         var level = v.level % (levelColors.length);
            //         var color = levelColors[level];
            //         var shape = v.node.findObject("SHAPE");
            //         if (shape) shape.fill = $(go.Brush, "Linear", { 0: color, 1: go.Brush.lightenBy(color, 0.05), start: go.Spot.Left, end: go.Spot.Right });
            //     }
            // });
        };
    }
}

export default StructMap