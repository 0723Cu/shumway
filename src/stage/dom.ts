/// <reference path='all.ts'/>
module Shumway.Layers {
  import Rectangle = Shumway.Geometry.Rectangle;
  import Point = Shumway.Geometry.Point;
  import Matrix = Shumway.Geometry.Matrix;
  import DirtyRegion = Shumway.Geometry.DirtyRegion;
  import Filter = Shumway.Layers.Filter;
  import TileCache = Shumway.Geometry.TileCache;
  import Tile = Shumway.Geometry.Tile;
  import OBB = Shumway.Geometry.OBB;

  export class DOMStageRenderer {
    container: HTMLElement;
    pixelRatio: number;
    constructor(container: HTMLElement, pixelRatio: number) {
      this.container = container;
      this.pixelRatio = pixelRatio;
    }

    public render(stage: Stage, options: any) {
      var stageScale = 1 / this.pixelRatio;
      var that = this;
      stage.visit(function visitFrame(frame: Frame, transform?: Matrix) {
        transform = transform.clone();
        transform.scale(stageScale, stageScale);
        if (frame instanceof Shape) {
          var shape = <Shape>frame;
          var div = that.getDIV(shape);
          div.style.transform = div.style["webkitTransform"] = transform.toCSSTransform();
        }
      }, stage.transform);
    }

    /**
     * Constructs a div element with a canvas element inside of it.
     */
    private getDIV(shape) {
      var shapeProperties = shape.properties;
      var div = shapeProperties["div"];
      if (!div) {
        div = shapeProperties["div"] = document.createElement("div");
        // div.style.backgroundColor = randomStyle();
        div.style.width = shape.w + "px";
        div.style.height = shape.h + "px";
        div.style.position = "absolute";
        var canvas = document.createElement("canvas");
        canvas.width = shape.w;
        canvas.height = shape.h;
        shape.source.render(canvas.getContext("2d"));
        div.appendChild(canvas);
        div.style.transformOrigin = div.style["webkitTransformOrigin"] = 0 + "px " + 0 + "px";
        div.appendChild(canvas);
        this.container.appendChild(div);
      }
      return div;
    }
  }
}