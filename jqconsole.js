(function() {
  var $, JQConsole, KEY_BACKSPACE, KEY_DELETE, KEY_DOWN, KEY_END, KEY_ENTER, KEY_HOME, KEY_LEFT, KEY_RIGHT, KEY_TAB, KEY_UP, STATE_INPUT, STATE_OUTPUT;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  $ = jQuery;
  STATE_INPUT = 0;
  STATE_OUTPUT = 1;
  KEY_ENTER = 13;
  KEY_TAB = 9;
  KEY_DELETE = 46;
  KEY_BACKSPACE = 8;
  KEY_LEFT = 37;
  KEY_RIGHT = 39;
  KEY_UP = 38;
  KEY_DOWN = 40;
  KEY_HOME = 36;
  KEY_END = 35;
  JQConsole = (function() {
    function JQConsole(container, header) {
      this.header = header != null ? header : '';
      this.state = STATE_OUTPUT;
      this.saved_lines = [];
      this.enter_callback = null;
      this.multiline_callback = null;
      this.history = [];
      this.history_index = 0;
      this.history_new = '';
      this.history_active = false;
      this.shortcuts = {};
      this.$console = $('<pre class="jqconsole"/>').appendTo(container);
      this.$prompt = $('<span class="jqconsole-input"/>');
      this.$prompt_left = $('<span/>').appendTo(this.$prompt);
      this.$prompt_left.css({
        position: 'relative'
      });
      this.$prompt_right = $('<span/>').appendTo(this.$prompt);
      this.$prompt_right.css({
        position: 'relative'
      });
      this.$prompt_cursor = $('<span class="jqconsole-cursor"> </span>');
      this.$prompt_cursor.insertBefore(this.$prompt_right);
      this.$prompt_cursor.css({
        color: 'transparent',
        display: 'inline',
        position: 'absolute',
        zIndex: 0
      });
      this.$input_source = $('<textarea/>');
      this.$input_source.css({
        position: 'absolute',
        left: '-9999px'
      });
      this.$input_source.appendTo(container);
      this.SetupEvents();
      this.Write(this.header, 'jqconsole-header');
      $(container).data('jqconsole', this);
    }
    JQConsole.prototype.Reset = function() {
      this.history = [];
      this.history_index = 0;
      this.history_current = '';
      this.state = STATE_OUTPUT;
      this.shortcuts = {};
      this.$prompt_left.text('');
      this.$prompt_right.text('');
      if (this.$prompt.parent()) {
        this.$prompt.detach();
      }
      this.$console.html('');
      return this.Write(this.header, 'jqconsole-header');
    };
    JQConsole.prototype.RegisterShortcut = function(key_code, callback) {
      key_code = parseInt(key_code, 10);
      if (isNaN(key_code) || (!0 < key_code && key_code < 256)) {
        throw new Error('Key code must be a number between 0 and 256 exclusive.');
      }
      if (!callback instanceof Function) {
        throw new Error('Callback must be a function, not ' + callback + '.');
      }
      if (!(this.shortcuts[key_code] != null)) {
        this.shortcuts[key_code] = [];
      }
      return this.shortcuts[key_code].push(callback);
    };
    JQConsole.prototype.Write = function(text, cls) {
      var span;
      if (this.state !== STATE_OUTPUT) {
        throw new Error('Write() is only allowed in output state.');
      }
      span = $('<span>');
      span.text(text);
      if (cls != null) {
        span.addClass(cls);
      }
      span.appendTo(this.$console);
      return this.ScrollToEnd();
    };
    JQConsole.prototype.GetPromptText = function() {
      if (this.state !== STATE_INPUT) {
        throw new Error('GetPromptText() is only allowed in input state.');
      }
      return this.$prompt_left.text() + this.$prompt_right.text();
    };
    JQConsole.prototype.SetPromptText = function(text) {
      if (this.state !== STATE_INPUT) {
        throw new Error('SetPromptText() is only allowed in input state.');
      }
      this.$prompt_left.text(text);
      this.$prompt_right.text('');
      return this.ScrollToEnd();
    };
    JQConsole.prototype.Input = function(history_enabled, result_callback, multiline_callback) {
      if (this.state !== STATE_OUTPUT) {
        throw new Error('Input() is only allowed in output state.');
      }
      this.history_active = history_enabled;
      this.enter_callback = result_callback;
      this.multiline_callback = multiline_callback;
      this.$prompt.appendTo(this.$console);
      this.Focus();
      this.ScrollToEnd();
      return this.state = STATE_INPUT;
    };
    JQConsole.prototype.Focus = function() {
      return this.$input_source.focus();
    };
    /*------------------------ Private Methods -------------------------------*/
    JQConsole.prototype.SetupEvents = function() {
      var key_event;
      this.$console.mouseup(__bind(function() {
        return this.Focus();
      }, this));
      this.$input_source.bind('paste', __bind(function() {
        var handlePaste;
        handlePaste = __bind(function() {
          this.$prompt_left.text(this.$prompt_left.text() + this.$input_source.val());
          this.$input_source.val('');
          return this.$input_source.focus();
        }, this);
        return setTimeout(handlePaste, 0);
      }, this));
      this.$input_source.keypress(__bind(function(e) {
        return this.HandleChar(e);
      }, this));
      key_event = $.browser.mozilla ? 'keypress' : 'keydown';
      return this.$input_source[key_event](__bind(function(e) {
        return this.HandleKey(e);
      }, this));
    };
    JQConsole.prototype.ScrollToEnd = function() {
      return this.$console.scrollTop(this.$console[0].scrollHeight);
    };
    JQConsole.prototype.HandleChar = function(event) {
      var char_code;
      if (this.state === STATE_OUTPUT) {
        return true;
      }
      if ($.browser.mozilla && !event.charCode) {
        return true;
      }
      if ($.browser.opera && !event.which) {
        return true;
      }
      char_code = event.which;
      if (char_code === 13 || char_code === 9) {
        return false;
      }
      if (event.metaKey || event.ctrlKey || event.altKey) {
        return false;
      }
      this.$prompt_left.text(this.$prompt_left.text() + String.fromCharCode(char_code));
      this.ScrollToEnd();
      return false;
    };
    JQConsole.prototype.HandleKey = function(event) {
      var key;
      if (this.state === STATE_OUTPUT) {
        return true;
      }
      if (event.altKey || event.shiftKey || (event.metaKey && !event.ctrlKey)) {
        return true;
      } else if (event.ctrlKey) {
        return this.HandleCtrlShortcut(event.keyCode);
      } else {
        key = event.keyCode;
        switch (key) {
          case KEY_ENTER:
            this.HandleEnter(event.shiftKey);
            break;
          case KEY_TAB:
            this.InsertTab();
            break;
          case KEY_DELETE:
            this.Delete(false);
            break;
          case KEY_BACKSPACE:
            this.Backspace(false);
            break;
          case KEY_LEFT:
            this.MoveLeft(false);
            break;
          case KEY_RIGHT:
            this.MoveRight(false);
            break;
          case KEY_UP:
            this.HistoryPrevious();
            break;
          case KEY_DOWN:
            this.HistoryNext();
            break;
          case KEY_HOME:
            this.MoveToStart();
            break;
          case KEY_END:
            this.MoveToEnd();
            break;
          default:
            return true;
        }
        return false;
      }
    };
    JQConsole.prototype.HandleCtrlShortcut = function(key) {
      var handler, _i, _len, _ref;
      switch (key) {
        case KEY_DELETE:
          this.Delete(true);
          break;
        case KEY_BACKSPACE:
          this.Backspace(true);
          break;
        case KEY_LEFT:
          this.MoveLeft(true);
          break;
        case KEY_RIGHT:
          this.MoveRight(true);
          break;
        default:
          if (this.shortcuts[key] != null) {
            _ref = this.shortcuts[key];
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              handler = _ref[_i];
              handler.call(this);
            }
            return false;
          } else {
            return true;
          }
      }
      return false;
    };
    JQConsole.prototype.MoveLeft = function(whole_word) {
      var text, word;
      text = this.$prompt_left.text();
      if (!text) {
        return;
      }
      if (whole_word) {
        word = text.match(/\w*\W*$/);
        if (!word) {
          return;
        }
        word = word[0];
        this.$prompt_right.text(word + this.$prompt_right.text());
        return this.$prompt_left.text(text.slice(0, -word.length));
      } else {
        this.$prompt_right.text(text.slice(-1) + this.$prompt_right.text());
        return this.$prompt_left.text(text.slice(0, -1));
      }
    };
    JQConsole.prototype.MoveRight = function(whole_word) {
      var text, word;
      text = this.$prompt_right.text();
      if (!text) {
        return;
      }
      if (whole_word) {
        word = text.match(/^\w*\W*/);
        if (!word) {
          return;
        }
        word = word[0];
        this.$prompt_left.text(this.$prompt_left.text() + word);
        return this.$prompt_right.text(text.slice(word.length));
      } else {
        this.$prompt_left.text(this.$prompt_left.text() + text[0]);
        return this.$prompt_right.text(text.slice(1));
      }
    };
    JQConsole.prototype.Delete = function(whole_word) {
      var text, word;
      text = this.$prompt_right.text();
      if (!text) {
        return;
      }
      if (whole_word) {
        word = text.match(/^\w*\W*/);
        if (!word) {
          return;
        }
        word = word[0];
        return this.$prompt_right.text(text.slice(word.length));
      } else {
        return this.$prompt_right.text(text.slice(1));
      }
    };
    JQConsole.prototype.Backspace = function(whole_word) {
      var text, word;
      text = this.$prompt_left.text();
      if (!text) {
        return;
      }
      if (whole_word) {
        word = text.match(/\w*\W*$/);
        if (!word) {
          return;
        }
        word = word[0];
        return this.$prompt_left.text(text.slice(0, -word.length));
      } else {
        return this.$prompt_left.text(text.slice(0, -1));
      }
    };
    JQConsole.prototype.InsertTab = function() {
      return this.$prompt_left.append('  ');
    };
    JQConsole.prototype.MoveToStart = function() {
      this.$prompt_right.text(this.$prompt_left.text() + this.$prompt_right.text());
      return this.$prompt_left.text('');
    };
    JQConsole.prototype.MoveToEnd = function() {
      this.$prompt_left.text(this.$prompt_left.text() + this.$prompt_right.text());
      return this.$prompt_right.text('');
    };
    JQConsole.prototype.HistoryPrevious = function() {
      if (!this.history_active) {
        return;
      }
      if (this.history_index <= 0) {
        return;
      }
      if (this.history_index === this.history.length) {
        this.history_new = this.GetPromptText();
      }
      return this.SetPromptText(this.history[--this.history_index]);
    };
    JQConsole.prototype.HistoryNext = function() {
      if (!this.history_active) {
        return;
      }
      if (this.history_index >= this.history.length) {
        return;
      }
      if (this.history_index === this.history.length - 1) {
        this.history_index++;
        return this.SetPromptText(this.history_new);
      } else {
        return this.SetPromptText(this.history[++this.history_index]);
      }
    };
    JQConsole.prototype.HandleEnter = function(shift) {
      var callback, text;
      if (shift) {
        ;
      } else {
        this.saved_lines.push(this.GetPromptText());
        this.SetPromptText('');
        text = this.saved_lines.join('\n');
        if (this.multiline_callback && this.multiline_callback(text)) {
          ;
        } else {
          if (this.history_active) {
            if (!this.history.length || this.history[this.history.length - 1] !== text) {
              this.history.push(text);
              this.history_index = this.history.length;
            }
          }
          this.saved_lines = [];
          this.$prompt.detach();
          this.state = STATE_OUTPUT;
          this.Write(text + '\n');
          callback = this.enter_callback;
          this.enter_callback = null;
          return callback(text);
        }
      }
    };
    return JQConsole;
  })();
  $.fn.jqconsole = function(header) {
    return new JQConsole(this, header);
  };
}).call(this);
