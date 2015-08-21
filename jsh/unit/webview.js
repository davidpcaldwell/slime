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

	window.addEventListener("load", function() {
		if (document.body.id == "ui") {
			document.getElementById("run").disabled = true;

			var xhr = new XMLHttpRequest();
			xhr.open("GET", "structure", false);
			xhr.send(null);
			var json = JSON.parse(xhr.responseText);
			console.log("structure", json);

			var View = function View(json) {
				this.element = document.createElement("div");
				this.element.className = "scenario";
				this.title = document.createElement("div");
				this.element.appendChild(this.title);
				this.title.appendChild(document.createTextNode(json.name));
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

				var result = document.createElement("div");
				this.element.appendChild(result);
				result.appendChild(document.createTextNode("Result: "));
				this.result = document.createElement("span");
				result.appendChild(this.result);

				var depth = [];

				var resolve = function(view,success) {
					view.result.innerHTML = (success) ? "Passed" : "Failed";
					colorCode(view.element,success);
				}

				this.dispatch = function(path,e) {
					if (path.length == 0) {
						if (e.type == "scenario") {
							if (e.detail.start) {
								if (!depth.length) {
									this.result.innerHTML = "Running";
									depth.push(this);
								} else {
									var begin = new View({ name: e.detail.start.name });
									depth[depth.length-1].tests.appendChild(begin.element);
									depth.push(begin);
								}
							} else if (e.detail.end) {
								if (depth.length > 0) {
									var current = depth[depth.length-1];
									depth.splice(depth.length-1,1);
									resolve(current,e.detail.success);
//									current.result.innerHTML = (e.detail.success) ? "Passed" : "Failed";
								} else {
									resolve(this,e.detail.success);
//									this.result.innerHTML = (e.detail.success) ? "Passed" : "Failed";
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
				var xhr = new XMLHttpRequest();
				xhr.open("POST", "run", false);
				xhr.send(null);
				var json = JSON.parse(xhr.responseText);
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