//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the rhino/shell SLIME module.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2013 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

plugin({
	isReady: function() {
		return jsh.js && jsh.java && jsh.io && jsh.file;
	},
	load: function() {
		var $shell = $loader.module("module.js", {
			api: {
				js: jsh.js,
				java: jsh.java,
				io: jsh.io,
				file: jsh.file
			},
			_properties: $host.getSystemProperties(),
			_environment: $host.getEnvironment()
		});

		var context = {};
		context.api = {
			js: jsh.js
			,java: jsh.java
			,io: jsh.io
			,file: jsh.file
		}
		context.stdio = new function() {
			this.input = jsh.io.java.adapt($host.getStdio().getStandardInput());
			this.output = jsh.io.java.adapt($host.getStdio().getStandardOutput());
			this.error = jsh.io.java.adapt($host.getStdio().getStandardError());
		}
		//	TODO	properties methods should go away; should not be necessary now
		context.getSystemProperty = function(name) {
			var rv = $host.getSystemProperties().getProperty(name);
			if (rv == null) return null;
			return String(rv);
		};
		context._getSystemProperties = function() {
			return $host.getSystemProperties();
		};
		context.exit = function(code) {
			$jsh.exit(code);
		}
		context.jsh = function(configuration,invocation) {
			return $jsh.jsh(configuration,invocation)
		}
		$loader.run(
			"jsh.js",
			{
				$context: context,
				$exports: $shell
			}
		);
		jsh.shell = $shell;
	}
})