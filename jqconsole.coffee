# Shorthand for jQuery.
$ = jQuery

# The states in which the console can be.
STATE_INPUT = 0
STATE_OUTPUT = 1

# Key code values.
KEY_ENTER = 13
KEY_TAB = 9
KEY_DELETE = 46
KEY_BACKSPACE = 8
KEY_LEFT = 37
KEY_RIGHT = 39
KEY_UP = 38
KEY_DOWN = 40
KEY_HOME = 36
KEY_END = 35

class JQConsole
  # Creates a console.
  #   @arg container: The DOM element into which the console is inserted.
  #   @arg header: Text to print at the top of the console on reset. Optional.
  constructor: (container, header) ->
    # The header written when the console is reset.
    @header = header ? ''

    # By default, the console is in the output state.
    @state = STATE_OUTPUT

    # Previous lines saved during multi-line input.
    @saved_lines = []

    # The function to call when the user pushes Enter. Valid only in input mode.
    @enter_callback = null
    # The function to call to determine whether the input should continue to the
    # next line.
    @multiline_callback = null

    # A table of all "recorded" inputs given so far.
    @history = []
    # The index of the currently selected history item. If this is past the end
    # of @history, then the user has not selected a history item.
    @history_index = 0
    # The command which the user was typing before browsing history. Keeping
    # track of this allows us to restore the user's command if they browse the
    # history then decide to go back to what they were typing.
    @history_new = ''
    # Whether the current input operation is using history.
    @history_active = false

    # A table of custom shortcuts, mapping character codes to callbacks.
    @shortcuts = {}

    # The main console area. Everything else happens inside this.
    @$console = $('<pre class="jqconsole">').appendTo container

    # The movable prompt span. When the console is in input mode, this is shown
    # and allows user input. Divided into the areas before and after the cursor.
    @$prompt = $('<span class="jqconsole-input">')
    @$prompt_left = $('<span>').appendTo @$prompt
    @$prompt_left.css position: 'relative'
    @$prompt_right = $('<span>').appendTo @$prompt
    @$prompt_right.css position: 'relative'
    # The cursor. A span containing a space that shades its following character.
    # If the font of the prompt is not monospace, the content should be set to
    # the first character of @$prompt_right to get the appropriate width.
    @$prompt_cursor = $('<span class="jqconsole-cursor"> </span>')
    @$prompt_cursor.insertBefore @$prompt_right
    @$prompt_cursor.css
      color: 'transparent'
      display: 'inline-block'
      position: 'absolute'
      zIndex: 0

    # A hidden textbox which captures the user input when the console is in
    # input mode. Needed to be able to intercept paste events.
    @$input_source = $('<textarea>', style: "position: absolute; left: -9999px")
    @$input_source.appendTo container

    # Prepare console for interaction.
    @SetupEvents()
    @Write @header, 'jqconsole-header'

    # Save this instance to be accessed if lost.
    # TODO(max99x): Check if needed.
    $(container).data 'jqconsole', this

  # Resets the console to its initial state.
  Reset: ->
    @history = []
    @history_index = 0
    @history_current = ''
    @state = STATE_OUTPUT
    @shortcuts = {}
    @$prompt_left.text ''
    @$prompt_right.text ''
    if @$prompt.parent() then @$prompt.detach()
    @$console.html ''
    @Write @header, 'jqconsole-header'

  # Registers a Ctrl+Key shortcut.
  #   @arg key_code: The code of the key pressing which (when Ctrl is held) will
  #     trigger this shortcut.
  #   @arg callback: A function called when the shortcut is pressed; "this" will
  #     point to the JQConsole object.
  RegisterShortcut: (key_code, callback) ->
    key_code = parseInt(key_code, 10)
    if isNaN(key_code) or not 0 < key_code < 256
      throw new Error 'Key code must be a number between 0 and 256 exclusive.'
    if not callback instanceof Function
      throw new Error 'Callback must be a function, not ' + callback + '.'
    if not @shortcuts[key_code]? then @shortcuts[key_code] = []
    @shortcuts[key_code].push(callback)

  # Writes the given text to the console in a <span>, with an optional class.
  #   @arg text: The text to write.
  #   @arg cls: The class to give the span containing the text. Optional.
  Write: (text, cls) ->
    if @state != STATE_OUTPUT
      throw new Error 'Write() is only allowed in output state.'
    span = $ '<span>'
    span.text text
    if cls?
      span.addClass cls
    span.appendTo @$console
    @ScrollToEnd()

  # Returns the text currently in the input prompt.
  GetPromptText: ->
    if @state != STATE_INPUT
      throw new Error 'GetPromptText() is only allowed in input state.'
    return @$prompt_left.text() + @$prompt_right.text()

  # Sets the text currently in the input prompt.
  #   @arg text: The text to put in the prompt.
  SetPromptText: (text) ->
    if @state != STATE_INPUT
      throw new Error 'SetPromptText() is only allowed in input state.'
    # TODO(max99x): Handle multi-line input.
    @$prompt_left.text text
    @$prompt_right.text ''
    @ScrollToEnd()

  # Starts an input operation.
  #   @arg history_enabled: Whether this input should use history. If true, the
  #     user can select the input from history, and their input will also be
  #     added as a new history item.
  #   @arg result_callback: A function called with the user's input when the
  #     user presses Enter.
  #   @arg multiline_callback: If specified, this function is called when the
  #     the user presses Enter to check whether the input should continue to the
  #     next line. If this function returns a falsy value, the input operation
  #     is completed. Otherwise, input continues and the cursor moves to the
  #     next line.
  Input: (history_enabled, result_callback, multiline_callback) ->
    if @state != STATE_OUTPUT
      throw new Error 'Input() is only allowed in output state.'
    @history_active = history_enabled
    @enter_callback = result_callback
    @multiline_callback = multiline_callback
    @$prompt.appendTo @$console
    @Focus()
    @ScrollToEnd()
    @state = STATE_INPUT

  # Sets focus on the console so input can be read.
  Focus: ->
    @$input_source.focus()

  ###------------------------ Private Methods -------------------------------###

  # Binds all the required input and focus events.
  SetupEvents: ->
    # Always redirect focus to the hidden textbox.
    @$console.mouseup => @Focus()

    # Intercept pasting.
    @$input_source.bind 'paste', =>
      handlePaste = =>
        @$prompt_left.text @$prompt_left.text() + @$input_source.val()
        @$input_source.val ''
        @$input_source.focus()  # TODO(max99x): Check if needed.
      setTimeout handlePaste, 0

    @$input_source.keypress (e) =>
      @HandleChar e
    key_event = if $.browser.mozilla then 'keypress' else 'keydown'
    @$input_source[key_event] (e) =>
      @HandleKey e

  # Scrolls the console area to its bottom.
  ScrollToEnd: ->
    @$console.scrollTop @$console[0].scrollHeight

  # Handles a character key press.
  #   @arg event: The jQuery keyboard Event object to handle.
  HandleChar: (event) ->
    # We let the browser take over during output mode.
    if @state == STATE_OUTPUT then return true

    # IE & Chrome capture non-control characters and Enter.
    # Mozilla captures everything.

    # Skip control characters which are captured on Mozilla.
    if $.browser.mozilla and not event.charCode then return false

    # IE captures on keyCode.
    char_code = event.charCode or event.keyCode

    # Skip Enter on IE and Chrome.
    if char_code == 13 then return false

    # Skip everything when a modifier key other than shift is held.
    if event.metaKey or event.ctrlKey or event.altKey then return false

    @$prompt_left.text @$prompt_left.text() + String.fromCharCode char_code
    @ScrollToEnd()
    return false

  # Handles a key up event and dispatches specific handlers.
  #   @arg event: The jQuery keyboard Event object to handle.
  HandleKey: (event) ->
    # We let the browser take over during output mode.
    if @state == STATE_OUTPUT then return true

    # Handle shortcuts.
    if event.altKey or event.shiftKey or (event.metaKey and not event.ctrlKey)
      # Allow non-Ctrl or multi-modifier shortcuts.
      return true
    else if event.ctrlKey
      return @HandleCtrlShortcut event.keyCode
    else
      # Not a modifier shortcut.
      key = event.keyCode
      switch key
        when KEY_ENTER then @HandleEnter(event.shiftKey)
        when KEY_TAB then @InsertTab()
        when KEY_DELETE then @Delete false
        when KEY_BACKSPACE then @Backspace false
        when KEY_LEFT then @MoveLeft false
        when KEY_RIGHT then @MoveRight false
        when KEY_UP then @HistoryPrevious()
        when KEY_DOWN then @HistoryNext()
        when KEY_HOME then @MoveToStart()
        when KEY_END then @MoveToEnd()
        # Let any other key continue its way to keypress.
        else return true
      return false

  # Handles a Ctrl+Key shortcut.
  #   @arg key: The keyCode of the pressed key.
  HandleCtrlShortcut: (key) ->
    switch key
      when KEY_DELETE then @Delete true
      when KEY_BACKSPACE then @Backspace true
      when KEY_LEFT then @MoveLeft true
      when KEY_RIGHT then @MoveRight true
      else
        if @shortcuts[key]?
          # Execute custom shortcuts.
          handler.call(this) for handler in @shortcuts[key]
          return false
        else
          # Allow unhandled Ctrl shortcuts.
          return true
    # Block handled shortcuts.
    return false

  # Moves the cursor to the left.
  #   @arg whole_word: Whether to move by a whole word rather than a character.
  MoveLeft: (whole_word) ->
    text = @$prompt_left.text()
    if not text then return
    if whole_word
      word = text.match /\w*\W*$/
      if not word then return
      word = word[0]
      @$prompt_right.text word + @$prompt_right.text()
      @$prompt_left.text text[...-word.length]
    else
      @$prompt_right.text text[-1...] + @$prompt_right.text()
      @$prompt_left.text text[...-1]

  # Moves the cursor to the right.
  #   @arg whole_word: Whether to move by a whole word rather than a character.
  MoveRight: (whole_word) ->
    text = @$prompt_right.text()
    if not text then return
    if whole_word
      word = text.match /^\w*\W*/
      if not word then return
      word = word[0]
      @$prompt_left.text @$prompt_left.text() + word
      @$prompt_right.text text[word.length...]
    else
      @$prompt_left.text @$prompt_left.text() + text[0]
      @$prompt_right.text text[1...]

  # Deletes the character or word following the cursor.
  #   @arg whole_word: Whether to delete a whole word rather than a character.
  Delete: (whole_word) ->
    text = @$prompt_right.text()
    if not text then return
    if whole_word
      word = text.match /^\w*\W*/
      if not word then return
      word = word[0]
      @$prompt_right.text text[word.length...]
    else
      @$prompt_right.text text[1...]

  # Deletes the character or word preceding the cursor.
  #   @arg whole_word: Whether to delete a whole word rather than a character.
  Backspace: (whole_word) ->
    text = @$prompt_left.text()
    if not text then return
    if whole_word
      word = text.match /\w*\W*$/
      if not word then return
      word = word[0]
      @$prompt_left.text text[...-word.length]
    else
      @$prompt_left.text text[...-1]

  # Deletes the character or word preceding the cursor.
  InsertTab: ->
    # TODO(max99x): Make tab size configurable.
    @$prompt_left.append '  '

  # Moves the cursor to the start of the prompt.
  MoveToStart: ->
    @$prompt_right.text @$prompt_left.text() + @$prompt_right.text()
    @$prompt_left.text ''

  # Moves the cursor to the end of the prompt.
  MoveToEnd: ->
    @$prompt_left.text @$prompt_left.text() + @$prompt_right.text()
    @$prompt_right.text ''

  # Sets the prompt to the previous history item.
  HistoryPrevious: ->
    # TODO(max99x): Handle multi-line items.
    if not @history_active then return
    if @history_index <= 0 then return
    if @history_index == @history.length
      @history_new = @GetPromptText()
    @SetPromptText @history[--@history_index]

  # Sets the prompt to the next history item.
  HistoryNext: ->
    # TODO(max99x): Handle multi-line items.
    if not @history_active then return
    if @history_index >= @history.length then return
    if @history_index == @history.length - 1
      @history_index++
      @SetPromptText @history_new
    else
      @SetPromptText @history[++@history_index]

  # Handles the user pressing the Enter key.
  #   @arg shift: Whether the shift key is held.
  HandleEnter: (shift) ->
    if shift
      # TODO(max99x): Add a new line.
    else
      @saved_lines.push @GetPromptText()
      @SetPromptText ''
      text = @saved_lines.join '\n'
      if @multiline_callback and @multiline_callback(text)
        # TODO(max99x): Add a new line.
      else
        # Done with input.
        if @history_active
          if not @history.length or @history[@history.length - 1] != text
            @history.push text
            @history_index = @history.length
        @saved_lines = []
        @$prompt.detach()
        @state = STATE_OUTPUT
        @Write text + '\n'
        callback = @enter_callback
        @enter_callback = null
        callback text


$.fn.jqconsole = (header) -> new JQConsole(this, header)
