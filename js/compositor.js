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
  this.drawMasks = true;

  var metrics0 = this.tree.root.props.metrics0;
  if (metrics0 && metrics0.props.z) {
    var z = parseInt(metrics0.props.z) || parseInt(metrics0.props.z.value);
    this.scale *= (1.0 / z);
  }
}

Compositor.ComputeCanvasSize = function (tree, scale)
{
  var metrics0 = tree.root.props.metrics0;
  if (metrics0 && metrics0.props.z) {
    var z = parseInt(metrics0.props.z) || parseInt(metrics0.props.z.value);
    scale *= (1.0 / z);
  }

  return {
    w: tree.root.visibleBounds.w * scale,
    h: tree.root.visibleBounds.h * scale,
  };
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

Compositor.prototype.drawDispatchToContentRegion = function (layer, region)
{
  this.ctx.beginPath();
  this.ctx.strokeStyle = '#333';
  this.ctx.lineWidth = 2;
  this.ctx.rect(region.x, region.y, region.w, region.h);
  this.ctx.stroke();
}

Compositor.prototype.drawMask = function (layer)
{
  var host = layer.compositable;
  if (!host)
    return;
  var texture = host.texture;
  if (!texture)
    return;
  var size = texture.size;
  if (!size)
    return;

  this.pushClip({x: 0, y: 0, w: size.w, h: size.h});

  // Draw a bounding box.
  this.ctx.beginPath();
  this.ctx.rect(0.5, 0.5, size.w - 0.5, size.h - 0.5);
  this.ctx.stroke();

  var color = 'rgba(0, 0, 0, 0.2)';

  for (var y = 1.5; y < size.h + size.w; y += 30) {
    this.ctx.beginPath();
    this.ctx.lineWidth = 10;
    this.ctx.moveTo(2.5, y);
    this.ctx.lineTo(y, 2.5);
    this.ctx.strokeStyle = color;
    this.ctx.stroke();
  }

  this.popClip();
}

Compositor.prototype.renderLayer = function (layer)
{
  if (!layer.visible() && !layer.isMask)
    return;
  if (layer.disabled)
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

  if (layer.isMask && this.drawMasks) {
    this.drawMask(layer);
  } else if (visible) {
    this.ctx.beginPath();
    for (var i = 0; i < visible.rects.length; i++) {
      var rect = visible.rects[i];
      this.ctx.rect(rect.x, rect.y, rect.w, rect.h);
    }
    this.ctx.fillStyle = layer.color;
    this.ctx.fill();
  }

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

  // Mask layers are in parent layer coordinates, so we paint them after
  // popping local layer state. We also paint after our children, so the
  // full mask region can be seen.
  layer.forEachMaskLayer((function (maskLayer, index) {
    this.renderLayer(maskLayer);
  }).bind(this));
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
  this.composite();
}

Compositor.prototype.getSize = function ()
{
  return {
    w: this.tree.root.visibleBounds.w * this.scale,
    h: this.tree.root.visibleBounds.h * this.scale,
  };
}

Compositor.prototype.preprocess = function ()
{
  var visible = 0;
  this.tree.root.applyIf(function (layer) {
    if (!layer.visible())
      return false;
    visible++;
    return true;
  });

  var colors = new ColorGenerator(visible);
  this.tree.root.apply(function (layer) {
    if (!layer.visible())
      return false;

    var color = colors.next();
    var text = 'rgb(' + color.join(',') + ')';
    layer.color = text;
    layer.color_rgb = color;
    return true;
  });
}
