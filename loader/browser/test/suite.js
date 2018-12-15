window.addEventListener("load", function() {
	var parameters = (function() {
		if (window.location.search && window.location.search.length > 1) {
			var web = inonit.loader.loader.module("../../../js/web/", {
				// TODO: can this context be standardized in js/web itself?
				escaper: {
					encode: window.escape,
					decode: window.unescape
				}
			});
			var form = new web.Form({ urlencoded: window.location.search.substring(1) });
			var script = (function(controls) {
				for (var i=0; i<controls.length; i++) {
					if (controls[i].name == "suite") return controls[i].value;
				}
			})(form.controls);
			return { form: form, suite: script };
		}
	})();
	if (parameters.suite) {
		document.getElementById("nosuite").style.display = "none";
		var api = inonit.loader.loader.file("api.js");
		inonit.loader.loader.run(parameters.suite, {
			parameters: parameters.form,
			suite: api.suite,
			getPartDescriptor: function(string) {
				var base = (function(path) {
					var tokens = path.split("/");
					if (tokens.length == 1) return "";
					return tokens.slice(0,-1).join("/") + "/";
				})(parameters.suite);
				return api.getPartDescriptor(base + string);
			}
		});
	}
});
