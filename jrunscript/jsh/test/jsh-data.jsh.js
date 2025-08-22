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
	 * @param { slime.$api.Global } $api
	 * @param { slime.jsh.Global } jsh
	 */
	function(Packages,$api,jsh) {
		var code = {
			/** @type { slime.jrunscript.bootstrap.Script } */
			bootstrap: jsh.script.loader.script("../../../rhino/jrunscript/embed.js")
		};

		var JSH_EMBED_BOOTSTRAP_DEBUG = Boolean(jsh.shell.environment.JSH_EMBED_BOOTSTRAP_DEBUG);

		/** @type { slime.internal.jrunscript.bootstrap.Configuration["script"] } */
		var script = (
			function() {
				if (jsh.shell.jsh.src) return { file: jsh.shell.jsh.src.getFile("rhino/jrunscript/api.js").toString() };
				if (jsh.shell.jsh.url) return { url: jsh.shell.jsh.url + "rhino/jrunscript/api.js?api" };
				if (jsh.shell.jsh.home) return { file: jsh.shell.jsh.home.getRelativePath("jsh.js").toString() };
			}
		)();

		//	TODO	for now, we just don't load the embedding in packaged shells, because it doesn't seem worth it to figure out
		//			how to do that at the moment. Might become more feasible with more discipline surrounding the embedding and
		//			packaging code.
		var bootstrap = (script) ? code.bootstrap({
			debug: JSH_EMBED_BOOTSTRAP_DEBUG,
			script: script
		}) : void(0);

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
		if (bootstrap && bootstrap.engine.rhino.isPresent()) {
			engines.rhino = true;
			if (bootstrap && bootstrap.engine.rhino.running()) {
				engines.current = {
					name: "rhino",
					version: String(bootstrap.engine.rhino.running().getImplementationVersion()),
					optimization: bootstrap.engine.rhino.running().getOptimizationLevel()
				};
			}
		}
		if (bootstrap && bootstrap.engine.nashorn.isPresent()) {
			engines.nashorn = true;
			var isBreakOnExceptions = $api.engine.debugger ? $api.engine.debugger.isBreakOnExceptions() : void(0);
			if (isBreakOnExceptions) $api.engine.debugger.setBreakOnExceptions(false);
			if (bootstrap && bootstrap.engine.nashorn.running()) {
				engines.current = {
					name: "nashorn"
				};
			}
			if (isBreakOnExceptions) $api.engine.debugger.setBreakOnExceptions(true);
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
			"installation": jsh.shell.jsh.Installation.from.current(),
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
			"arguments": jsh.script.arguments,
			"jsh.shell.jsh.src": toJsonProperty(jsh.shell.jsh.src, formatters.directory),
			"jsh.shell.jsh.home": toJsonProperty(jsh.shell.jsh.home, formatters.directory),
			"jsh.shell.jsh.url": toJsonProperty(jsh.shell.jsh.url, function(url) {
				return {
					path: url.path,
					string: url.toString()
				}
			}),
			environment: jsh.shell.environment,
			properties: properties,
			directory: jsh.shell.process.directory.get(),
			"shellClasspath": String(jsh.loader.java.getClass("inonit.script.jsh.Shell").getProtectionDomain().getCodeSource().getLocation().toString())
		}, void(0), "    "));
	}
//@ts-ignore
)(Packages,$api,jsh);
