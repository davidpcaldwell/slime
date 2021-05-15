//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

(function() {
	var parser = jsh.loader.module(jsh.script.file.parent.parent.parent.parent.getRelativePath("loader/document/module.js"), {
		$slime: jsh.unit.$slime
	});
	var html = parser.load({
		loader: new jsh.file.Loader({ directory: jsh.shell.jsh.src }),
		path: "loader/api/test/data/1/api.html"
	});
	jsh.shell.console(html);

	var Node = function(delegate) {
		this.toString = function() {
			return "JSAPI Node";
		};

		if (delegate.element) return new Element(delegate);
	}

	var Element = function(delegate) {
		if (!delegate.children) throw new Error("delegate.children expected in " + delegate);

		this.toString = function() {
			return "JSAPI Element " + delegate.name;
		};

		this.getChildren = function() {
			return delegate.children.filter(function(node) { return node.element; }).map(function(node) {
				return new Node(node);
			});
		}
	}

	var Document = function(delegate) {
		this.toString = function() {
			return "JSAPI Document";
		};

		this.top = new Element(html.document.element);
	}

	var adapted = new Document(html);

	var tests = new jsh.unit.html.ApiHtmlTests(adapted, "Suite loaded using new HTML parser");
})();
