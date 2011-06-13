#jq-console

A simple jQuery terminal plugin written in CoffeeScript.

This project was spawned because of our need for a simple web terminal plugin 
for the <a href="http://github.com/amasad/jsrepl">jsREPL</a> project. It
tries to simulate a low level terminal by providing (almost) raw input/output
streams as well as input and output states.

Version 2.0 adds baked-in support for rich multi-line prompting and operation
queueing.

NOTE: This info is for jq-console v2.0. For jq-console v1.0 see README-v1.md.


##Tested Browsers

The plugin has been tested on the following browsers:

* IE 9
* Chrome 10
* Firefox 3.6
* Firefox 4
* Opera 11


##Getting Started

###Instantiating

    var jqconsole = $(div).jqconsole(welcomeString, promptLabel, continueLabel);

* `div` is the div element or selector.
* `welcomeString` is the string to be shown when the terminal is first rendered.
* `promptLabel` is the label to be shown before the input when using Prompt().
* `continueLabel` is the label to be shown before the continued lines of the
  input when using Prompt().

###Configuration

There isn't much initial configuration needed, because the user must supply
options and callbacks with each state change. There are a few config methods
provided to create custom shortcuts and change indentation width:

* `jqconsole.RegisterShortcut`: Registers a callback for a keyboard shortcut.
  Takes two arguments:

    * `(int|string) keyCode`: The code of the key pressing which (when Ctrl is
      held) will trigger this shortcut. If a string is provided, the ASCII code
      of the first character is taken.

    * `function callback`: A function called when the shortcut is pressed;
      "this" will point to the JQConsole object.

    Example:

        // Ctrl+R: resets the console.
        jqconsole.RegisterShortCut('R', function() {
          this.Reset();
        });

* `jqconsole.SetIndentWidth`: Sets the number of spaces inserted when indenting
  and removed when unindenting. Takes one argument:

    * `int width`: The code of the key pressing which (when Ctrl is held) will
      trigger this shortcut.

    Example:

        // Sets the indent width to 4 spaces.
        jqconsole.SetIndentWidth(4);


##Usage

Unlike most terminal plugins, jq-console gives you complete low-level control
over the execution; you have to call the appropriate methods to start input
or output:

