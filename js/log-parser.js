// vim: set ts=2 sw=2 tw=99 et:
function LogParser(text)
{
  var text = text.replace('\r\n', '\n');
  this.lines = text.split('\n');
  this.curline = 0;

  for (var i = 0; i < this.lines.length; i++)
    this.lines[i] = this.processLine(this.lines[i]);
}

LogParser.prototype.processLine = function (line) {
  var logcat_match = /I\/Gecko   \(\s*\d+\):   /.exec(line);
  if (logcat_match)
    line = line.substr(logcat_match[0].length);
  return line;
}

LogParser.prototype.nextLine = function () {
  if (this.curline >= this.lines.length)
    return null;
  return this.lines[this.curline++];
}

LogParser.prototype.parse = function()
{
  var line = null;
  var frames = [];
  while ((line = this.nextLine()) !== null) {
    if (/LayerManager \(0x[A-Za-z0-9]+\)/.test(line)) {
      var tree = this.parseLayerTree();
      if (tree)
        frames.push(tree);
    }
  }
  return frames;
}

function LogLine(depth, lineno, text, parent)
{
  this.depth = depth;
  this.lineno = lineno;
  this.text = text;
  this.parent = parent;
  this.children = [];

  if (this.parent)
    this.parent.children.push(this);
}

LogParser.prototype.parseLayerTree = function ()
{
  var root = this.sortLayerTreeLogLines();
  if (root.children.length == 0)
    return null;
  if (root.children.length != 1) {
    if (window.console)
      console.log('More than one layer tree root found at: ' + root.lineno);
  }

  var p = new LayerTreeParser(root.children[0]);
  var rootLayer = p.parse();
  if (!rootLayer)
    return null;
  return new LayerTree(rootLayer);
}

LogParser.prototype.sortLayerTreeLogLines = function ()
{
  var stack = new Stack();
  var root = new LogLine(0, this.curline, null, null);

  stack.push(root);

  // Shuffle the log lines into a tree based on their indentation level.
  var line = null;
  while ((line = this.nextLine()) !== null) {
    var depth = this.countLeadingSpaces(line);

    if (!depth)
      break;

    while (depth < stack.top.depth)
      stack.pop();

    var newItem = null;
    if (stack.top.depth == depth) {
      var oldItem = stack.pop();
      newItem = new LogLine(depth, this.curline, line, oldItem.parent);
    } else {
      newItem = new LogLine(depth, this.curline, line, stack.top);
    }
    stack.push(newItem);
  }

  return root;
}

LogParser.prototype.topOf = function (stack)
{
  return stack[stack.length - 1];
}

LogParser.prototype.countLeadingSpaces = function (line)
{
  var spaces = 0;
  for (var j = 0; j < line.length; j++) {
    if (line[j] != ' ')
      break;
    spaces++;
  }
  return spaces;
}

function LayerTreeParser(root)
{
  this.root = root;
}

LayerTreeParser.prototype.deduceLineType = function (line)
{
  var match = /^\s*([^ (]+) \((0x[A-Za-z0-9]+)\)/.exec(line);
  if (match)
    return { type: match[1], address: match[2], strip: match[0].length };
  if (/Mask layer:/.test(line))
    return { type: 'mask', index: -1 };
  var match = /Ancestor mask layer (\d+):/.exec(line);
  if (match)
    return { type: 'ancestor-mask', index: parseInt(match[1]) };
  return null;
}

LayerTreeParser.prototype.parse = function ()
{
  return this.constructLayer(this.root);
}

LayerTreeParser.prototype.constructLayer = function (node)
{
  var info = this.deduceLineType(node.text);
  if (!info)
    return null;

  var layer = this.maybeLayer(info, node);
  if (!layer)
    return null;

  this.findLayerChildren(layer, node);
  return layer;
}

LayerTreeParser.prototype.maybeLayer = function (info, node)
{
  switch (info.type) {
    case 'ContainerLayerComposite':
    case 'ColorLayerComposite':
    case 'PaintedLayerComposite':
    case 'RefLayerComposite':
    case 'ImageLayerComposite':
    case 'CanvasLayerComposite':
    case 'ContainerLayerMLGPU':
    case 'ColorLayerMLGPU':
    case 'PaintedLayerMLGPU':
    case 'RefLayerMLGPU':
    case 'ImageLayerMLGPU':
    case 'CanvasLayerMLGPU':
      var text = node.text.substr(info.strip);
      return new Layer(info.type, info.address, text, node.lineno);
    default:
      return null;
  }
}

LayerTreeParser.prototype.findLayerChildren = function (parentLayer, node)
{
  for (var i = 0; i < node.children.length; i++) {
    var childNode = node.children[i];
    var info = this.deduceLineType(childNode.text);
    if (!info)
      return;

    var childLayer = this.maybeLayer(info, childNode);
    if (childLayer) {
      parentLayer.children.push(childLayer);
      childLayer.parent = parentLayer;
      this.findLayerChildren(childLayer, childNode);
      continue;
    }

    switch (info.type) {
      case 'ImageHost':
        parentLayer.compositable = this.parseCompositable(childNode, info);
        break;
      case 'mask':
      case 'ancestor-mask':
      {
        if (childNode.children.length != 1)
          continue;

        var layer = this.constructLayer(childNode.children[0]);
        if (!layer)
          continue;
        layer.isMask = true;

        if (info.index == -1)
          parentLayer.maskLayer = layer;
        else
          parentLayer.setAncestorMaskLayer(info.index, layer);
        break;
      }
    }
  }
}

LayerTreeParser.prototype.parseCompositable = function (node, info)
{
  var text = node.text.substr(info.strip);
  var compositable = new CompositableHost(info.type, info.address, text);
  if (node.children.length == 1) {
    var childNode = node.children[0];
    var childInfo = this.deduceLineType(childNode.text);
    if (childInfo && childInfo.strip) {
      // Big hack, I'm getting lazy and really all we want is the size from this.
      // Check "strip" above to indicate that it's probably a TextureHost,
      // rather than enumerating them in a switch.
      var texture = new TextureHost(childInfo.type, childInfo.address);
      var match = /\[size=\(w=(\d+), h=(\d+)\)\]/.exec(childNode.text);
      if (match)
        texture.size = { w: parseInt(match[1]), h: parseInt(match[2]) };
      compositable.texture = texture;
    }
  }
  return compositable;
}
