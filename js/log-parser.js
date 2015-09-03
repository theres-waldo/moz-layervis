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

LogParser.layerTypes = {
  'ContainerLayerComposite': true,
  'ColorLayerComposite': true,
  'PaintedLayerComposite': true,
  'RefLayerComposite': true,
  'ImageLayerComposite': true,
};
LogParser.prototype.parseLayerTree = function ()
{
  var root = this.sortLayerTreeLogLines();
  if (root.children.length == 0)
    return null;
  if (root.children.length != 1) {
    if (window.console)
      console.log('More than one layer tree root found at: ' + root.lineno);
  }

  var nodeToLayer = function (node) {
    var match = /^\s*([^ (]+) \((0x[A-Za-z0-9]+)\)/.exec(node.text);
    if (!match || !(match[1] in LogParser.layerTypes))
      return null;

    var type = match[1];
    var address = match[2];
    var text = node.text.substr(match[0].length);
    return new Layer(type, address, text, node.lineno);
  };
  var nodeToMaskLayer = function (node) {
    var layer = nodeToLayer(node);
    if (!layer)
      return null;
    layer.isMask = rue;
    return layer;
  }

  var construct = function (node) {
    var layer = nodeToLayer(node);
    if (!layer)
      return null;

    for (var i = 0; i < node.children.length; i++) {
      var childNode = node.children[i];
      var child = construct(childNode);
      if (child) {
        child.parent = layer;
        layer.children.push(child);
        continue;
      }

      if (/Mask layer:/.test(childNode.text) && childNode.children.length == 1) {
        var maskLayerNode = childNode.children[0];
        layer.maskLayer = nodeToMaskLayer(maskLayerNode);
        continue;
      }

      var match = /Ancestor mask layer (\d+):/.exec(childNode.text);
      if (match && childNode.children.length == 1) {
        var maskLayerNode = childNode.children[0];
        var maskLayer = nodeToLayerMaskLayer(maskLayerNode);
        if (!layer.ancestorMaskLayers)
          layer.ancestorMaskLayers = [];

        var maskLayerIndex = parseInt(match[1]);
        layer.ancestorMaskLayers[maskLayerIndex] = maskLayer;
        continue;
      }
    }

    return layer;
  };

  var rootLayer = construct(root.children[0]);
  if (!rootLayer)
    return;

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
