JQConsole = $().jqconsole.JQConsole
{equal, deepEqual, strictEqual, ok} = assert

describe 'JQConsole', ->
  $container = $('<div/>')
  jqconsole = new JQConsole($container, 'header', 'prompt_label', 'prompt_continue')

  describe '#constructor', ->

    it 'instantiates', ->
      equal jqconsole.header, 'header'
      equal jqconsole.prompt_label_main, 'prompt_label'
      equal jqconsole.prompt_label_continue, 'prompt_continue'
      equal jqconsole.indent_width, 2
      equal jqconsole.GetState(), 'output'
      deepEqual jqconsole.input_queue, []
      deepEqual jqconsole.history, []
      ok jqconsole.$console.length
      ok jqconsole.$console instanceof jQuery
      equal $container.text().trim(), 'header'
      strictEqual $container.data('jqconsole'), jqconsole
      ok jqconsole.$prompt.length
      ok jqconsole.$input_source.length

    it 'setup events', (done)->
      counter = 0
      jqconsole.$input_source.focus ->
        counter++
      jqconsole.$console.mouseup()
      fn = -> 
        ok counter
        done()
      setTimeout fn, 10


  describe 'Shortcuts', ->
    describe '#RegisterShortcut', ->
      # Fails in v2.7.7
      it 'throws if callback not function', ->
        assert.throws ->
          jqconsole.RegisterShortcut 'b', 'c'

      it 'registers shortcut by string', ->
        cb = ->
        jqconsole.RegisterShortcut 'a', cb
        deepEqual jqconsole.shortcuts['a'.charCodeAt(0)], [cb]
        deepEqual jqconsole.shortcuts['A'.charCodeAt(0)], [cb]

      it 'registers shortcut by charcode', ->
        cb = ->
        jqconsole.RegisterShortcut 'c'.charCodeAt(0), cb
        deepEqual jqconsole.shortcuts['c'.charCodeAt(0)], [cb]
        deepEqual jqconsole.shortcuts['C'.charCodeAt(0)], [cb]

      it 'shortcuts must be ascii', ->
        assert.throws ->
          jqconsole.RegisterShortcut 'ƒ', ->

    describe '#UnRegisterShortcut', ->

      it 'removes all callback for a shortcut', ->
        cb = ->
        jqconsole.RegisterShortcut 'a', cb
        jqconsole.UnRegisterShortcut 'a'
        deepEqual jqconsole.shortcuts['a'.charCodeAt(0)], undefined

      it 'removes specific callback', ->
        aCb = ->
        bCb = ->
        jqconsole.RegisterShortcut 'a', aCb
        jqconsole.RegisterShortcut 'a', bCb
        jqconsole.UnRegisterShortcut 'a', aCb
        deepEqual jqconsole.shortcuts['a'.charCodeAt(0)], [bCb]

  describe 'Prompt Interaction', ->
    describe '#Prompt', ->
      after ->
        jqconsole.AbortPrompt()

      it 'inits prompt and auto-focuses', ->
        counter = 0
        jqconsole.$input_source.focus ->
          counter++
        resultCb = ->
        jqconsole.Prompt true, resultCb
        equal jqconsole.GetState(), 'prompt'
        ok counter
        ok jqconsole.history_active
        strictEqual jqconsole.input_callback, resultCb
        equal jqconsole.$prompt.text().trim(), 'prompt_label'

    describe '#AbortPrompt', ->
      it 'aborts the prompt', ->
        jqconsole.Prompt true, ->
        jqconsole.AbortPrompt()
        equal jqconsole.$prompt.text().trim(), ''

      it 'restarts queued prompts', ->
        aCb = ->
        jqconsole.Prompt false, aCb
        bCb = ->
        jqconsole.Prompt true, bCb
        strictEqual jqconsole.input_callback, aCb
        strictEqual jqconsole.history_active, false
        jqconsole.AbortPrompt()
        strictEqual jqconsole.input_callback, bCb
        strictEqual jqconsole.history_active, true
        jqconsole.AbortPrompt()

    describe '#_HandleChar', ->
      before -> jqconsole.Prompt true, ->
      after -> jqconsole.AbortPrompt()
      it 'handles chars', ->
        str = ''
        test = (ch) ->
          str += ch
          e = $.Event('keypress')
          e.which = ch.charCodeAt(0)
          jqconsole.$input_source.trigger e
          equal jqconsole.$prompt.text().trim(), 'prompt_label' + str

        test 'a'
        test 'Z'
        test '$'
        test 'ƒ'

    describe '#_HandleKey', ->
      it 'handles enter', ->
        counter = 0
        jqconsole.Prompt true, -> counter++
        # Press a.
        e = $.Event('keypress')
        e.which = 'a'.charCodeAt(0)
        jqconsole.$input_source.trigger e
        # Enter.
        e = $.Event('keydown')
        e.which = 13
        jqconsole.$input_source.trigger e
        ok counter
        equal jqconsole.$console.find('.jqconsole-old-prompt').last().text().trim(), 'prompt_labela'

      it 'handles shift+enter', ->
        jqconsole.Prompt true, ->
        e = $.Event('keydown')
        e.which = 13
        e.shiftKey = true
        jqconsole.$input_source.trigger e
        equal jqconsole.$prompt.text().trim(), 'prompt_label \nprompt_continue'
        jqconsole.AbortPrompt()

      it 'handles tab', ->
        jqconsole.Prompt true, ->
        e = $.Event('keypress')
        e.which = 'a'.charCodeAt(0)
        jqconsole.$input_source.trigger e
        # Tab.
        e = $.Event('keydown')
        e.which = 9
        jqconsole.$input_source.trigger e
        equal jqconsole.$prompt.text().trim(), 'prompt_label  a'

      it 'handles shift+tab', ->
        e = $.Event('keydown')
        e.shiftKey = true
        e.which = 9
        jqconsole.$input_source.trigger e
        equal jqconsole.$prompt.text().trim(), 'prompt_labela'

