{jqconsole, typer: {typeA, keyDown, type}} = jqconsoleSetup()

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

  describe 'Typing', ->
    beforeEach -> jqconsole.Prompt true, ->
    afterEach -> jqconsole.AbortPrompt()

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

  describe '#GetPromptText', ->
    beforeEach -> jqconsole.Prompt true, ->
    afterEach -> jqconsole.AbortPrompt()

    it 'gets the current prompt text', ->
      type 'foo'
      equal jqconsole.$prompt.text().trim(), 'prompt_labelfoo'
      equal jqconsole.GetPromptText(), 'foo'

    it 'gets the current prompt text with the label', ->
      type 'foo'
      equal jqconsole.$prompt.text().trim(), 'prompt_labelfoo'
      equal jqconsole.GetPromptText(true), 'prompt_labelfoo'

  describe '#ClearPromptText', ->
    beforeEach -> jqconsole.Prompt true, ->
    afterEach -> jqconsole.AbortPrompt()

    it 'Clears the current prompt text', ->
      type 'foo'
      equal jqconsole.GetPromptText(), 'foo'
      jqconsole.ClearPromptText()
      equal jqconsole.GetPromptText(), ''

    it 'Clears prompt text with label', ->
      type 'foo'
      equal jqconsole.GetPromptText(), 'foo'
      jqconsole.ClearPromptText true
      equal jqconsole.GetPromptText(true), ''

  describe '#SetPromptText', ->
    beforeEach -> jqconsole.Prompt true, ->
    afterEach -> jqconsole.AbortPrompt()
    
    it 'sets the current prompt text', ->
      type 'bar'
      jqconsole.SetPromptText('foo')
      equal jqconsole.GetPromptText(), 'foo'

  describe 'Control Keys', ->
    beforeEach -> jqconsole.Prompt true, ->
    afterEach -> jqconsole.AbortPrompt()

    it 'handles enter', ->
      jqconsole.AbortPrompt()
      counter = 0
      jqconsole.Prompt true, -> counter++
      typeA()
      keyDown 13
      ok counter
      equal jqconsole.$console.find('.jqconsole-old-prompt').last().text().trim(), 'prompt_labela'
      # Restart the prompt for other tests.
      jqconsole.Prompt true, ->

    it 'handles shift+enter', ->
      keyDown 13, shiftKey: on
      equal jqconsole.$prompt.text().trim(), 'prompt_label \nprompt_continue'

    it 'handles tab', ->
      typeA()
      keyDown 9
      equal jqconsole.$prompt.text().trim(), 'prompt_label  a'

    it 'handles shift+tab', ->
      typeA()
      keyDown 9, shiftKey: on
      equal jqconsole.$prompt.text().trim(), 'prompt_labela'

    it 'backspace', ->
      typeA()
      keyDown 8
      equal jqconsole.$prompt.text().trim(), 'prompt_label'

    it 'cntrl+backspace', ->
      typeA()
      typeA()
      keyDown 8, metaKey: on
      equal jqconsole.$prompt.text().trim(), 'prompt_label'
