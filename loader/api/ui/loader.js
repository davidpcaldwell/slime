//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//
//	The Original Code is the SLIME loader infrastructure.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2016 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

$set(function(p) {
	var $loader = new inonit.loader.Loader(inonit.loader.base + "../");
	var api = $loader.file("loader/api/unit.js");
	var unit = $loader.module("loader/browser/test/module.js", {
		api: {
			unit: api,
			Promise: window.Promise
		}
	});
	var ui = {
		document: (function() {
			var resource = $loader.get("loader/api/ui/ui.html");
			var doc = document.implementation.createHTMLDocument("");
			doc.documentElement.innerHTML = resource.string;
			return doc;
		})()
	};

	var suite = document.createElement("div");
	suite.setAttribute("id", "ui");
	var from = ui.document.body;
	var nodes = from.childNodes;
	//	Remove the #sourceURL thing
	//	TODO	remove the need for this
	from.removeChild(nodes[nodes.length-1]);
	for (var i=0; i<nodes.length; i++) {
		suite.appendChild(nodes[i].cloneNode(true));
	}
	document.body.insertBefore(suite, document.body.childNodes[0]);

	var styles = document.createElement("link");
	styles.setAttribute("rel", "stylesheet");
	styles.setAttribute("type", "text/css");
	styles.setAttribute("href", inonit.loader.base + "../" + "loader/api/ui/ui.css");
	document.head.insertBefore(styles, null);

	$loader.run("loader/api/ui/webview.js", {}, {
		section: new function() {
			var onclick;

			this.initialize = function(initializer) {
				//  webview.js invokes this and provides an initializer that, when executed, initializes the UI and provides an onclick
				//  handler that can be added to a button outside the UI
				document.getElementById("run").addEventListener("click", function(e) {
					if (!onclick) {
						initializer({
							onclick: function(f) {
								onclick = f;
							}
						});
					}
					onclick(e);
				});
			};
		},
		suite: new function() {
			var view;

			this.getStructure = function() {
				return unit.structure();
			};

			this.listen = function() {
				//  webview.js provides a View object for the suite, which consists of a bunch of nested View objects.
				view = arguments[0];
			};

			this.run = function() {
				//  the loader/browser/test/module.js implementation of run() adds appropriate listeners to the global suite and then runs it,
				//  issuing callbacks for each event delivered to those listeners. We then dispatch those events to the top-level view, which
				//  dispatches them to the nested views
				unit.run(new function() {
					var events = [];

					this.log = function(b,message) {
						console.log(b,message);
					};

					this.event = function(e) {
						console.log(e);
						events.push(e);
						view.dispatch(e.path,e);
						if (!e.path.length && e.detail.end) {
							var xhr = new XMLHttpRequest();
							xhr.open("POST","result",false);
							xhr.send(
								(p && p.events) ? JSON.stringify({ events: events, success: e.detail.success }) : e.detail.success
							);
						}
					};

					this.end = function(b) {
					}
				})
			};
		}
	});

	return {
		api: api,
		unit: unit,
		suite: function(v) {
			unit.suite(v);

			if (window.location.search && window.location.search.indexOf("unit.run") != -1) {
				var event = new Event("click");
				document.getElementById("run").dispatchEvent(event);
			}
		},
		setPath: function(path) {
			unit.setPath(path);
		}
	};
});

//     var scenario = new unit.Scenario();
//     scenario.test(new function() {
//         this.check = function(verify) {
//             if (window.location.search && window.location.search.indexOf("success") != -1) {
//                 verify(1).is(1);
//             } else {
//                 verify(1).is(2);
//             }
//         }
//     });

//     var suite = new api.Suite({
//         name: "Suite",
//         parts: {
//             scenario: scenario
//         }
//     });

//    unit.suite(p.suite);
//});