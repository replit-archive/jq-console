#jq-console
A simple jQuery terminal plugin written in CoffeeScript.<br/>
This project was spawned because of our need for a simple web terminal plugin for the <a href="http://github.com/amasad/jsrepl">jsREPL</a> project.<br/> 
It trys to simulate bash, by having input and output states.

##Tested browsers
We have tested the plugin on the following browsers, however it may support others <br/>
<ul>
<li>IE 8 </li>
<li> Chrome </li>
<li> Firefox </li>
<li> Safari </li>
<li> Opera </li>
</ul>

##How to use:
###Instantiate the plugin:
`var jqconsole = $(div).jqconsole(WelcomeString);`<br/>
		div: is your div element or selector.<br/>
		WelcomeString: Being the string to be shown when the terminal is firt rendered.</br>
###How does it work
#####Configuration:
There isn't much initial configuration needed, because the user must supply options and callbacks with each state change.</br>
`jqconsole.RegisterShortCut` Register callbacks for specific keyboard shortcuts, all shortcuts currently is a combination of cntrl key + any_key_code.</br>
It takes two arguments, keyCode and callback.
Example:</br>
`// cntrl+r, resets console
jqconsole.RegisterShortCut(82, function (jqcnsle) {
	jqcnsle.Reset();	
});`</br></br>
####Usage
Unlike most plugins, jq-console gives you complete control over the plugin,</br>
meaning method calls must be made inorder to start input/output:</br>
`jqconsole.Input` takes three arguments: <br/>
<ol>
<li>boolean: Whether or not the current input to be stored in the terminal's history</li>
<li>Callback: A function that is called with the user's input when the user presses the enter key. Input operation is completed.</li>
<li>Callback: When the user presses the enter key and this callback is available then this function is called to check whether the input should continue to the next line. If this function returns a falsy value then the input operation is completed and the 2nd argument callback will be called, otherwise a new line will be added. </li>
</ol></br>
Example:
`jqconsole.Input(true, function (input) {
	alert(input);

}, function (input) {return false;});`</br></br>

`jqconsole.Write` Is used to write a static text to the terminal, usually used for output and writing the prompt label.</br>
It takes two arguments, text and class, the class being the DOM element class.</br>
Examples: <br/>
`jqconsole.Write(">>>", "prompt")`</br>
`jqconsole.write(output, "output")`</br>
`jqconsole.write(err.message, "error")`</br></br>

`jqconsole.SetPromptText` Sets the terminal current input text.</br>
Example: </br>
`jqconsole.SetPromptText("ls")`</br></br>
`jqconsole.Reset()` Resets the terminal to its initial state.</br>

##Contributers
<a href="http://max99x.com">Max Shawabkeh</a>
<a href="http://twitter.com/amasad">Amjad Masad</a>