* `jqconsole.Input`: Asks user for input. If another input or prompt operation
  is currently underway, the new input operation is enqueued and will be called
  when the current operation and all previously enqueued operations finish.
  Takes one argument:

    * `function input_callback: A function called with the user's input when
      the user presses Enter and the input operation is complete.

    Example:

        // Echo the input.
        jqconsole.Input(function(input) {
          jqconsole.Write(input);
        });

* `jqconsole.Prompt`: Asks user for input. If another input or prompt operation
  is currently underway, the new prompt operation is enqueued and will be called
  when the current operation and all previously enqueued operations finish.
  Takes three arguments:

    * `bool history_enabled`: Whether this input should use history. If true,
      the user can select the input from history, and their input will also be
      added as a new history item.

    * `function result_callback`: A function called with the user's input when
      the user presses Enter and the prompt operation is complete.

    * `function multiline_callback`: If specified, this function is called when
      the user presses Enter to check whether the input should continue to the
      next line. If this function returns a falsy value, the input operation
      is completed. Otherwise, input continues and the cursor moves to the next
      line.

    Example:

        jqconsole.Prompt(true, function(input) {
          // Alert the user with the command.
          alert(input);
        }, function (input) {
          // Continue if the last character is a backslash.
          return /\\$/.test(input);
        });

* `jqconsole.AbortPrompt`: Aborts the current prompt operation and returns to
  output mode or the next queued input/prompt operation. Takes no arguments.

    Example:

        jqconsole.Prompt(true, function(input) {
          alert(input);
        });
        // Give the user 2 seconds to enter the command.
        setTimeout(function() {
          jqconsole.AbortPrompt();
        }, 2000);

* `jqconsole.Write`: Writes the given text to the console in a `<span>`, with an 
  optional class. This is used for output and writing prompt labels. Takes two
  arguments:

    * `string text`: The text to write.

    * `string cls`: The class to give the span containing the text. Optional.

    Examples:

        jqconsole.Write(output, 'my-output-class')
        jqconsole.Write(err.message, 'my-error-class')

* `jqconsole.SetPromptText`: Sets the text currently in the input prompt. Takes
  one parameter:

    * `string text`: The text to put in the prompt.

    Examples:

        jqconsole.SetPromptText('ls')
        jqconsole.SetPromptText('print [i ** 2 for i in range(10)]')

* `jqconsole.ClearPromptText`: Clears all the text currently in the input
  prompt. Takes one parameter:

    * `bool clear_label`: If specified and true, also clears the main prompt
      label (e.g. ">>>").

    Example:

        jqconsole.ClearPromptText()

* `jqconsole.GetPromptText`: Returns the contents of the prompt. Takes one
  parameter:

    * `bool full`: If specified and true, also includes the prompt labels
      (e.g. ">>>").

    Examples:

        var currentCommand = jqconsole.GetPromptText()
        var logEntry = jqconsole.GetPromptText(true)

* `jqconsole.Reset`: Resets the console to its initial state, cancelling all
  current and pending operations. Takes no parameters.

    Example:

        jqconsole.Reset()

* `jqconsole.GetColumn`: Returns the 0-based number of the column on which the
  cursor currently is. Takes no parameters.

    Example:

        // Show the current line and column in a status area.
        $('#status').text(jqconsole.GetLine() + ', ' + jqconsole.GetColumn())

* `jqconsole.GetLine`: Returns the 0-based number of the line on which the
  cursor currently is. Takes no parameters.

    Example:

        // Show the current line and column in a status area.
        $('#status').text(jqconsole.GetLine() + ', ' + jqconsole.GetColumn())

* `jqconsole.Focus`: Forces the focus onto the console so events can be
  captured. Takes no parameters.

    Example:

        // Redirect focus to the console whenever the user clicks anywhere.
        $(window).click(function() {
          jqconsole.Focus();
        })

* `jqconsole.GetIndentWidth`: Returns the number of spaces inserted when
  indenting. Takes no parameters.

    Example:

        jqconsole.SetIndentWidth(4);
        console.assert(jqconsole.GetIndentWidth() == 4);


##Default Key Config

The console responds to the followind keys and key combinations by default:

* `Delete`: Delete the following character.
* `Ctrl+Delete`: Delete the following word.
* `Backspace`: Delete the preceding character.
* `Ctrl+Backspace`: Delete the preceding word.

* `Ctrl+Left`: Move one word to the left.
* `Ctrl+Right`: Move one word to the right.
* `Home`: Move to the beginning of the current line.
* `Ctrl+Home`: Move to the beginnig of the first line.
* `End`: Move to the end of the current line.
* `Ctrl+End`: Move to the end of the last line.
* `Shift+Up`, `Ctrl+Up`: Move cursor to the line above the current one.
* `Shift+Down`, `Ctrl+Down`: Move cursor to the line below the current one.

* `Tab`: Indent.
* `Shift+Tab`: Unindent.

* `Up`: Previous history item.
* `Down`: Next history item.

* `Enter`: Finish input/prompt operation. See Input() and Prompt() for details.
* `Shift+Enter`: New line.


##CSS Classes

Several CSS classes are provided to help stylize the console:

* `jqconsole`: The main console container.
* `jqconsole-cursor`: The cursor.
* `jqconsole-header`: The welcome message at the top of the console.
* `jqconsole-input`: The prompt area during input. May have multiple lines.
* `jqconsole-old-input`: Previously-entered inputs.
* `jqconsole-prompt`: The prompt area during prompting. May have multiple lines.
* `jqconsole-old-prompt`: Previously-entered prompts.

Of course, custom classes may be specified when using `jqconsole.Write()` for
further customization.


##Contributors

[Max Shawabkeh](http://max99x.com/)  
[Amjad Masad](http://twitter.com/amjad_masad)
