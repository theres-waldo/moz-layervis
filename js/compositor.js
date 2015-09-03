// vim: set sts=2 ts=8 sw=2 tw=99 et:

function Compositor(tree, ctx, scale)
{
  this.tree = tree;
  this.ctx = ctx;
  this.transforms = [];
  this.transform = null;
  this.colors = null;
  this.scale = scale || 1.0;
  this.drawDTC = false;

  var metrics0 = this.tree.root.props.metrics0;
  if (metrics0 && metrics0.props.z)
    this.scale *= (1.0 / metrics0.props.z);
}

Compositor.prototype.pushTransform = function (m) {
  this.ctx.save();
  this.ctx.transform(m.rows[0][0], m.rows[0][1],
                     m.rows[1][0], m.rows[1][1],
                     m.rows[2][0], m.rows[2][1]);
}

Compositor.prototype.popTransform = function () {
  this.ctx.restore();
}

Compositor.prototype.pushScale = function (x, y) {
  this.ctx.save();
  this.ctx.scale(x, y);
}

Compositor.prototype.popScale = function () {
  this.ctx.restore();
}

Compositor.prototype.pushClip = function (r) {
  this.ctx.save();
  this.ctx.beginPath();
  this.ctx.rect(r.x, r.y, r.w, r.h);
  this.ctx.clip();
}

Compositor.prototype.popClip = function () {
  this.ctx.restore();
}

Compositor.prototype.drawDispatchToContentRegion = function (layer, region) {
  this.ctx.beginPath();
  this.ctx.strokeStyle = '#333';
  this.ctx.lineWidth = 2;
  this.ctx.rect(region.x, region.y, region.w, region.h);
  this.ctx.stroke();
}

Compositor.prototype.renderLayer = function (layer) {
  if (!layer.shouldRender())
    return;

  var visible = layer.props.shadow_visible || null;
  var transform = layer.props.shadow_transform || null;
  var clip = layer.props.shadow_clip || null;
  var preScale = layer.props.preScale || null;
  var postScale = layer.props.postScale || null;

  if (transform && transform.type == 'matrix3d') {
    alert('Frame contains a 3D transform, which is not supported yet.');
    return;
  }

  if (clip)
    this.pushClip(clip);
  if (preScale)
    this.pushScale(preScale.xScale, preScale.yScale);
  if (transform)
    this.pushTransform(transform);
  if (postScale)
    this.pushScale(postScale.xScale, postScale.yScale);

  this.ctx.beginPath();
  if (visible) {
    for (var i = 0; i < visible.rects.length; i++) {
      var rect = visible.rects[i];
      this.ctx.rect(rect.x, rect.y, rect.w, rect.h);
    }
  }

  this.ctx.fillStyle = layer.color;
  this.ctx.fill();

  var dtc = layer.props.eventRegions
            ? layer.props.eventRegions.props.dispatchtocontentregion
            : null;
  if (dtc && this.drawDTC) {
    for (var i = 0; i < dtc.rects.length; i++)
      this.drawDispatchToContentRegion(layer, dtc.rects[i]);
  }

  for (var i = 0; i < layer.children.length; i++)
    this.renderLayer(layer.children[i]);

  if (postScale)
    this.popScale();
  if (transform)
    this.popTransform();
  if (preScale)
    this.popScale();
  if (clip)
    this.popClip();
}

Compositor.prototype.renderListing = function (list, layer) {
  var item = document.createElement('li');
  list.appendChild(item);
  item.style.color = layer.color;

  var span = document.createElement('span');
  span.textContent = layer.type + layer.comment;

  if (layer.shouldRender()) {
    // Is this color too light? ITU Rec 709
    var luma = 0.2126 * layer.color_rgb[0] +
               0.7152 * layer.color_rgb[1] +
               0.0722 * layer.color_rgb[2];
    if (luma >= 200)
      span.style.backgroundColor = 'black';
    else
      span.style.backgroundColor = 'white';
    span.onclick = (function () {
      layer.disabled = !layer.disabled;
      if (layer.disabled)
        span.style.textDecoration = 'line-through';
      else
        span.style.textDecoration = '';
      this.renderLayers();
    }).bind(this);
  } else {
    span.style.color = '#ccc';
    span.style.textDecoration = 'line-through';
    span.style.fontStyle = 'italic';
  }

  item.appendChild(span);

  var child_list = document.createElement('ul');
  item.appendChild(child_list);

  for (var i = 0; i < layer.children.length; i++)
    this.renderListing(child_list, layer.children[i]);
}

Compositor.prototype.composite = function () {
  this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
  this.pushScale(this.scale, this.scale);
  this.renderLayer(this.tree.root);
  this.popScale();
}

Compositor.prototype.render = function ()
{
  this.preprocess();

  var root = this.tree.root;
  this.ctx.canvas.width = root.visibleBounds.w * this.scale;
  this.ctx.canvas.height = root.visibleBounds.h * this.scale;
  this.composite();
}

Compositor.prototype.preprocess = function ()
{
  var visible = 0;
  this.tree.root.apply(function (layer) {
    if (layer.visible())
      visible++;
  });

  var colors = new ColorGenerator(visible);
  this.tree.root.apply(function (layer) {
    if (!layer.visible())
      return;

    var color = colors.next();
    var text = 'rgb(' + color.join(',') + ')';
    layer.color = text;
    layer.color_rgb = color;
  });
}
