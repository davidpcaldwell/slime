(
	function(fifty: slime.fifty.test.kit) {
		var verify = fifty.verify;

		var module: slime.web.Exports = (function() {
			if (fifty.global.jsh) return fifty.$loader.module("module.js", fifty.$loader.file("context.java.js"));
			if (fifty.global.window) return fifty.$loader.module("module.browser.js");
		})();

		fifty.tests.suite = function() {
			var one = new module.Form({
				urlencoded: "foo=bar&a=b"
			});
			verify(one).controls[0].name.is("foo");
			verify(one).controls[0].value.is("bar");
			verify(one).controls[1].name.is("a");
			verify(one).controls[1].value.is("b");

			var controls = [{ name: "foo", value: "baz" }, { name: "c", value: "d" }];
			var two = new module.Form({
				controls: controls
			});
			verify(two).getUrlencoded().is("foo=baz&c=d");
		}
	}
//@ts-ignore
)(fifty)
