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
		content.setAttribute("slot", slot);
		element.appendChild(content);
	}

	return {
		create: function(m) {
			var rv = document.createElement(p.extends, { is: p.tagName });
			var name = document.createElement("span");
			name.appendChild(document.createTextNode(p.name));
			for (var x in m.slots) {
				fillSlot(rv, x, m.slots[x]());
			}
			return rv;
		}
	}
}

var fiftyInterface = defineCustomElement({
	tagName: "fifty-interface",
	extends: "div"
});

var createFiftyInterface = function(p) {
	return fiftyInterface.create({
		slots: {
			name: function() {
				var name = document.createElement("span");
				name.appendChild(document.createTextNode(p.name));
				return name;
			}
		}
	});
}

window.addEventListener("load", function() {
	if (window.location.search == "?design") {
		var element = createFiftyInterface({ name: "a.a.name" });
		document.getElementById("interfaces").appendChild(element);
	} else {
		var tsc = inonit.loader.loader.get("tsc.json").read(JSON);
		for (var x in tsc.interfaces) {
			element = createFiftyInterface({ name: x });
			document.getElementById("interfaces").appendChild(element);
		}
	}
});
