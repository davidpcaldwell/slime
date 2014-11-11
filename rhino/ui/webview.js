$set(function(p) {
	var _ChangeListener = function(f) {
		return new JavaAdapter(
			Packages.javafx.beans.value.ChangeListener,
			new function() {
				this.changed = /* function(object,before,after) */ f;
			}
		);
	};

	var _Console = function(o) {
		return new JavaAdapter(
			Packages.inonit.javafx.webview.Console,
			(p.console) ? p.console : new function() {
				this.log = function(s) {
					$console.log.INFO("window.console.log: " + s);
				}				
			}
		);
	}

	var _Server = function(window) {
		var Server = function(window,serve) {
			this.call = function(json) {
				var object = JSON.parse(json);
				if (object.asynchronous) {
					$context.log.FINE("Got asynchronous: " + json);
					$context.api.thread.create(function() {
						$context.log.FINE("Generating response asynchronously: " + object.asynchronous);
						var response = serve(object.payload);
						$context.log.FINE("Generated response asynchronously: " + JSON.stringify(response));
						$context.api.thread.javafx(function() {
							try {
								window.call("postMessage", JSON.stringify({
									asynchronous: object.asynchronous,
									payload: response
								}), "*");

								$context.log.FINE("Posted message");
							} catch (e) {
								$context.log.WARNING("Did not post message: " + e);
							}													
						});
					});
				} else {
					return serve(object.payload);
				}
			}
		};

		return new JavaAdapter(
			Packages.inonit.javafx.webview.Server,
			new Server(window,p.serve)
		);
	}

	return function() {
		var browser = new Packages.javafx.scene.web.WebView();

		var location = (function() {
			if (p.page.file) {
				return {
					getLink: function(path) {
						return String(p.page.file.getRelativePath(path).java.adapt().toURI().toURL());
					},
					getCode: function(path) {
						return p.page.file.getRelativePath(path).file.read(String);
					}
				}
			} else if (p.page.document) {
				return {
					getLink: function(path) {
						return String(p.page.base.getRelativePath(path).java.adapt().toURI().toURL());
					},
					getCode: function(path) {
						var file = p.page.base.getRelativePath(path).file;
						//	TODO	would empty string work below? Would script render as empty element?
						if (!file) return "/**/";
						return file.read(String);
					}					
				}
			} else {
				throw new Error("Unsupported");
			}
		})();

		var xml = (function() {
			if (p.page.file) {
				//	TODO	parse document from p.page.file
				throw new Error("Unimplemented");
			} else if (p.page.document) {
				return p.page.document;
			} else {
				throw new Error("Unsupported xml");
			}
		})();

		browser.getEngine().setOnAlert(new JavaAdapter(
			Packages.javafx.event.EventHandler,
			new function() {
				this.handle = function(event) {
					var alert = (p.alert) ? p.alert : function(){};
					alert(event.getData());
				}
			}
		));

		if (p.popup) {
			browser.getEngine().setCreatePopupHandler(new JavaAdapter(
				Packages.javafx.util.Callback,
				new function() {
					this.call = function(_popup) {
						return p.popup.call({ _popup: _popup });
					}
				}
			))
		};

		browser.getEngine().getLoadWorker().stateProperty().addListener(new JavaAdapter(
			Packages.javafx.beans.value.ChangeListener,
			new function() {
				this.changed = function(object,before,after) {
					var window = browser.getEngine().executeScript("window");
					if (after == Packages.javafx.concurrent.Worker.State.RUNNING) {
						window.setMember("console", new _Console);
						browser.getEngine().executeScript($loader.resource("window.js").read(String));
						browser.getEngine().executeScript("window.jsh.message").call("initialize", new _Server(window,p.server));
						if (p.page.initialize) {
							p.page.initialize.call({ _browser: browser });
						}
					}
				}
			}
		));

		var events = $api.Events({
			source: this
		});

		browser.getEngine().titleProperty().addListener(_ChangeListener(function(object,before,after) {
			events.fire("title",{ before: before, after: after });
		}));

		(function preprocess(xml,location) {
			//	TODO	below 'preorder' copied from Slim preprocessor; need to build it into document API
			var preorder = function(node,process) {
				process(node);
				if (node.children) {
					node.children.forEach(function(child) {
						preorder(child,process);
					});
				}
			};

			preorder(xml.document.getElement(), function(node) {
				var isRelative = function(reference) {
					return true;
				}

				if (node.element && node.element.type.name == "link") {
					$context.log.FINE("Found link: " + node);
					var reference = node.element.attributes.get("href");

					if (isRelative(reference)) {
						node.element.attributes.set("href", location.getLink(reference));
					}
				} else if (node.element && node.element.type.name == "script") {
					$context.log.FINE("Found script: " + node);
					var reference = node.element.attributes.get("src");
					if (!reference) throw new Error("Missing src reference: " + node);

					if (isRelative(reference)) {
						node.element.attributes.set("inonit.loader.src", reference);
						node.element.attributes.set("src", null);
						node.children.push(new $context.api.document.Text({ text: location.getCode(reference) }));
					}
				}
			});
		})(xml,location);
		
		this._browser = browser;

		if (p.initialize) {
			p.initialize.call(this);
		}

		browser.getEngine().loadContent(xml.toString());

		var rv = new Packages.javafx.scene.Scene(browser, 750, 500, Packages.javafx.scene.paint.Color.web("#666970"));
		return rv;
	}
});
