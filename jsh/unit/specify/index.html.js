window.addEventListener('load', function() {
    //	TODO	CORS
    //	TODO	template loaded for missing content contains SLIME license
    document.domain = document.domain;

    var xhr = new XMLHttpRequest();
    xhr.open("GET","../../../../$reload",false);
    xhr.send();

    var xhr = new XMLHttpRequest();
    xhr.open("GET","../../../../",false);
    xhr.send();
    var settings = JSON.parse(xhr.responseText);

    var react = function(f) {
        return function() {
            var iframe = document.getElementById("target");
            var content = iframe.contentDocument;
            f(iframe,content);
        };
    }

    var title = react(function(iframe,content) {
        document.getElementById("title").innerHTML = content.title;
    });

    window.contenteditable = true;

    var selection = (function() {
        var state = new function() {
            var current;

            this.is = function(element) {
            	return current && current.element == element;
            }
            
            this.select = function(element) {
				if (current) current.deselect();
				current = new function() {
					this.element = element;

					var was = element.style.backgroundColor;
					element.style.backgroundColor = "#c0c0ff";
					
					this.deselect = function() {
						element.style.backgroundColor = was;
					}
				};
            };
        };
        return state;
    })();

    var inline = function(callback) {
        var element = this;

        var listener = function(e) {
            if (e.key == "Enter") {
                if (this.contentEditable == "true") {
                    //  TODO    should restore to previous value, not false
                    this.contentEditable = "false";
                } else {
                    element.innerHTML = this.value;
                    element.inonit = null;
                }
                if (callback) callback();
            }
        };

        if (window.contenteditable) {
            if (this.contentEditable == "true") return;
            this.contentEditable = "true";
            this.addEventListener("keydown", listener);
        } else {
            if (this.inonit && this.inonit.inline) return;
            var html = this.innerHTML;
            this.innerHTML = "";
            var input = document.createElement("input");
            input.value = html;
            this.appendChild(input);
            input.addEventListener("keydown", listener);
            this.inonit = { inline: true };
        }
    };

    document.getElementById("target").addEventListener("load", function(e) {
        title();

        var content = document.getElementById("target").contentDocument;

        document.getElementById("title").addEventListener("click", function(e) {
            if (false) {
                this.contentEditable = "true";
            } else {
                var self = this;
                inline.call(this,function() {
                    var title = content.getElementsByTagName("title");
                    if (title.length == 0) {
                        //	TODO	probably add one
                        throw new Error("No title element in content");
                    } else {
                        title[0].innerHTML = self.innerHTML;
                    }
                });
            }
        });

        this.contentDocument.addEventListener("click", function(e) {
			if (!selection.is(e.target)) {
				selection.select(e.target);
			}
        });
        

		var base = inonit.loader.base.split("/").slice(0,-3).join("/") + "/";

		if (settings.debug) {
			var loader = new inonit.loader.Loader(base);
			loader.run("slime/jsh/unit/specify/index.html.test.js", {
				$loader: new loader.Child("slime/")
			});
		}
    });

    document.getElementById("target").src = window.location + "../../../../../../filesystem/" + settings.api.substring(1);
});
