// vim: set ts=2 sw=2 tw=99 et:
function Startup()
{
}

function UpdateTitle()
{
  document.title = $('#titlebox').val();
}

function Display()
{
}

Display.LastUpdatedFrame = -1;
Display.GetCurrentFrame = function ()
{
  return parseInt($('#current-frame').val());
}

Display.GoFirstFrame = function ()
{
  $('#current-frame').val(0);
  Display.Update();
}

Display.GoPrevFrame = function ()
{
  $('#current-frame').val(Math.max(0, Display.GetCurrentFrame() - 1));
  Display.Update();
}

Display.GoNextFrame = function ()
{
  $('#current-frame').val(Math.min(Display.FrameList.length - 1, Display.GetCurrentFrame() + 1));
  Display.Update();
}

Display.GoLastFrame = function ()
{
  $('#current-frame').val(Display.FrameList.length - 1);
  Display.Update();
}

Display.GoToFrame = function ()
{
  if (Display.GetCurrentFrame() >= Display.FrameList.length)
    $('#current-frame').val(Display.FrameList.length - 1);
  Display.Update();
}

Display.RenderFile = function ()
{
  var picker = document.getElementById('filechooser');
  if (picker.files.length > 0) {
    var file = picker.files[0];
    if ('getAsText' in file) {
      var text = file.getAsText('iso-8859-1');
      Display.RenderLog(text);
      return;
    }

    var reader = new FileReader();
    reader.readAsText(file, 'iso-8859-1');
    reader.onload = function (e) {
      Display.RenderLog(e.target.result);
    }
  }
  picker.value = '';
  $('#log-text').val('');
}

Display.Render = function ()
{
  Display.RenderLog($('#log-text').val());
}

Display.RenderLog = function (text)
{
  var p = new LogParser(text);
  var frames = p.parse();

  if (!frames.length) {
    alert('No frames found!');
    return;
  }

  $('#log-container').hide();
  $('#log-icon').
    text('+').
    css('cursor', 'pointer').
    click(function () {
      $('#log-container').show();
    });
  $('#controlbox').show();
  $('#current-frame').attr({
    max: frames.length
  });
  if (parseInt($('#current-frame').val()) >= frames.length)
    $('#current-frame').val(frames.length - 1);
  $('#viewbox').show();

  Display.FrameList = frames;
  Display.Update();
}

Display.SetButtonStates = function ()
{
  var frame_index = Display.GetCurrentFrame();
  $('#last-frame').prop('disabled', frame_index == Display.FrameList.length - 1);
  $('#next-frame').prop('disabled', frame_index == Display.FrameList.length - 1);
  $('#first-frame').prop('disabled', frame_index == 0);
  $('#prev-frame').prop('disabled', frame_index == 0);
}

Display.Update = function ()
{
  var frame = Display.GetCurrentFrame();
  var layers = Display.FrameList[frame];

  if (Display.LastUpdatedFrame != frame) {
    Display.SetButtonStates();

    if (!layers.parseIfNeeded()) {
      $('#errorbox').show().empty();
      $('#composite').hide();
      for (var i = 0; i < layers.errors.length; i++) {
        var error = layers.errors[i];
        $('#errorbox').append($('<div></div>').text(
          'Line ' + (error.layer.lineno) + ', ' +
          error.layer.type + ': ' +
          error.error.message
        ));
      }
      return;
    }

    $('#errorbox').hide();
    $('#composite').show();
  }

  var scale = parseFloat($('#scale').val()) || 1.0;

  var context = $('#composite')[0].getContext('2d');
  var cc = new Compositor(layers, context, scale);
  cc.drawDTC = $('#draw-dtc').prop('checked');
  cc.drawMasks = $('#draw-masks').prop('checked');
  cc.render();

  if (Display.LastUpdatedFrame != frame)
    Display.ShowLayerTree(layers);

  Display.LastUpdatedFrame = frame;
}

Display.ShowLayerTree = function (layers)
{
  var box = $('#propsbox');
  box.empty();

  var root = $('<ul></ul>');
  layers.root.drawInfo(root);
  box.append(root);
}

