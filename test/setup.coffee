window.equal = assert.equal
window.notEqual = assert.notEqual
window.deepEqual = assert.deepEqual
window.strictEqual = assert.strictEqual
window.ok = assert.ok
JQConsole = $().jqconsole.JQConsole

window.jqconsoleSetup = ->
  $container = $('<div/>').css
    height: '100px'
    widht: '200px'
    position: 'relative'
  $container.appendTo('body')
  jqconsole = new JQConsole($container, 'header', 'prompt_label', 'prompt_continue')
  triggerEvent = (type, charCode, options = {}) ->
    e = $.Event(type)
    e.which = charCode
    e[k] = v for k, v of options
    jqconsole.$input_source.trigger(e)

  typer =
    typeA: ->
      triggerEvent 'keypress', 'a'.charCodeAt(0)

    keyDown: (code, options = {}) ->
      triggerEvent 'keydown', code, options

    type: (str, options = {}) ->
      triggerEvent 'keypress', chr.charCodeAt(0), options for chr in str

  createScroll = ->
    line_height = jqconsole.$prompt.height()
    console_height = jqconsole.$container.height()
    lines_per_page = Math.ceil(console_height / line_height)
    for i in [0..lines_per_page * 5]
      jqconsole.SetPromptText('foo')
      jqconsole._HandleEnter()
      jqconsole.Prompt true, ->
    {line_height, console_height, lines_per_page}

  {$container, jqconsole, typer, createScroll}
