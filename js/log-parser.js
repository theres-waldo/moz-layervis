// vim: set ts=2 sw=2 tw=99 et:
function LogParser(text)
{
  var text = text.replace('\r\n', '\n');
  this.lines = text.split('\n');
  this.stack = [];
  this.roots = [];
  this.curline = 0;

  for (var i = 0; i < this.lines.length; i++)
    this.lines[i] = this.processLine(this.lines[i]);
}

LogParser.layerTypes = {
  'ContainerLayerComposite': true,
  'ColorLayerComposite': true,
  'PaintedLayerComposite': true,
  'RefLayerComposite': true,
  'ImageLayerComposite': true,
};

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

LogParser.prototype.parse = function() {
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

LogParser.prototype.parseLayerTree = function () {
  var line = null;
  var tree = new LayerTree();
  while ((line = this.nextLine()) !== null) {
    var spaces = 0;
    for (var j = 0; j < line.length; j++) {
      if (line[j] != ' ')
        break;
      spaces++;
    }

    // If spaces is 0, we're done with this layer.
    if (!spaces) {
      // Back up so the outer loop can process this line anew.
      this.curline--;
      break;
    }

    // If this returns false, we're ignoring lines.
    if (!this.adjustStackForDepth(spaces))
      continue;

    // Compute the name.
    for (var k = j; k < line.length; k++) {
      if (line[k] == ' ')
        break;
    }
    var name = line.substr(j, k - j);
    var line = line.substr(k);

    if (!(name in LogParser.layerTypes)) {
      this.startIgnoring(spaces);
      continue;
    }

    var top = this.top();
    var layer = new Layer(top ? top.layer : null,
                          name,
                          line,
                          this.curline);
    if (top === null) {
      if (tree.root)
        this.error("second root layer found");
      tree.root = layer;
    }

    if (top === null || spaces > top.depth)
      this.stack.push({ layer: layer, depth: spaces });
  }

  return tree.root ? tree : null;
}

LogParser.prototype.startIgnoring = function (depth) {
  this.stack.push({ layer: null, depth: depth});
}

LogParser.prototype.adjustStackForDepth = function (depth) {
  // Remove any old items.
  while (this.top() !== null && this.top().depth >= depth)
    this.pop();

  if (this.top() === null)
    return true;
  return this.top().layer !== null;
}

LogParser.prototype.top = function () {
  if (this.stack.length === 0)
    return null;
  return this.stack[this.stack.length - 1];
}

LogParser.prototype.pop = function () {
  this.stack.pop();
  return this.top();
}

LogParser.prototype.error = function (message) {
  // Note, this.curline starts at 0, but points to the next line. So as a line
  // number it indicates the correct number for the user.
  var fullMessage = "line " + this.curline + ": " + message;
  if (!window.console)
    throw fullMessage;
  console.log(fullMessage);
}
