#jq-console
A simple jQuery terminal plugin written in CoffeeScript.<br/>
This project was spawned because of our need for a simple web terminal plugin for the <a href="http://github.com/amasad/jsrepl">jsREPL</a> project.<br/> 
It trys to simulate bash, by having input and output support.

##Tested browsers
We have tested the plugin on the following browsers, however it may support other <br/>
<ul>
<li>IE 8 </li>
<li> Chrome </li>
<li> Firefox </li>
<li> Safari </li>
<li> Opera </li>
</ul>

##How to use:
Instantiate the plugin:
	$(div).jqconsole(WelcomeString);
		div: is your div element or selector.
		WelcomeString: Being the string to be shown when the terminal is firt rendered.

