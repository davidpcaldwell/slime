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

//	TODO	should be able to refactor this into a specification file, or at least a test file paired with
//			the API, perhaps
var whitespace = new unit.Scenario();
whitespace.target(inonit.loader.loader.value("whitespace.js"));
whitespace.test(new function() {
	this.check = function(verify) {
		verify(this).evaluate.property("before").is.type("function");
		verify(this).before("\t\ta").is("\t\t");
		verify(this).before("\t\t").is("\t\t");
		verify(this).before("a").is("");
		verify(this).before("").is("");

		verify(this).after("\t\tb").is("");
		verify(this).after("\t\tb\t").is("\t");
		verify(this).after("b\t").is("\t");
		verify(this).after("b").is("");
		verify(this).after("").is("");
		verify(this).after("a\t\tb\t").is("\t");

		var is = function(s) {
			return function() {
				return this.is(s);
			}
		};

		verify(this).evaluate(is("")).is(true);
		verify(this).evaluate(is(" ")).is(true);
		verify(this).evaluate(is("\t")).is(true);
		verify(this).evaluate(is("a")).is(false);
		verify(this).evaluate(is(" a")).is(false);
		verify(this).evaluate(is("a ")).is(false);
		verify(this).evaluate(is(" a ")).is(false);

		verify(this).common(["\t\ta", "\ta"]).is("\t");
		verify(this).common(["\t\ta", "\t    a"]).is("\t");
		verify(this).common(["\t\ta", "a"]).is("");
		verify(this).common(["", "\t\ta", "\ta", "\tb", "\t"]).is("\t");
	}
});

var page = new function() {
	this.getHeadRows = function() {
		return document.getElementById("head").getElementsByTagName("table")[0].getElementsByTagName("tbody")[0].rows;
	}
}

var initial = new unit.Scenario();
initial.test({
	check: function(verify) {
		verify(document).getElementById("target").contentDocument.title.is("__TITLE__");
		verify(document).getElementById("title").innerHTML.is("__TITLE__");
		//	Make sure license comment is stripped from API template
		verify(document).getElementById("target").contentDocument.childNodes[0].nodeType.is.not(8);
	}
});

var title = new unit.Scenario();
title.target({
	titleRow: function() {
		var tbody = document.getElementById("head").getElementsByTagName("table")[0].getElementsByTagName("tbody")[0];
		var titleRow = tbody.rows[0];
		return titleRow;
	},
	titleSpan: function() {
		return this.titleRow().cells[1].children[0];		
	}
});
title.test({
	check: function(verify) {
		verify(this).titleRow().tagName.is("TR");
		verify(this).titleSpan().tagName.is("SPAN");
	}
});
title.test({
	run: function() {
		unit.fire.click(this.titleSpan());
	},
	check: function(verify) {
		verify(this).titleSpan().contentEditable.is("true");
	}
});
title.test({
	run: function() {
		unit.fire.click(this.titleSpan());
		this.titleSpan().innerHTML = "foo";
		unit.fire.keydown(this.titleSpan(), {
			key: "Enter"
		});
	},
	check: function(verify) {
		verify(this).titleSpan().evaluate.property("inonit").is.equalTo(null);
		verify(this).titleSpan().innerHTML.is("foo");
		verify(document).getElementById("title").evaluate.property("inonit").is.equalTo(null);
		verify(document).getElementById("title").innerHTML.is("foo");
		verify(document).getElementById("target").contentDocument.title.is("foo");
		verify(document).getElementById("target").contentDocument.getElementsByTagName("title")[0].innerHTML.is("foo");
	}
});
title.test({
	run: function() {
		unit.fire.click(this.titleSpan());
		this.titleSpan().innerHTML = "bar";
		unit.fire.keydown(this.titleSpan(), {
			key: "Enter"
		});
	},
	check: function(verify) {
		verify(this).titleSpan().evaluate.property("inonit").is.equalTo(null);
		verify(this).titleSpan().innerHTML.is("bar");
		verify(document).getElementById("title").evaluate.property("inonit").is.equalTo(null);
		verify(document).getElementById("title").innerHTML.is("bar");
		verify(document).getElementById("target").contentDocument.title.is("bar");
		verify(document).getElementById("target").contentDocument.getElementsByTagName("title")[0].innerHTML.is("bar");
	}
});

var comment = new unit.Scenario();
comment.target(new function() {
	var comment = function(row) {
		row.getTextArea = function() {
			return this.cells[1].getElementsByTagName("textarea")[0];
		}
		return row;
	};

	this.getApiLocationComment = function() {
		return comment(page.getHeadRows()[1]);
	}

	this.getApiProtocolComment = function() {
		return comment(page.getHeadRows()[2]);
	}
});
comment.test({
	check: function(verify) {
		verify(this).getApiLocationComment().cells[0].innerHTML.is("(comment)");
		var propertyStartsWith = function(name,prefix) {
			return function() {
				return this[name].substring(0,prefix.length) == prefix;
			};
		}
		verify(this).getApiLocationComment().getTextArea().evaluate(propertyStartsWith("value","TODO")).is(true);
		var lines = this.getApiProtocolComment().getTextArea().value.split("\n");
		verify(lines).length.is(2);
		verify(lines).evaluate(propertyStartsWith(0,"These")).is(true);
		verify(lines).evaluate(propertyStartsWith(1,"work")).is(true);
	}
});

var selection = new unit.Scenario();
selection.target(new function() {
	this.content = new function() {
		var content = document.getElementById("target").contentDocument;
		this.description = content.getElementsByTagName("div")[0];
		this.contextHeader = content.getElementsByTagName("h1")[0];
		this.exportsHeader = content.getElementsByTagName("h1")[1];
	};

	this.isSelected = function(element) {
		//	TODO	DRY violation
		var dummy = document.createElement("div");
		dummy.style.backgroundColor = "#c0c0ff";
		return element.style.backgroundColor == dummy.style.backgroundColor;
	}
});
selection.test({
	check: function(verify) {
		var page = this;
		verify(this).content.description.innerHTML.is("__DESCRIPTION__");
		verify(this).content.description.evaluate(function() { return page.isSelected(this); }).is(false);
	}
});
selection.test({
	run: function() {
		unit.fire.click(this.content.description);
	},
	check: function(verify) {
		var page = this;
		verify(this).content.description.evaluate(function() { return page.isSelected(this); }).is(true);
	}
});
selection.test({
	run: function() {
		unit.fire.click(this.content.contextHeader);
	},
	check: function(verify) {
		var page = this;
		verify(this).content.description.evaluate(function() { return page.isSelected(this); }).is(false);
		verify(this).content.contextHeader.evaluate(function() { return page.isSelected(this); }).is(true);
	}
});

var suite = new api.Suite({
	name: "Suite",
	parts: {
		whitespace: whitespace,
		initial: initial,
		title: title,
		comment: comment,
		selection: selection
	}
});

unit.suite(suite);
