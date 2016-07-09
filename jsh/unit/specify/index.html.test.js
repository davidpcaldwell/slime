var api = $loader.file("loader/api/unit.js");
var unit = $loader.module("loader/browser/test/module.js", {
	api: {
		unit: api
	}
});
var ui = {
	document: (function() {
		var resource = $loader.get("jsh/unit/browser/ui.html");
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
styles.setAttribute("href", "../browser/ui.css");
document.head.insertBefore(styles, null);

$loader.run("jsh/unit/browser/webview.js", {}, {
	section: new function() {
		var onclick;

		this.initialize = function(initializer,handler) {
			document.getElementById("run").addEventListener("click", function(e) {
				if (!onclick) {
					initializer({ onclick: function(f) {
						onclick = f;
					}});
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
			view = arguments[0];
		};


		this.run = function() {
			unit.run(new function() {
				this.log = function(b,message) {
					console.log(b,message);
				};

				this.event = function(e) {
					console.log(e);
					view.dispatch(e.path,e);
				};

				this.end = function(b) {
				}
			})
		};
	}
});

var suite = new api.Suite({
	name: "Suite",
	parts: {
		all: {
			execute: function(scope,verify) {
				verify(1).is(1);
				verify(document).getElementById("target").contentDocument.title.is("__TITLE__");
				verify(document).getElementById("title").innerHTML.is("__TITLE__");
			}
		}
	}
});

unit.suite(suite);
