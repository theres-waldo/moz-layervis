// vim: set ts=2 sw=2 tw=99 et:
"use strict";

function BoundsOfRegion(rgn)
{
  if (!rgn.rects.length)
    return { x: 0, y: 0, w: 0, h: 0 };
  if (rgn.rects.length == 1)
    return rgn.rects[0];
  
  var min_x = rgn.rects[0].x;
  var min_y = rgn.rects[0].y;
  var max_right = rgn.rects[0].x + rgn.rects[0].w;
  var max_btm = rgn.rects[0].y + rgn.rects[0].h;

  for (var i = 0; i < rgn.rects.length; i++) {
    var r = rgn.rects[i];
    if (r.x < min_x)
      min_x = r.x;
    if (r.y < min_y)
      min_y = r.y;
    if (r.x + r.w > max_right)
      max_right = r.x + r.w;
    if (r.y + r.h > max_btm)
      max_btm = r.y + r.h;
  }

  return {
    x: min_x,
    y: min_y,
    w: max_right - min_x,
    h: max_btm - min_y
  };
}

function LayerTree()
{
  this.root = null;
  this.parsed = false;
  this.errors = [];
}

LayerTree.prototype.apply = function (callback)
{
  this.root.apply(callback);
}

LayerTree.prototype.parseIfNeeded = function ()
{
  if (this.parsed)
    return this.errors.length == 0;
  this.parsed = true;

  this.apply((function (layer) {
    layer.parse(this);
  }).bind(this));

  return this.errors.length == 0;
}

function Layer(parent, name, text, lineno)
{
  this.parent = parent;
  this.children = [];
  this.type = name;
  this.text = text;
  this.lineno = lineno;

  // Display properties.
  this.disabled = false;
  this.color = '#ccc';
  this.color_rgb = [0xcc, 0xcc, 0xcc];

  // Computed properties.
  this.props = {};

  if (parent)
    parent.children.push(this);
}

Layer.prototype.apply = function (callback)
{
  callback(this);
  for (var i = 0; i < this.children.length; i++)
    this.children[i].apply(callback);
}

Layer.prototype.parse = function (tree)
{
  var r = null;
  try {
    r = LayerPropertyParser.parse(this.text);
  } catch (e) {
    tree.errors.push({
      layer: this,
      error: e,
    });
  }
  if (!r)
    return;

  this.props = r;
  if (this.props.not_visible || !this.props.shadow_visible)
    this.visibleBounds = null;
  else
    this.visibleBounds = BoundsOfRegion(this.props.shadow_visible);
}

Layer.prototype.shouldRender = function ()
{
  if (this.disabled)
    return false;
  if (this.type === 'ContainerLayerComposite')
    return true;
  return this.visibleBound !== null;
}
