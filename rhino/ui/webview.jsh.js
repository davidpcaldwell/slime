var parameters = jsh.script.getopts({
	options: {
		servlet: jsh.file.Pathname
	}
});
var servlet = parameters.options.servlet.file;
var server = new jsh.httpd.Tomcat({});
server.map({
	path: "/",
	servlets: {
		"/*": {
			file: parameters.options.servlet.file
		}
	}
});
server.start();

var stopTomcat = new JavaAdapter(
	Packages.java.lang.Runnable,
	new function() {
		this.run = function() {
			server.stop();
		}
	}
);

Packages.java.lang.Runtime.getRuntime().addShutdownHook(new Packages.java.lang.Thread(stopTomcat));

jsh.ui.javafx.launch({
	title: "WebView",	//	TODO	default
	Scene: jsh.ui.javafx.WebView({
		page: { url: "http://127.0.0.1:" + server.port + "/" },
		//	TODO	configurable
		alert: function(s) {
			jsh.shell.echo("ALERT: " + s);
		},
		popup: function(_popup) {
			if (!_popup) _popup = this._popup;
			jsh.shell.echo("Creating popup " + _popup + " ...");
			var view = new Packages.javafx.scene.web.WebView();
			var frame = new jsh.ui.javafx.Frame({
				Scene: jsh.ui.javafx.WebView({
					initialize: function() {
						jsh.shell.echo("Popup initialized ...");
					}
				}),
				on: {
					close: function() {
						this.close();
					}
				}
			});
			return view.getEngine();
		},
		//	TODO	configurable
		console: new function() {
			this.log = function(s) {
				jsh.shell.echo("CONSOLE: " + s);
			}
		},
		//	TODO	configurable
		initialize: function() {
			this.listeners.add("title", function(e) {
				this._frame.setTitle(e.detail.after);
			});
		}
	})
});	
