import go from 'gojs'
import _ from 'lodash'
import TextEditingTool from './extentions/TextEditor'
import TemplateTools from './templateTools'
import TemplateMap from './templateMaps'
import Commander from './extentions/Commander'
import Color from 'color'

const Colors = {
  rootProspect: '#333',
  rootBackground: '#fff',
  shapeProspect: '#F2F2F2',
  shapeBackground: '#02A2A0',
  connection: '#F9AF18',
  lightingProspect: '#FFFFFF',
  lightingBackground: '#F9AF18',
  transparentProspect: '#02A2A0'
}
let $ = go.GraphObject.make

/**
 * 将 style 于 setting 重复样式写入到新的样式之中,并返回新的样式
 * @param {*} styleObject 
 * @param {*} setting
 * @returns {*} new style Object
 */
const mixinSettingToStyle = function (styleObject, setting) {
  var result = _.clone(styleObject)
  let { meshColor, ruleColor } = setting
  let { Root: root } = result

  if (!_.isEmpty(meshColor)) {
    _.set(root, 'meshColor', meshColor)
  }

  if (!_.isEmpty(ruleColor)) {
    _.set(root, 'ruleColor', ruleColor)
  }

  return result
}

/**
   * 将 css style object 直接应用于 canvas 对应的 div 之上
   * @param {*} key 
   * @param {*} style 
   */
const setCanvasWrapperStyle = function (canvas, key, style) {
  canvas.div.style[key] = style
}

class Maps {


  setting = Maps.defaultSetting
  style = Maps.defaultStyle
  canvas = null
  model = null
  toolMaker = null
  templateMaker = null
  modelChangedListener = []
  mapChangeListener = []
  settingChangeListener = []
  styleChangeListener = []

  constructor(style, setting, model) {
    //this.changeModel(model)
    if (setting) {
      this.setting = setting
    }

    if (style) {
      this.style = style
    }

    this.model = model
  }

  /**
   * 挂载
   * @param {*} elementId 
   */
  mount (elementId) {
    this.canvas = $(go.Diagram, elementId)
    this.canvas.commandHandler = new Commander()
    this.canvas.commandHandler.arrowKeyBehavior = 'select'
    this.canvas.toolManager.textEditingTool.defaultTextEditor = TextEditingTool

    this.toolMaker = new TemplateTools(this.style, this.canvas)
    this.templateMaker = new TemplateMap(this.style, this.canvas)

    this.applyStyle(this.style)
    this.applySetting(this.setting)

    TemplateMap.registeShortcuts(this.canvas)
  }

  /**
   * 绑定事件，一般由子类来调用
   */
  bindEvents () {
    this.canvas.addModelChangedListener((event) => { this.onModelChange(event) })
  }


  /**
   * 循环选中
   * @param {*} callback 
   * @param {*} onFinish 
   */
  loopSelection (callback, onFinish) {
    var it = this.canvas.selection.iterator
    while (it.next()) {
      callback.call(this, it.value, it)
    }

    if (onFinish) {
      onFinish()
    }
  }


  onModelChange (event) {
    if (event.isTransactionFinished) {
      var model = this.canvas.model.toJSON()

      if (!_.isEqual(model, this.model)) {
        this.modelChangedListener.forEach(listener => listener(event, model))
        this.model = model
      }
    }

  }

  onCanvasChange (event) {

  }

  changeStyle (style) {
    if (style && style !== this.style) {
      this.style = style

      this.toolMaker.changeStyle(style, this.canvas)
      this.templateMaker.changeStyle(style, this.canvas)
    }
  }

  addMapListener (name, listener) {
    this.canvas.addDiagramListener(name, listener)
  }

  addModelListener (listener) {
    this.modelChangedListener.push(listener)
  }

  addSettingListener (listener) {
    this.settingChangeListener.push(listener)
  }

  addStyleListener (listener) {
    this.styleChangeListener.push(listener)
  }

  /**
   * 应用尺寸和方向
   * @param {*} param0 
   */
  applySizeDirection ({ direction, width, height, size }) {
    var d = direction || this.setting.direction
    var w = width || this.setting.width
    var h = height || this.setting.height

    if (!_.isEmpty(w) && !_.isEmpty(h)) {
      var offset = parseInt(w) - parseInt(h)
      var s = size || this.setting.size

      if (offset !== 0) {
        switch (d) {
          case 'H':
            if (offset > 0) {
              this.applySize(w, h)
            } else {
              this.applySize(h, w)
            }

            break;

          case 'V':
            if (offset > 0) {
              this.applySize(h, w)
            } else {
              this.applySize(w, h)
            }

            break;
        }
      }
    }
  }

  /**
   * 应用尺寸
   * @param {*} param0 
   */
  applySize ({ width, height }) {
    setCanvasWrapperStyle(this.canvas, 'width', width)
    setCanvasWrapperStyle(this.canvas, 'height', height)
  }

