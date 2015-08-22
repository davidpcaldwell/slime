//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2015 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

(function() {
	var current;

	var colorCode = function(rv,success) {
		rv.className = [rv.className,(success) ? "success" : "failure"].join(" ");
//			if (typeof(success) != "undefined") {
//				if (success) {
//					rv.style.backgroundColor = "#80ff80";
//				} else {
//					rv.style.backgroundColor = "#ff0000";
//				}
//			};
	}

	var testMessage = function(message) {
		var result = (message.detail.success) ? "Passed" : "Failed";
		if (message.detail.error) {
			result = "Error";
		}
		var text = result + ": " + message.detail.message;
		if (message.detail.error) {
			if (message.detail.error.stack) {
				text += " " + message.detail.error.stack;
			}
			if (message.detail.error.code) {
				text += " " +  message.detail.error.code;
			}
			if (message.detail.error.cause && message.detail.error.cause.stack) {
				text += " " + message.detail.error.cause.stack;
			}
		}
		return text;
	}

	var line = function(p) {
		var rv = document.createElement("div");
		if (p.text) {
			var lines = p.text.split("\n");
			for (var i=0; i<lines.length; i++) {
				if (i != 0) {
					var br = document.createElement("br");
					rv.appendChild(br);
				}
				var line = lines[i].replace(/\t/g, "    ").replace(/ /g, String.fromCharCode(160));
				rv.appendChild(document.createTextNode(line));
			}
//				var text = document.createTextNode(p.text);
//				rv.appendChild(text);
		}
		if (p.className) {
			rv.className = p.className;
		}
		if (typeof(p.success) != "undefined") {
			colorCode(rv,p.success);
		}
		return rv;
	}

	var handler = function(message) {
		var line = function(p) {
			var rv = document.createElement("div");
			if (p.text) {
				var lines = p.text.split("\n");
				for (var i=0; i<lines.length; i++) {
					if (i != 0) {
						var br = document.createElement("br");
						rv.appendChild(br);
					}
					var line = lines[i].replace(/\t/g, "    ").replace(/ /g, String.fromCharCode(160));
					rv.appendChild(document.createTextNode(line));
				}
//				var text = document.createTextNode(p.text);
//				rv.appendChild(text);
			}
			if (p.className) {
				rv.className = p.className;
			}
			if (typeof(p.success) != "undefined") {
				colorCode(rv,p.success);
			}
			return rv;
		}

		if (message.type == "scenario" && message.detail.start) {
			var div = document.createElement("div");
			div.className = "scenario";
			div.appendChild(line({ text: "Running: " + message.detail.start.name }));
			if (!current) {
				current = document.getElementById("scenario");
			}
			current.appendChild(div);
			current = div;
		} else if (message.type == "scenario" && message.detail.end) {
			var result = (message.detail.success) ? "Passed" : "Failed";
			current.appendChild(line({ text: result + ": " + message.detail.end.name }));
			colorCode(current,message.detail.success);
			current = current.parentNode;
		} else if (message.type == "test") {
			var result = (message.detail.success) ? "Passed" : "Failed";
			if (message.detail.error) {
				result = "Error";
			}
			var text = result + ": " + message.detail.message;
			if (message.detail.error) {
				if (message.detail.error.stack) {
					text += " " + message.detail.error.stack;
				}
				if (message.detail.error.code) {
					text += " " +  message.detail.error.code;
				}
				if (message.detail.error.cause && message.detail.error.cause.stack) {
					text += " " + message.detail.error.cause.stack;
				}
			}
			current.appendChild(line({ text: text, success: message.detail.success, className: "test" }));
		}
	};

	var run = function(path) {
		var xhr = new XMLHttpRequest();
		xhr.open("POST", "run", false);
		xhr.send(JSON.stringify(path));
	}

	window.addEventListener("load", function() {
		if (document.body.id == "ui") {
			document.getElementById("run").disabled = true;

			var xhr = new XMLHttpRequest();
			xhr.open("GET", "structure", false);
			xhr.send(null);
			var json = JSON.parse(xhr.responseText);

			var View = function View(json) {
				this.id = json.id;

				this.element = document.createElement("div");
				this.element.className = "scenario";
				this.header = document.createElement("div");
				this.element.appendChild(this.header);

				if (false) {
					this.enabled = document.createElement("input");
					this.enabled.type = "checkbox";
					this.enabled.checked = true;

					this.setEnabled = function(b) {
						this.enabled.checked = b;
						for (var x in parts) {
							if (parts[x].setEnabled) {
								parts[x].setEnabled(b);
							}
						}
					};
					var self = this;
					this.enabled.addEventListener("change", function(e) {
						console.log("checked",this.checked);
						self.setEnabled(this.checked);
					});
					//	TODO	toggling from true to false should toggle all
					//			descendants to false; from false to true should toggle
					//			all descendants to true
					this.header.appendChild(this.enabled);
				}

				var name = document.createElement("span");
				name.className = "name";
				name.appendChild(document.createTextNode(json.name));
				this.header.appendChild(name);

				if (json.id) {
					this.run = document.createElement("button");
					this.run.className = "node";
					this.run.appendChild(document.createTextNode("Run"));

					var self = this;
					this.run.addEventListener("click", function(e) {
						self.clear();
						var path = [json.id];
						var parent = self.element.parentNode;
						while(parent.model && parent.model.id) {
							path.unshift(parent.model.id);
							parent = parent.parentNode;
						}
						console.log("path", path);
						run(path);
					});
					this.header.appendChild(this.run);
				}

				this.element.model = this;

				var parts = {};

				if (json.parts) {
					for (var x in json.parts) {
						parts[x] = new View(json.parts[x]);
						this.element.appendChild(parts[x].element);
					}
				} else {
					this.tests = document.createElement("div");
					this.element.appendChild(this.tests);
				}

				this.clear = function() {
					this.element.className = this.element.className.replace(/success/g, "");
					this.element.className = this.element.className.replace(/failure/g, "");
					if (this.tests) {
						this.tests.innerHTML = "";
					}
					for (var x in parts) {
						parts[x].clear();
					}
				}

				var result = document.createElement("div");
				this.element.appendChild(result);
				result.appendChild(document.createTextNode("Result: "));
				this.result = document.createElement("span");
				result.appendChild(this.result);

				var depth = [];

				var start = function(view,e) {
					view.result.innerHTML = "Running ...";
					view.started = e.timestamp;
				}

				var resolve = function(view,e) {
					var success = e.detail.success;
					var elapsed = ((e.timestamp - view.started) / 1000).toFixed(3);
					view.result.innerHTML = (success) ? "Passed (" + elapsed + ")" : "Failed";
					colorCode(view.element,success);
				}

				this.dispatch = function(path,e) {
					if (path.length == 0) {
						if (e.type == "scenario") {
							if (e.detail.start) {
								if (!depth.length) {
									start(this,e);
									depth.push(this);
								} else {
									var begin = new View({ name: e.detail.start.name });
									depth[depth.length-1].tests.appendChild(begin.element);
									depth.push(begin);
									start(begin,e);
								}
							} else if (e.detail.end) {
								if (depth.length > 0) {
									var current = depth[depth.length-1];
									depth.splice(depth.length-1,1);
									resolve(current,e);
								} else {
									resolve(this,e);
								}
							}
						} else {
							var current = depth[depth.length-1];
							var element = line({ text: testMessage(e), success: e.detail.success, className: "test" })
							current.tests.appendChild(element);
						}
					} else {
						var child = path[0];
						var further = path.slice(1);
						parts[child].dispatch(further,e);
					}
				}
			};

			var view = new View(json);

			document.getElementById("structure").appendChild(view.element);

			document.getElementById("run").disabled = false;

			window.setInterval(function() {
				var xhr = new XMLHttpRequest();
				xhr.open("GET", "messages", false);
				xhr.send(null);
				var json = JSON.parse(xhr.responseText);
				json.forEach(function(event) {
					view.dispatch(event.path,event);
				});
			}, 1000);

			document.getElementById("run").addEventListener("click", function() {
				view.clear();
				run([]);
			});
		} else {
			if (!window.jsh) {
				window.setInterval(function() {
					var xhr = new XMLHttpRequest();
					xhr.open("GET", "messages", false);
					xhr.send(null);
					var json = JSON.parse(xhr.responseText);
					json.forEach(function(event) {
						handler(event);
					});
				}, 1000);
			}
		}
	});

	if (window.jsh) {
		window.jsh.message.handler(handler);
	}
})();