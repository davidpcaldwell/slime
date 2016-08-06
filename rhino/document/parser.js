$exports.xhtml = function(p) {
	var _panel = new Packages.javafx.embed.swing.JFXPanel();

	var lock = new $context.api.java.Thread.Monitor();
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
					window.setMember("data", p.string);
					window.setMember("type", "text/html");
					//	Rhino
				} else {
					//	Nashorn
					throw new Error("Unimplemented.");
				}
				var rv = browser.getEngine().executeScript($loader.get("parser.browser.js").read(String));
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
	return lock.Waiter({
		until: function() { return done; },
		then: function() {
			return result;
//			var document = new jsh.document.Document({ string: result });
//			Packages.javafx.application.Platform.exit();
//			return document;
		}
	})();	
};
