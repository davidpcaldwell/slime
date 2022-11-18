//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { slime.jrunscript.Packages } Packages
	 * @param { slime.jsh.Global } jsh
	 */
	function(Packages,jsh) {
		var toJsonProperty = function(value,formatter) {
			if (typeof(value) == "undefined") return void(0);
			if (value === null) return null;
			return formatter(value);
		}

		var formatters = {
			directory: function(directory) {
				return {
					pathname: {
						string: directory.pathname.toString()
					},
					string: directory.toString()
				}
			}
		};

		var engines = {};
		if (jsh.java.getClass("org.mozilla.javascript.Context")) {
			engines.rhino = true;
			if (Packages.org.mozilla.javascript.Context.getCurrentContext()) {
				engines.current = {
					name: "rhino",
					optimization: Packages.org.mozilla.javascript.Context.getCurrentContext().getOptimizationLevel()
				};
			}
		}
		if (new Packages.javax.script.ScriptEngineManager().getEngineByName("nashorn")) {
			engines.nashorn = true;
		}
		if (jsh.shell.jsh.lib && jsh.shell.jsh.lib.getSubdirectory("graal")) {
			engines.graal = true;
		}

		var properties = {};
		var _properties = Packages.java.lang.System.getProperties();
		var _names = _properties.propertyNames();
		while(_names.hasMoreElements()) {
			var _name = _names.nextElement();
			properties[String(_name)] = String(_properties.get(_name));
		}

		jsh.shell.echo(JSON.stringify({
			engines: engines,
			jsr223: jsh.java.Array.adapt(new Packages.javax.script.ScriptEngineManager().getEngineFactories()).map(function(_factory) {
				return {
					name: String(_factory.getEngineName()),
					version: String(_factory.getEngineVersion()),
					names: jsh.java.Array.adapt(_factory.getNames()).map(function(name) { return String(name); })
				}
			}),
			"jsh.script.file": (typeof(jsh.script.file) != "undefined") ? {
				string: jsh.script.file.toString(),
				pathname: {
					string: jsh.script.file.pathname.toString()
				}
			} : void(0),
			"jsh.script.script": (typeof(jsh.script.script) != "undefined") ? {
				string: jsh.script.script.toString(),
				pathname: {
					string: jsh.script.script.pathname.toString()
				}
			} : void(0),
			"jsh.script.url": (typeof(jsh.script.url) != "undefined") ? {
				string: jsh.script.url.toString()
			} : void(0),
			"jsh.shell.jsh.src": toJsonProperty(jsh.shell.jsh.src, formatters.directory),
			"jsh.shell.jsh.home": toJsonProperty(jsh.shell.jsh.home, formatters.directory),
			"jsh.shell.jsh.url": toJsonProperty(jsh.shell.jsh.url, function(url) {
				return {
					path: url.path,
					string: url.toString()
				}
			}),
			properties: properties,
			"shellClasspath": String(jsh.loader.java.getClass("inonit.script.jsh.Shell").getProtectionDomain().getCodeSource().getLocation().toString())
		}, void(0), "    "));
	}
//@ts-ignore
)(Packages,jsh);
