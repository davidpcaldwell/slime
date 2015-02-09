//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//
//	The Original Code is the SLIME Java GUI module.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2014 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

$set(function(p) {
	var _ChangeListener = function(f) {
		return new JavaAdapter(
			Packages.javafx.beans.value.ChangeListener,
			new function() {
				this.changed = /* function(object,before,after) */ f;
			}
		);
	};

	var console = (p.console) ? p.console : new function() {
		this.log = function() {
			$context.log.INFO("window.console.log: " + Array.prototype.slice.call(arguments).join("|"));
		}
	};

	var _Server = function(window,serve,navigate) {
		var Server = function(window,serve,navigate) {
			this.call = function(json) {
				var object = JSON.parse(json);
				$context.log.FINE("Received: " + JSON.stringify(object,void(0),"    "));
				if (object.navigate) {
					if (navigate) navigate(object.navigate);
					return;
				}
				if (object.console) {
					if (object.console.log) {
						console.log.apply(console, object.console.log);
					}
					return;
				}
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
					if (serve) return serve(object.payload);
					$context.log.WARNING("No serve for payload " + json);
				}
			}
		};

		return new JavaAdapter(
			Packages.inonit.javafx.webview.Server,
			new Server(window,serve,navigate)
		);
	};

	var getXml = function(page) {
		if (page.file) {
			//	TODO	parse document from p.page.file
			throw new Error("Unimplemented");
		} else if (page.document) {
			return page.document;
		} else {
			throw new Error("Unsupported xml");
		}
	}

	var getLocation = function(page) {
		if (page.file) {
			return {
				getFileUrl: function(path) {
					return String(page.file.getRelativePath(path).java.adapt().toURI().toURL());
				},
				getCode: function(path) {
					return page.file.getRelativePath(path).file.read(String);
				}
			}
		} else if (page.document) {
			return {
				getFileUrl: function(path) {
					return String(page.base.getRelativePath(path).java.adapt().toURI().toURL());
				},
				getCode: function(path) {
					var file = page.base.getRelativePath(path).file;
					if (!file) {
						if (path == "webview.initialize.js") {
							return $loader.resource("webview.initialize.js").read(String);
						}
					}
					if (!file) return "";
					return file.read(String);
				}
			}
		} else {
			throw new Error("Unsupported");
		}
	}

	return function() {
		var browser = (p.browser) ? p.browser : new Packages.javafx.scene.web.WebView();

		var page = p.page;

		var target = this;

		//	TODO	why are there two different methods handling these magic messages? Is one obsolete?
		
		
		var setAlertHandler = function(engine) {
			var alertHandler = new JavaAdapter(
				Packages.javafx.event.EventHandler,
				new function() {
					this.handle = function(event) {
						var alert = (p.alert) ? p.alert : function(s) {
							$context.log.INFO("ALERT: " + s);
						}
						alert(event.getData());
					}
				}
			);

			engine.setOnAlert(alertHandler);			
		};
		
		var addStatusChangeListener = function(engine) {
			engine.setOnStatusChanged(new JavaAdapter(
				Packages.javafx.event.EventHandler,
				new function() {
					this.handle = function(event) {
						if (event.getData() == "window.jsh") {
							browser.getEngine().executeScript($loader.resource("webview.window.js").read(String));
						}
						if (event.getData() == "window.jsh.message.initialize") {
							var window = browser.getEngine().executeScript("window");
							browser.getEngine().executeScript("window.jsh.message").call(
								"initialize",
								new _Server(window,p.serve,(p.navigate) ? p.navigate.bind(target) : null)
							);
							if (page && page.initialize) {
								page.initialize.call({ _browser: browser });
							}
							return;
						}
						var status = (p.status) ? p.status : function(){};
						status(event.getData());
					}
				}
			));			
		};
		
		var addLoadWorkerListener = function(engine) {
			engine.getLoadWorker().stateProperty().addListener(new JavaAdapter(
				Packages.javafx.beans.value.ChangeListener,
				new function() {
					this.changed = function(observableValue,oldState,newState) {
						if (String(newState.toString()) == "RUNNING") {
							engine.executeScript("window").setMember(
								"console", 
								new JavaAdapter(
									Packages.inonit.javafx.webview.Console,
									console
								)
							);
							engine.executeScript($loader.resource("webview.initialize.js").read(String));
						}
						if (String(newState.toString()) == "SUCCEEDED") {
							engine.executeScript($loader.resource("webview.window.onload.js").read(String));
						}
					}
				}
			));
		}
		
		var configureEngine = function(engine) {
			setAlertHandler(engine);		
			addLoadWorkerListener(engine);
			addStatusChangeListener(engine);			
		};
		
		configureEngine(browser.getEngine());

		if (p.popup) {
			browser.getEngine().setCreatePopupHandler(new JavaAdapter(
				Packages.javafx.util.Callback,
				new function() {
					this.call = function(_popup) {
						var rv = p.popup.call({ _popup: _popup });
						configureEngine(rv);
						return rv;
					}
				}
			))
		};

		var events = $api.Events({
			source: this
		});

		browser.getEngine().titleProperty().addListener(_ChangeListener(function(object,before,after) {
			events.fire("title",{ before: before, after: after });
		}));

		this.navigate = function(to) {
			page = to;
			if (!page.url) {
				var preprocess = function(xml,location) {
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
							if (reference == "slime://jsh/window.js") return false;
							return true;
						}

						if (node.element && node.element.type.name == "head") {
							var windowScript = $loader.resource("webview.window.js").read(String);
							var scriptElement = new $context.api.document.Element({
								type: {
									name: "script"
								}
							});
							scriptElement.element.attributes.set("src", "slime://jsh/window.js");
							scriptElement.children.push(new $context.api.document.Text({ text: windowScript }));
							node.children.splice(0,0,scriptElement);
						}

						if (node.element && node.element.type.name == "link") {
							$context.log.FINE("Found link: " + node);
							var reference = node.element.attributes.get("href");

							if (isRelative(reference)) {
								node.element.attributes.set("href", location.getFileUrl(reference));
							}
						}
						if (node.element && node.element.type.name == "script") {
							$context.log.FINE("Found script: " + node);
							var reference = node.element.attributes.get("src");
							if (!reference) throw new Error("Missing src reference: " + node);

							if (isRelative(reference)) {
								node.element.attributes.set("inonit.loader.src", reference);
								node.element.attributes.set("src", null);
								node.children.push(new $context.api.document.Text({ text: location.getCode(reference) }));
							} else if (/^slime\:/.test(reference)) {
								node.element.attributes.set("inonit.loader.src", reference);
								node.element.attributes.set("src", null);
							}
						}
					});
					$context.log.FINE("xml = " + xml);
					return xml.toString();
				};

				var preprocessed = preprocess(getXml(page),getLocation(page));
				browser.getEngine().loadContent(preprocessed);
			} else {
				browser.getEngine().load(page.url);
			}
		}

		this._browser = browser;

		if (false) {
			browser.setOnKeyPressed(new JavaAdapter(
				Packages.javafx.event.EventHandler,
				new function() {
					this.handle = function(event) {
						Packages.java.lang.System.err.println("key pressed: " + event);
					}
				}
			));

			browser.setOnKeyTyped(new JavaAdapter(
				Packages.javafx.event.EventHandler,
				new function() {
					this.handle = function(event) {
						Packages.java.lang.System.err.println("key typed: " + event);
					}
				}
			));
		}

		if (p.initialize) {
			p.initialize.call(this);
		}

		if (p.page) {
			this.navigate(p.page);
		}

		var rv = new Packages.javafx.scene.Scene(browser, 750, 500, Packages.javafx.scene.paint.Color.web("#666970"));
		return rv;
	}
});