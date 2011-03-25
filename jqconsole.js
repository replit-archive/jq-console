// Simple web terminal copy rights jsrepl.com 2011
(function ($){

$.fn.console = function(options){
  
  var $history = $('<div/>').appendTo(this);
  var $prompt = $('<div/>', {tabindex:1, id:"jq-console-prompt"}).appendTo(this);
  var $promptLabel = $('<span/>', {id: "jq-console-label"}).appendTo($prompt);
  var $spanLeft = $('<pre/>').appendTo($prompt);
  var $cursor = $('<pre/>',{id:"jq-console-cursor"}).appendTo($prompt);
  var $spanRight = $('<pre/>').appendTo($prompt);
  var $historyItem = $('<div><pre></pre></div>');
  var $stdoutItem = $historyItem.clone();
  var $paster = $('<textarea/>');
  var currentOut = null;

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
  $prompt
    .keypress(function(e){
      if (!e.charCode) return;
      var char;
      char = String.fromCharCode(e.charCode);
      $spanLeft.append(char);
    })

    [keydown](function(e){
      var char;
      switch (e.keyCode){
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
      $text = $paster.clone().appendTo('body');
      $text.focus();
      setTimeout(function(){
        console.log($text.val())
        $spanLeft.append($text.val());
        $text.remove();
        $prompt.focus();
      },0);
      console.log('s');
    });

//end prompt bindings
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
    var char = text.substr(-1);
    $spanRight.prepend(currentChar);
    $cursor.text(char);
    $spanLeft.text(text.substr(0, text.length - 1));
  };
  
  var backSpace = function(){
    var text = $spanLeft.text();
    if (!text.length) return;
    $spanLeft.text(text.substr(0, text.length - 1));
  };

  var enter = function(){
    var command = $prompt.text();
    $historyItem.clone().find('pre').html(command).end().appendTo($history);
    $cursor.empty();
    $spanLeft.empty();
    $spanRight.empty();
    currentOut = $stdoutItem.clone();
    command = command.substr(settings.label.length);
    console.log(settings.label);
    settings.handler(command, stdout, result);
  };

  var tab = function(){
    //tabs acting weird, If came next a two char sized word it will only craete 2 spaces tabs
   //if next a three char sized word the space will be eq to 1 space :S
   // var text = document.createTextNode('\t');
    $spanLeft.append('    ');  
  };
  
  var stdout = function(text){
    // Lazy appending. I.e. on the first call to out append the output field
    if (!currentOut.parent().length) currentOut.appendTo($history);
    currentOut.find('pre').append(text);
  };

  var result = function (text){
    text = text || '';
    $historyItem.clone().find('pre').html(text).end().appendTo($history); 
    currentOut = null;
  };
  
  $.extend(this, {
    stdin: function(label, callback){
                
    }
  }); 
  

  return this;
};

})(jQuery);
