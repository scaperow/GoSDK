import { makeDataBinding, createTextBlock } from '../helper'
import go from 'gojs'
const $ = go.GraphObject.make
const Picture = {
  name: 'picture',
  actions: ['cut', 'paste', 'group', 'copy', 'ungroup'],
  style: { figure: 'RoundedRectangle', fill: 'transparent', background: 'transparent', opacity: 1, strokeWidth: 1, stroke: 'transparent', width: 80, height: 80, fontColor: '#333', fontSize: '14px', fontBold: false, fontItalic: false, isUnderline: false, isStrikethrough: false },


  /**
   * 
   * @return {GraphObject}
   */
  createTemplate(opts) {
    let { fill, stroke, strokeWidth, width, height, figure, background, opacity } = this.style

    return $(go.Node, 'Spot',
      $(go.Panel, 'Auto',
        {
          alignment: go.Spot.Center,
          width,
          height,
          name: 'NODE',
          stretch: go.GraphObject.Fill,
          background,
        },
        new go.Binding("desiredSize", "size", go.Size.parse).makeTwoWay(go.Size.stringify),
        $(go.Shape, {
          figure,
          fill,
          stroke,
          opacity,
          strokeWidth,
        }, ...makeDataBinding(false, 'figure', 'fill', 'stroke', 'strokeWidth'))
      ),
      createTextBlock(this.name, this.style),
      opts
      //makeToolTip(),
      //makeContextMenu(actionList, this.actions)
    )
  }
}

export default { Picture }