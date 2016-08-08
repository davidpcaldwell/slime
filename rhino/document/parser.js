var Jsoup = function(p) {
	Packages.java.lang.System.err.println("JSOUP!");
	var _doc = Packages.org.jsoup.Jsoup.parse(p.string);
	var _scripts = _doc.getElementsByTag("script");
	for (var i=0; i<_scripts.size(); i++) {
		var _script = _scripts.get(i);
		_script.html( String(_script.html()).replace(/\</g, "&lt;") );
	}
	_doc.outputSettings().syntax(Packages.org.jsoup.nodes.Document.OutputSettings.Syntax.xml);
	_doc.outputSettings().escapeMode(Packages.org.jsoup.nodes.Entities.EscapeMode.xhtml);
	_doc.outputSettings().charset("UTF-8");
	var rv = String(_doc.toString());
	return rv;
}

if ($context.api.java.getClass("org.jsoup.Jsoup")) {
	$exports.xhtml = Jsoup;
} else {
	$exports.xhtml = function(p) {
		Packages.java.lang.System.err.println("JavaFX!");
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
							result = String(rv);
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
}