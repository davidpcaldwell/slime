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
	var section = (function() {
		//	TODO	getElement allows future refactoring to provide alternative ID regime
		if (window == this) {
			return new function() {
				this.getElement = function(id) {
					return document.getElementById(id);
				};

				this.initialize = function(initialize) {
					window.addEventListener("load", initialize);
				}
			};
		} else {
			return new (function(o) {
				this.getElement = function(id) {
					return document.getElementById(id);
				}

				this.initialize = function(initialize) {
					o.initialize(initialize);
				}
			})(this.section);
		}
	}).call(this);

	var suite = (function() {
		if (window == this) {
			return new function() {
				this.getStructure = function() {
					var xhr = new XMLHttpRequest();
					xhr.open("GET", "structure", false);
					xhr.send(null);
					var json = JSON.parse(xhr.responseText);
					return json;
				};

				//	TODO	could do this asynchronously
				var getMessages = function() {
					var xhr = new XMLHttpRequest();
					xhr.open("GET", "messages", false);
					xhr.send(null);
					var json = JSON.parse(xhr.responseText);
					return json;
				};

				this.listen = function(view) {
					window.setInterval(function() {
						var json = getMessages();
						json.forEach(function(event) {
							view.dispatch(event.path,event);
						});
					}, 1000);
				};

				this.run = function(path) {
					var xhr = new XMLHttpRequest();
					xhr.open("POST", "run", false);
					xhr.send(JSON.stringify(path));
				};
			}
		} else {
			return this.suite;
		}
	}).call(this);

	var colorCode = function(rv,success) {
		rv.className = [rv.className,(success) ? "success" : "failure"].join(" ");
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
		}
		if (p.className) {
			rv.className = p.className;
		}
		if (typeof(p.success) != "undefined") {
			colorCode(rv,p.success);
		}
		return rv;
	}

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
				suite.run(path);
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
			view.result.innerHTML = ( (success) ? "Passed (" + elapsed + ")" : "Failed" ) + " at " + new Date(e.timestamp);
			colorCode(view.element,success);
		};

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
				var id = (typeof(child) == "string") ? child : child.id;
				parts[id].dispatch(further,e);
			}
		}
	};

	var initialize = function(p) {
		if (!p) p = {};
		document.getElementById("run").disabled = true;

		var json = suite.getStructure();

		var view = new View(json);

		document.getElementById("structure").appendChild(view.element);

		document.getElementById("run").disabled = false;

		suite.listen(view);

		var onclick = function() {
			view.clear();
			suite.run([]);
		}

		if (!p.onclick) {
			document.getElementById("run").addEventListener("click", onclick);
		} else {
			p.onclick(onclick);
		}
	};

	section.initialize(initialize);
}).call(this);