  applySetting (setting) {
    let { showMesh, showRule, width, height, direction } = setting


    if (showMesh === true) {
      this.toolMaker.setupMesh(this.canvas)
    } else if (showMesh === false) {
      this.toolMaker.unsetupMesh(this.canvas)
    }

    if (showRule === true) {
      let { width, height } = setting

      if (!width) {
        width = this.canvas.div.offsetWidth
      }

      if (!height) {
        height = this.canvas.div.offsetHeight
      }

      this.toolMaker.setupRule(this.canvas, width, height)
    } else if (showRule === false) {
      this.toolMaker.unsetupRule(this.canvas)
    }

    if (!_.isEmpty(direction)) {
      this.applySizeDirection(setting)
    }

    if (!_.isEmpty(width) && !_.isEmpty(height)) {
      this.applySize(setting)
    }

    this.applyStyle(this.style)
  }

  /**
   * 改变设置
   * @param {*} changes
   */
  changeSetting (changes) {
    this.setting = {
      ...this.setting,
      ...changes
    }

    this.applySetting(this.setting)
    this.settingChangeListener.forEach((trigger) => trigger(this.setting))
  }

  changeCustomStyle () {

  }

  /**
   * 改变样式对象
   * @param {*} styleObject 
   */
  changeStyle (styleObject) {
    this.style = styleObject
    this.applyStyle(styleObject)
    this.styleChangeListener.forEach((trigger) => trigger(this.style))
  }

  /**
   * 应用样式对象
   * @param {*} styleObject 
   */
  applyStyle (styleObject) {
    styleObject = mixinSettingToStyle(styleObject, this.setting)

    var rootStyle = _.get(styleObject, 'Root') || {}
    var background = this.setting.background || _.get(rootStyle, 'background')

    if (!_.isEmpty(background) && background !== this.setting.background) {
      setCanvasWrapperStyle(this.canvas, 'background', background)
    }

    this.toolMaker.changeStyle(styleObject, this.canvas)
    this.templateMaker.changeStyle(styleObject, this.canvas)
  }
}

/**
 * 默认主题
 */
Maps.defaultStyle = {
  Root: {
    color: Colors.rootProspect,
    background: Colors.rootBackground,
    meshColor: Colors.rootBackground,
    ruleColor: Colors.rootBackground,
  },
  Line: {
    stroke: Colors.connection,
    strokeWidth: 1
  },
  MonoCanvas: {
    fontColor: Colors.transparentProspect
  },
  ColorCanvas: {
    fontColor: Colors.transparentProspect
  },
  Shape: {
    fill: '#ffffff',
    fontColor: Colors.transparentProspect,
    stroke: null,
    strokeWidth: 0,
    width: 50,
    height: 50
  },
  Picture: {
    fontColor: '#fff'
  },
  TreeNode: {
    strokeWidth: 0,
    fontColor: Colors.shapeProspect,
    fill: Colors.connection,
    stroke: Colors.connection
  },
  TreeTitle: {
    strokeWidth: 0,
    fontColor: Colors.shapeProspect,
    fill: Colors.shapeBackground,
    stroke: Colors.shapeBackground
  },
  TreeSubtitle: {
    strokeWidth: 0,
    fontColor: Colors.shapeProspect,
    fill: Color(Colors.shapeBackground).lighten(0.2).hex(),
    stroke: Color(Colors.shapeBackground).lighten(0.2).hex()
  }
}

/**
 * 默认高亮主题
 */
Maps.lightStyle = {
  Root: {
    color: Colors.rootProspect,
    background: Colors.rootBackground,
    meshColor: Colors.rootBackground,
    ruleColor: Colors.rootBackground,
  },
  Line: {
    stroke: Colors.connection,
    strokeWidth: 1
  },
  MonoCanvas: {
    fontColor: Colors.transparentProspect
  },
  ColorCanvas: {
    fontColor: Colors.transparentProspect
  },
  Shape: {
    fill: '#ffffff',
    fontColor: Colors.transparentProspect,
    stroke: null,
    strokeWidth: 0,
    width: 50,
    height: 50
  },
  Picture: {
    fontColor: '#fff'
  },
  TreeNode: {
    strokeWidth: 0,
    fontColor: Colors.shapeProspect,
    fill: Colors.connection,
    stroke: Colors.connection
  },
  TreeTitle: {
    strokeWidth: 0,
    fontColor: Colors.shapeProspect,
    fill: Colors.shapeBackground,
    stroke: Colors.shapeBackground
  },
  TreeSubtitle: {
    strokeWidth: 0,
    fontColor: Colors.shapeProspect,
    fill: Color(Colors.shapeBackground).lighten(0.2).hex(),
    stroke: Color(Colors.shapeBackground).lighten(0.2).hex()
  }
}

/**
 * 默认设置
 */
Maps.defaultSetting = {
  direction: 'V',
  size: 'AUTO',
  layout: 'LR',//['Left&Right','TOP<BOTTOM','LEFT-RIGHT','LEFT<RIGHT','TOP=BOTTOM','CIRCLE']
}

export default Maps
