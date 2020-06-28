var defineCustomElement = function(p) {
	var Super = document.createElement(p.extends).constructor;

	var model = function() {
		return document.getElementById(p.tagName).content.cloneNode(true);
	}

	var Constructor = function() {
		var rv = Reflect.construct(Super, [], Constructor);
		var shadow = rv.attachShadow({ mode: "open" })
		shadow.appendChild(model());
		rv.connectedCallback = function() {
			debugger;
		}
		return rv;
	}
	Constructor.prototype = Object.create(Super.prototype);

	customElements.define(p.tagName, Constructor, { extends: p.extends });

	var fillSlot = function(element,slot,content) {
		if (content) {
			content.setAttribute("slot", slot);
			element.appendChild(content);
		}
	}

	return {
		create: function(m) {
			var rv = document.createElement(p.extends, { is: p.tagName });
			for (var x in p.slots) {
				fillSlot(rv, x, p.slots[x](m));
			}
			if (p.initialize) p.initialize.call(rv, m);
			return rv;
		}
	}
}

var fiftyProperty = defineCustomElement({
	tagName: "fifty-property",
	extends: "div",
	slots: new function() {
		var typeToElement = function(type) {
			var span = document.createElement("span");
			if (type && type.name) {
				//	TODO	allow text nodes to eliminate this indirection?
				var text = type.name;
				span.appendChild(document.createTextNode(text));
				if (type.arguments) {
					var container = document.createElement("span");
					container.appendChild(document.createTextNode("<"));
					type.arguments.forEach(function(argument) {
						container.appendChild(typeToElement(argument));
					});
					container.appendChild(document.createTextNode(">"));
					span.appendChild(container);
				}
			} else if (type && type.parameters) {
				if (type.constructor === true) span.appendChild(document.createTextNode("new "));
				span.appendChild(document.createTextNode("("));
				type.parameters.forEach(function(parameter,index,array) {
					span.appendChild(document.createTextNode(parameter.name + ": "));
					span.appendChild(typeToElement(parameter.type));
					if (index != array.length-1) {
						span.appendChild(document.createTextNode(", "));
					}
				})
				span.appendChild(document.createTextNode(")"));
				if (type.returns) {
					span.appendChild(document.createTextNode(": "));
					span.appendChild(typeToElement(type.returns));
				}
			} else if (type && type.string) {
				span.appendChild(document.createTextNode(type.string));
			}
			return span;
		}

		this.name = function(p) {
			var name = document.createElement("span");
			var suffix = (p.type.parameters) ? "()" : "";
			name.appendChild(document.createTextNode(p.name + suffix));
			return name;
		};

		this.type = function(p) {
			return typeToElement(p.type);
		}
	},
	initialize: function(p) {
		if (p.type.parameters) {
			this.shadowRoot.querySelector(".name").className += " method";
		} else if (p.type.name) {
			this.shadowRoot.querySelector(".name").className += " property";
		}
	}
});

var fiftyInterface = defineCustomElement({
	tagName: "fifty-interface",
	extends: "div",
	slots: {
		name: function(p) {
			var name = document.createElement("span");
			name.appendChild(document.createTextNode(p.name));
			return name;
		},
		properties: function(p) {
			var rv = document.createElement("div");
			p.members.forEach(function(member) {
				var child = fiftyProperty.create(member);
				rv.appendChild(child);
			});
			return rv;
		}
	}
});

window.addEventListener("load", function() {
	if (window.location.search == "?design") {
		var element = fiftyInterface.create({
			name: "a.a.name",
			members: [
				{
					name: "field",
					type: {
						name: "string"
					}
				},
				{
					name: "method",
					type: {
						parameters: []
					}
				}
			]
		});
		document.getElementById("interfaces").appendChild(element);
	} else {
		var tsc = inonit.loader.loader.get("tsc.json").read(JSON);
		for (var x in tsc.interfaces) {
			var type = tsc.interfaces[x];
			var members = type.members;
			element = fiftyInterface.create({ name: x, members: members });
			document.getElementById("interfaces").appendChild(element);
		}
	}
});
