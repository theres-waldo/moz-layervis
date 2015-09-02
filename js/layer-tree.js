// vim: set ts=2 sw=2 tw=99 et:
"use strict";

function Luminosity(color)
{
  return 0.2126 * color[0] +
         0.7152 * color[1] +
         0.0722 * color[2];
}

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
  this.maskLayer = null;

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
  if ('address' in r) {
    this.address = r['address'].value;
    delete r['address'];
  }
}

Layer.prototype.shouldRender = function ()
{
  if (this.disabled)
    return false;
  return this.visible();
}

Layer.prototype.visible = function ()
{
  if (this.type === 'ContainerLayerComposite')
    return true;
  return this.visibleBounds !== null;
}

Layer.prototype.drawInfo = function (list)
{
  var item = $('<li></li>');

  var span = $('<span></span>');
  item.append(span);

  span.text(this.type + ' (' + this.address + ')');
  span.click((function () {
    this.disabled = !this.disabled;
    Display.Update();
  }).bind(this));
  span.css('cursor', 'pointer');

  // Render header.
  if (this.visible()) {
    // Is this color too light? ITU Rec 709
    if (Luminosity(this.color_rgb) >= 200)
      span.css('backgroundColor', 'black');
    span.css({
      color: this.color,
      fontWeight: 'bold',
      fontSize: '11pt',
    });
  } else {
    item.css({
      color: '#ccc',
      fontStyle: 'italic',
    });
  }
  if (!this.shouldRender())
    item.css('textDecoration', 'line-through');

  // Render property info.
  var propList = $('<ul></ul>').css('fontSize', '8pt');
  var pr = new PropRenderer(this, propList, this.props);
  pr.render();
  item.append(propList);

  // Render children.
  if (this.children.length > 0) {
    var sublist = $('<ul></ul>');
    for (var i = 0; i < this.children.length; i++)
      this.children[i].drawInfo(sublist);
    item.append(sublist);
  }

  list.append(item);
}

function PropRenderer(layer, list, props)
{
  this.layer = layer;
  this.list = list;
  this.props = {};
  for (var key in props)
    this.props[key] = props[key];
}
PropRenderer.ShadowProps = ['visible', 'clip', 'transform'];

function PropToString(prop)
{
  if (typeof(prop) != 'object')
    return prop.toString();

  switch (prop.type) {
  case 'region':
    var list = [];
    for (var i = 0; i < prop.rects.length; i++) {
      var r = prop.rects[i];
      list.push('(' + r.x + ', ' + r.y + ', ' + r.w + ', ' + r.h + ')');
    }
    return '<' + list.join('; ') + '>';
  case 'matrix2d':
    return '[ ' + prop.rows[0][0] + ' ' + prop.rows[0][1] + '; ' +
                  prop.rows[1][0] + ' ' + prop.rows[1][1] + '; ' +
                  prop.rows[2][0] + ' ' + prop.rows[2][1] + ' ]';
  case 'rect':
    return '(x=' + prop.x + ', y=' + prop.y + ', w=' + prop.w + ', h=' + prop.h + ')';
  case 'color':
    return 'rgba(' + prop.r + ', ' + prop.g + ', ' + prop.b + ', ' + prop.a + ')';
  case 'pointer':
    return prop.value.toString();
  case 'point':
    return '(x=' + prop.x + ', y=' + prop.y + ')';
  case 'scale':
    return '(' + prop.xScale + ', ' + prop.yScale + ')';
  default:
    return prop.type + ', ' + prop.toString();
  }
}

PropRenderer.prototype.render = function ()
{
  this.renderFlags();
  if (this.layer) {
    this.renderShadowProps();
    this.renderEventRegions();
    this.renderFixedPos();
  }
  this.renderNormal();
  if (this.layer)
    this.renderMetrics();
}

PropRenderer.prototype.append = function (text)
{
  this.list.append($('<span></span>').text(text));
  this.list.append($('<br/>'));
}

PropRenderer.prototype.renderNormal = function ()
{
  for (var key in this.props) {
    var value = this.props[key];
    if (typeof(value) == 'object' && value.complex)
      continue;

    this.append(key + ': ' + PropToString(value));
  }
}

PropRenderer.prototype.renderShadowProps = function ()
{
  for (var i = 0; i < PropRenderer.ShadowProps.length; i++) {
    var key = PropRenderer.ShadowProps[i];
    var shadow_key = 'shadow_' + key;
    var value = this.popProp(key);
    var shadow_value = this.popProp(shadow_key);

    var text = '';
    if (shadow_value)
      text += 'shadow = '  + PropToString(shadow_value);
    if (value) {
      if (shadow_value)
        text += ', ';
      text += 'client = ' + PropToString(value);
    }
    if (!text.length)
      continue;

    this.append(key + ': ' + text);
  }
}

PropRenderer.prototype.renderFixedPos = function ()
{
  var value = this.popProp('isFixedPosition');
  if (!value)
    return;

  var ul = $('<ul></ul>');
  var pr = new PropRenderer(null, ul, value.props);
  pr.render();

  this.append('fixed position: ');
  this.list.append(ul);
}

PropRenderer.prototype.renderMetrics = function ()
{
  var i = 0;
  while (true) {
    var key = 'metrics' + i;
    var value = this.popProp(key);
    if (!value)
      break;

    var ul = $('<ul></ul>');
    var pr = new PropRenderer(null, ul, value.props);
    pr.render();

    this.append(key + ': ' );
    this.list.append(ul);
    i++;
  }
}

PropRenderer.prototype.renderFlags = function ()
{
  // Pick out boolean properties.
  var flags = [];
  for (var key in this.props) {
    if (typeof(this.props[key]) != 'boolean')
      continue;

    flags.push(key);
    delete this.props[key];
  }

  if (!flags.length)
    return;

  this.append('flags: ' + flags.join(', '));
}

PropRenderer.prototype.renderEventRegions = function ()
{
  var value = this.popProp('eventRegions');
  if (!value)
    return;

  this.append('event regions: ');
  var ul = $('<ul></ul>');

  for (var key in value.props) {
    var li = $('<li></li>').text(key + ': ' + PropToString(value.props[key]));
    ul.append(li);
  }

  this.list.append(ul);
}

PropRenderer.prototype.popProp = function (propName)
{
  var value = this.props[propName];
  delete this.props[propName];
  return value;
}
