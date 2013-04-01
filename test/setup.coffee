window.equal = assert.equal
window.deepEqual = assert.deepEqual
window.strictEqual = assert.strictEqual
window.ok = assert.ok
JQConsole = $().jqconsole.JQConsole

window.jqconsoleSetup = ->  
  $container = $('<div/>')
  jqconsole = new JQConsole($container, 'header', 'prompt_label', 'prompt_continue')
  typer =   
    typeA: ->
      e = $.Event('keypress')
      e.which = 'a'.charCodeAt(0)
      jqconsole.$input_source.trigger e

    keyDown: (code, options = {}) ->
      e = $.Event('keydown')
      e.which = code
      e[k] = v for k, v of options
      jqconsole.$input_source.trigger e

    type: (str) ->
      type = (chr) ->
        e = $.Event('keypress')
        e.which = chr.charCodeAt(0)
        jqconsole.$input_source.trigger(e)
      type chr for chr in str

  {$container, jqconsole, typer}
