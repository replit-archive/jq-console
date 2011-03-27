(function ($){

$.fn.console = function(options){
 
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
  var currentOut = null;
  var history = [];
  var history_index = 0;
  var that = this;

  var settings = {
    label: '>>>',
    handler: $.noop,
    greetings: "jsrepl"
  };

  $.extend(settings, options);

  $('<div/>').text(settings.greetings).appendTo($history);
  $promptLabel.text(settings.label);

  //mozilla prefers keypress always
  var keydown = $.browser.mozilla ? 'keypress' : 'keydown';
//start prompt bindings
  this.click(function(){
    $typer.focus();
  });
  $prompt.focus(function(){
    $typer.focus();
  });
  $typer
    .keypress(function(e){
      //IE & Chrome captures charecters and return
      //Mozilla captures all
      //IE captures on keyCode
      
      if ($.browser.mozilla && !e.charCode) return;
      charCode = e.charCode || e.keyCode;
      if (charCode == 13) return;
      scrollToEnd();
      var char = String.fromCharCode(charCode);
      $spanLeft.append(char);
      if (e.metaKey || e.ctrlKey || e.altKey){
        backSpace();
        return true;
      }
      return false;
    })

    [keydown](function(e){
      var char;
      switch (e.keyCode){
       case 38:
        getPast();
        break;
       case 40:
        getFuture();
        break;
       case 39:
        moveRight();
        break;
      case 37:
        moveLeft();
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
    })
    .bind('paste', function(e){
      setTimeout(function(){
        $spanLeft.append($typer.val());
        $prompt.focus();
        $typer.val('');
        $typer.focus();
      },0);
    });
//end prompt bindings
  var empty = function(){
    $cursor.empty();
    $spanLeft.empty();
    $spanRight.empty();
  };

  var moveRight = function(){
    var currentChar = $cursor.text(); 
    if (!currentChar.length) return;
    var text = $spanRight.text();
    var char = text.substr(0, 1);
    $spanLeft.append(currentChar);
    $cursor.text(char);
    $spanRight.text(text.substr(1));
  };

  var moveLeft = function(){
    var currentChar = $cursor.text();
    var text = $spanLeft.text();
    if (!text.length) return;
    var char = text.charAt(text.length-1);
    $spanRight.prepend(currentChar);
    $cursor.text(char);
    $spanLeft.text(text.substr(0, text.length - 1));
  };
  
  var backSpace = function(){
    var text = $spanLeft.text();
    if (!text.length) return;
    $spanLeft.text(text.substr(0, text.length - 1));
  };
  
  var enterFactory = function(label, callback, remember){
    return function(){
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
  
  var tab = function(){
    $spanLeft.append('    ');  
  };
  
  var stdout = function(text){
    // Lazy appending. I.e. on the first call to out append the output field
    if (!currentOut.parent().is($history)) currentOut.appendTo($history);
    currentOut.find('pre').append(text);
    scrollToEnd();
  };

  var result = function (text){
    text = text || '';
    $historyItem.clone().find('pre').html(text).end().appendTo($history); 
    currentOut = null;
    scrollToEnd();
  };
  
  var getPast = function(){
    if (!history_index) return;
    history_index--;
    setContent(history[history_index]);
  };

  var getFuture = function(){
    if (history_index >= history.length - 1) {
      empty();
      return;
    }
    history_index++;
    setContent(history[history_index]);
  };
  
  var setContent = function(text){
    empty();
    $spanLeft.text(text);
    scrollToEnd();
  }

  var scrollToEnd = function(wait){
    var scroll = function(){that.scrollTop(that[0].scrollHeight);};
    if (wait)
      setTimeout(scroll, 100);
    else
      scroll();
  }
  var stdinQueue = [];
  var stdinInFlight = false;
  // Public API
  $.extend(this, {
    stdin: function(label, callback){
      var cb = function (){
        callback.apply(this,[].slice.call(arguments));
        stdinInFlight = false;
        check();
      };
      var qItem = function(){
          stdinInFlight = true;
          $promptLabel.text(label);
          enter = enterFactory(label, cb);
       
      };
      function check(){
        setTimeout(function(){
          if (!stdinInFlight && stdinQueue.length) stdinQueue.shift()();
        }, 100);
      }
      stdinQueue.push(qItem);
      check();
  },
    setText: function(text){
      if (text){
        setContent(text);
      }
    },
    reset: function(){
      empty();
      $history.empty();
    },
    scrollToEnd: scrollToEnd

  }); 
  

  return this;
};

})(jQuery);



