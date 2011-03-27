(function ($) {

$.fn.console = function(options) {
  // Setup DOM elements.
  var $history = $('<div/>').appendTo(this);
  var $typer = $('<textarea/>',{style: "position:absolute;left:-99999px"}).appendTo(this);
  var $prompt = $('<div/>', {tabindex:1, id:"jq-console-prompt"}).appendTo(this);
  var $promptLabel = $('<span/>', {id: "jq-console-label"}).appendTo($prompt);
  var $spanLeft = $('<pre/>').appendTo($prompt);
  var $cursor = $('<pre/>',{id:"jq-console-cursor"}).appendTo($prompt);
  var $spanRight = $('<pre/>').appendTo($prompt);
  var $historyItem = $('<div><pre></pre></div>');
  var $stdoutItem = $historyItem.clone().addClass('out');
  var $paster = $('<textarea/>');

  // Remember this element for use in callback.
  var that = this;

  // The element where output is currently being written.
  var currentOut = null;

  // Setup history track.
  var history = [];
  var history_index = 0;

  // Setup configurable settings.
  var settings = {
    label: 'jq-console> ',
    handler: $.noop,
    greetings: "Welcome to jq-console!"
  };
  $.extend(settings, options);

  // Write greeting.
  $('<pre/>').text(settings.greetings).appendTo($history);
  // Write prompt.
  $promptLabel.text(settings.label);

  // Mouse prompt bindings.
  this.click(function() {
    $typer.focus();
  });
  $prompt.focus(function() {
    $typer.focus();
  });

  // Keyboard prompt bindings.
  $typer.keypress(function(e) {
    // IE & Chrome capture characters and return.
    // Mozilla captures all.
    // IE captures on keyCode.
    if ($.browser.mozilla && !e.charCode) return;
    charCode = e.charCode || e.keyCode;
    if (charCode == 13) return false;
    scrollToEnd();

    if (!(e.metaKey || e.ctrlKey || e.altKey)) {
      var char = String.fromCharCode(charCode);
      $spanLeft.append(char);
      return false;
    }
  });

  // Mozilla always prefers keypress.
  $typer[$.browser.mozilla ? 'keypress' : 'keydown'](function(e) {
    switch (e.keyCode) {
      case 38:
        getPast();
        break;
      case 40:
        getFuture();
        break;
      case 39:
        moveRight();
        return false;
        break;
      case 37:
        moveLeft();
        return false;
        break;
      case 8:
        backSpace();
        return false;
        break;
      case 9:
        tab();
        return false;
        break;
      case 13:
        enter();
        return false;
        break;
    }
  });

  // Special tratment of pasting.
  $typer.bind('paste', function(e) {
    setTimeout(function(){
      $spanLeft.append($typer.val());
      $prompt.focus();
      $typer.val('');
      $typer.focus();
    },0);
  });

  // Empties the current prompt.
  var empty = function() {
    $cursor.empty();
    $spanLeft.empty();
    $spanRight.empty();
  };

  // Moves the cursor to the right.
  var moveRight = function() {
    var currentChar = $cursor.text(); 
    if (!currentChar.length) return;
    var text = $spanRight.text();
    var char = text.substr(0, 1);
    $spanLeft.append(currentChar);
    $cursor.text(char);
    $spanRight.text(text.substr(1));
  };

  // Moves the cursor to the left.
  var moveLeft = function() {
    var currentChar = $cursor.text();
    var text = $spanLeft.text();
    if (!text.length) return;
    var char = text.charAt(text.length-1);
    $spanRight.prepend(currentChar);
    $cursor.text(char);
    $spanLeft.text(text.substr(0, text.length - 1));
  };

  // Removes the last character before the cursor.
  var backSpace = function() {
    var text = $spanLeft.text();
    if (!text.length) return;
    $spanLeft.text(text.substr(0, text.length - 1));
  };

  // Creates a new input prompt.
  // TODO(max99x): Burn it with fire!
  var enterFactory = function(label, callback, remember) {
    return function() {
      var command = $prompt.text()
      $historyItem.clone().find('pre').html(command).end().appendTo($history);
      command = command.substr(label.length);
      currentOut = $stdoutItem.clone();
      callback(command, stdout, result);
      $promptLabel.text(settings.label);
      if (remember && command) history.push(command);
      history_index = history.length;
      enter = _enter;
      setContent("");
    };
  }
  var _enter;
  var enter = _enter = enterFactory(settings.label, settings.handler, true);
  
  var tab = function() {
    $spanLeft.append('    ');  
  };
  
  var stdout = function(text) {
    // Lazy appending. I.e. on the first call to out append the output field
    if (!currentOut.parent().is($history)) currentOut.appendTo($history);
    currentOut.find('pre').append(text);
    scrollToEnd();
  };

  var result = function (text) {
    text = text || '';
    $historyItem.clone().find('pre').html(text).end().appendTo($history); 
    currentOut = null;
    scrollToEnd();
  };
  
  var getPast = function() {
    if (!history_index) return;
    history_index--;
    setContent(history[history_index]);
  };

  var getFuture = function() {
    if (history_index >= history.length - 1) {
      empty();
      return;
    }
    history_index++;
    setContent(history[history_index]);
  };
  
  var setContent = function(text) {
    empty();
    $spanLeft.text(text);
    scrollToEnd();
  }

  var scrollToEnd = function(wait) {
    that.scrollTop(that[0].scrollHeight);
  }

  // Public API.
  $.extend(this, {
    stdin: function(callback) {
      setTimeout(function() {
        enter = enterFactory('', callback);
      }, 100);
    },
    setText: setContent,
    reset: function() {
      empty();
      $history.empty();
      $('<pre/>').text(settings.greetings).appendTo($history);
    },
    scrollToEnd: scrollToEnd
  }); 
  
  // Save this in data to be accessed if lost.
  $(this).data("console", this);

  return this;
};

})(jQuery);
