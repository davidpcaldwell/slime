var parameters = jsh.script.getopts({
	options: {
		html: jsh.file.Pathname
	}
});

if (!parameters.options.html) {
	jsh.shell.console("Usage: " + jsh.script.file.pathname.basename + " <file>");
	jsh.shell.exit(1);
}

var _panel = new Packages.javafx.embed.swing.JFXPanel();

var lock = new jsh.java.Thread.Monitor();
var done;
var result;

var task = new JavaAdapter(
	Packages.java.lang.Runnable,
	new function() {
		this.run = function() {
			var browser = new Packages.javafx.scene.web.WebView();
			var window = browser.getEngine().executeScript("window");
			//	TODO	the below conditional duplicates code in rhino/ui/webview.js
			if (typeof(window.setMember) == "function") {
				window.setMember("data", parameters.options.html.file.read(String));
				window.setMember("type", "text/html");
				//	Rhino
			} else {
				//	Nashorn
				throw new Error("Unimplemented.");
			}
			var rv = browser.getEngine().executeScript(jsh.script.loader.get("parser.js").read(String));
			lock.Waiter({
				until: function() { return true; },
				then: function() {
					done = true;
					result = rv;
				}
			})();
		}
	}
);
Packages.javafx.application.Platform.runLater(task);
lock.Waiter({
	until: function() { return done; },
	then: function() {
		var document = new jsh.document.Document({ string: result });
		jsh.shell.echo(document);
		Packages.javafx.application.Platform.exit();
	}
})();
