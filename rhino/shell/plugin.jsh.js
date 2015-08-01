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
		return jsh.js && jsh.js.document && jsh.js.web && jsh.java && jsh.io && jsh.file;
	},
	load: function() {
		var $shell = $loader.module("module.js", {
			api: {
				js: jsh.js,
				java: jsh.java,
				io: jsh.io,
				file: jsh.file,
				document: jsh.js.document
			},
			_properties: $jsh.getSystemProperties(),
			_environment: $jsh.getEnvironment()
		});

		var context = {};
		context.api = {
			js: jsh.js
			,java: jsh.java
			,io: jsh.io
			,file: jsh.file
		}
		context.stdio = new function() {
			this.input = jsh.io.java.adapt($jsh.getStdio().getStandardInput());
			this.output = jsh.io.java.adapt($jsh.getStdio().getStandardOutput());
			this.error = jsh.io.java.adapt($jsh.getStdio().getStandardError());
		}
		//	TODO	properties methods should go away; should not be necessary now
		context.getSystemProperty = function(name) {
			var rv = $jsh.getSystemProperties().getProperty(name);
			if (rv == null) return null;
			return String(rv);
		};
		context._getSystemProperties = function() {
			return $jsh.getSystemProperties();
		};
		context.exit = function(code) {
			$jsh.exit(code);
		};
		context.jsh = function(configuration,script,args) {
			var _invocation = $jsh.getInterface().invocation(
				script.pathname.java.adapt(),
				jsh.java.toJavaArray(args,Packages.java.lang.String,function(s) {
					return new Packages.java.lang.String(s);
				})
			);
			return $jsh.jsh(configuration,_invocation)
		};
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