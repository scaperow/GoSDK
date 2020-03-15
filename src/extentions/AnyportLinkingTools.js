// A custom LinkingTool that fixes the "time" (i.e. the Y coordinate)
// for both the temporaryLink and the actual newly created Link
import go from 'gojs'
var $ = go.GraphObject.make
class AnyportLinkingTools extends go.ActionTool {
    time = 0

    canStart() {
        console.log(this.diagram.lastInput)
        //this.diagram.findObjectAt()
    }

    doMouseMove() {
        //this.point = 
        //this.diagram.findObjectAt()
        console.log(this.diagram.lastInput)
    }

}


export default AnyportLinkingTools