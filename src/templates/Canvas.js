import { makeDataBinding, makeStyleBinding, createTextBlock } from '../helper'

import go from 'gojs'

const $ = go.GraphObject.make

const ColorCanvas = {
  name: 'colorCanvas',
  style: {
    background: 'transparent',
    fill: 'transparent',
    opacity: 1,
    width: 40,
    height: 40,
    fontColor: '#333',
    fontFamily: 'arial,sans-serif',
    fontSize: 14,
    fontBold: false,
    fontItalic: false,
    isUnderline: false,
    isStrikethrough: false
  },
  actions: ['cut', 'delete', 'paste', 'group', 'copy', 'ungroup'],

  /**
   * 
   * @return {GraphObject}
   */
  createTemplate(opts) {
    var background = 'transparent', opacity = 1, width = 40, height = 40

    return $(go.Node, 'Spot',
      $(go.Panel, "Vertical",
        $(go.Panel, "Viewbox",
          {
            background,
            name: 'NODE',
            width,
            height,
          },
          new go.Binding("desiredSize", "size", go.Size.parse).makeTwoWay(go.Size.stringify),
          $(go.Panel,
            {
              width: 1024,
              height: 1024,
              itemTemplate:
                $(go.Panel,
                  $(go.Shape,
                    {
                      name: 'NODE',
                      opacity: opacity
                    },
                    ...makeStyleBinding('canvas', ['opacity', 'fill']),
                    ...makeDataBinding(true, 'opacity', 'fill'),
                    ...makeDataBinding(false, 'geometryString')
                  )
                )
            }
          ))
      ),
      createTextBlock('canvas', 'text'),
      opts
    )

  }
}

const MonoCanvas = {
  name: 'monoCanvas',
  style: {
    background: 'transparent',
    fill: 'transparent',
    opacity: 1,
    width: 40,
    height: 40,
    fontColor: '#333',
    fontFamily: 'arial,sans-serif',
    fontSize: 14,
    fontBold: false,
    fontItalic: false,
    isUnderline: false,
    isStrikethrough: false
  },
  actions: ['cut', 'delete', 'paste', 'group', 'copy', 'ungroup'],

  /**
   * 
   * @return {GraphObject}
   */
  createTemplate(opts) {
    var fill = 'transparent', stroke = '#666', strokeWidth = 0, opacity = 1, width = 80, height = 80
    return $(go.Node, "Vertical",
      $(go.Panel, "Viewbox",
        {
          name: 'NODE',
          width,
          height,
        },
        new go.Binding("desiredSize", "size", go.Size.parse).makeTwoWay(go.Size.stringify),
        $(go.Panel,
          {
            width: 1024,
            height: 1024,
            itemTemplate:
              $(go.Panel,
                $(go.Shape,
                  {
                    name: 'NODE',
                    opacity,
                    stroke,
                    strokeWidth,
                    fill
                  },
                  ...makeStyleBinding('canvas', ['opacity', 'fill']),
                  ...makeDataBinding(true, 'opacity', 'fill'),
                  ...makeDataBinding(false, 'geometryString')
                )
              )
          }
        )),
      createTextBlock('canvas'),
      opts
    )

  }
}

export default { ColorCanvas, MonoCanvas }