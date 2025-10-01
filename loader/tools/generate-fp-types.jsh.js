//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 * @param { slime.$api.Global } $api
	 * @param { slime.jsh.Global } jsh
	 * @param { slime.jsh.script.cli.main } main
	 */
	function($api,jsh,main) {
		var inputs = {
			counts: $api.fp.impure.Input.value({
				pipe: 8,
				value_map: 8,
				thunk_map: 8,
				thunk_value: 8,
				input_value: 8,
				process_value: 8
			}),
			destination: $api.fp.Thunk.value(
				jsh.script.world.file,
				jsh.file.Location.directory.relativePath("../../$api-fp-generated.fifty.ts")
			),
			license: $api.fp.impure.Input.value(
				jsh.script.world.file,
				jsh.file.Location.file.read.string.simple,
				$api.fp.string.split("\n"),
				function(array) { return array.slice(0,6); },
				$api.fp.Array.join("\n")
			)
		};

		/** @type { (location: slime.jrunscript.file.Location) => (string: string) => void } */
		var output = function(location) {
			return function(string) {
				var write = jsh.file.Location.file.write.old(location);
				$api.fp.world.now.action(write.string, { value: string });
			}
		};

		/** @type { (n: number) => (string: string) => string } */
		var offset = function(n) {
			return function(string) {
				for (var i=0; i<n; i++) {
					string = "\t" + string;
				}
				return string;
			}
		};

		var indent = offset(1);

		/**
		 * Returns an array of length `n` containing `0..n-1`.
		 *
		 * @param { number } n
		 */
		var indexes = function(n) {
			/** @type { (rv: number[], n: number) => number[] } */
			var push = function recurse(rv,n) { return (n == 0) ? rv : recurse(rv.concat([rv.length]),n-1) };
			return push([],n);
		}

		/**
		 *
		 * @param { number } number
		 * @return { string[] }
		 */
		var getGenericTypeList = function(number) {
			var array = [];
			for (var i=0; i<number; i++) {
				array.push(String.fromCharCode("A".charCodeAt(0) + i));
			}
			return array;
		}

		var getFunctionName = function(index) {
			return String.fromCharCode("f".charCodeAt(0) + index);
		}

		var getParameterNameOfType = function(type) {
			return type.toLowerCase();
		}

		/**
		 *
		 * @param { number } size
		 * @returns { string[] }
		 */
		var pipeDefinition = function(size) {
			var rv = [];
			var types = getGenericTypeList(size+1);
			rv.push("<" + types.join(",") + ">(");
			for (var i=0; i<size; i++) {
				var last = i+1 == size;
				var f = getFunctionName(i);
				var p = getParameterNameOfType(types[i]);
				var r = types[i+1];
				rv.push(indent(f + ": (" + p + ": " + types[i] + ") => " + r + ( last ? "" : "," )));
			}
			var t = types[0];
			var p = getParameterNameOfType(t);
			var x = types[types.length-1];
			rv.push("): (" + p + ": " + t + ") => " + x);
			return rv;
		};

		var valueMapDefinition = function(size) {
			var rv = [];
			var types = getGenericTypeList(size+1);
			rv.push("<" + types.join(",") + ">(");
			rv.push(indent("a: A,"));
			for (var i=0; i<size; i++) {
				var last = i+1 == size;
				var f = getFunctionName(i);
				var p = getParameterNameOfType(types[i]);
				var r = types[i+1]
				rv.push(indent(f + ": (" + p + ": " + types[i] + ") => " + r + ( last ? "" : "," )));
			}
			rv.push("): " + types[types.length-1]);
			return rv;
		};

		var thunkValueDefinition = function(size) {
			var rv = [];
			var types = getGenericTypeList(size+1);
			rv.push("<" + types.join(",") + ">(");
			rv.push(indent("a: A,"));
			for (var i=0; i<size; i++) {
				var last = i+1 == size;
				var f = getFunctionName(i);
				var p = getParameterNameOfType(types[i]);
				var r = types[i+1]
				rv.push(indent(f + ": (" + p + ": " + types[i] + ") => " + r + ( last ? "" : "," )));
			}
			rv.push("): " + "Thunk<" + types[types.length-1] + ">");
			return rv;
		};

		var thunkNowDefinition = function(size) {
			var rv = [];
			var types = getGenericTypeList(size+1);
			rv.push("<" + types.join(",") + ">(");
			rv.push(indent("a: Thunk<A>,"));
			for (var i=0; i<size; i++) {
				var last = i+1 == size;
				var f = getFunctionName(i);
				var p = getParameterNameOfType(types[i]);
				var r = types[i+1]
				rv.push(indent(f + ": (" + p + ": " + types[i] + ") => " + r + ( last ? "" : "," )));
			}
			rv.push("): " + types[types.length-1]);
			return rv;
		};

		//	TODO	inputMapDefinition and inputValueDefinition are very duplicative

		var thunkMapDefinition = function(size) {
			var rv = [];
			var types = getGenericTypeList(size+1);
			rv.push("<" + types.join(",") + ">(");
			rv.push(indent("a: Thunk<A>,"));
			for (var i=0; i<size; i++) {
				var last = i+1 == size;
				var f = getFunctionName(i);
				var p = getParameterNameOfType(types[i]);
				var r = types[i+1]
				rv.push(indent(f + ": (" + p + ": " + types[i] + ") => " + r + ( last ? "" : "," )));
			}
			rv.push("): " + "Thunk<" + types[types.length-1] + ">");
			return rv;
		};

		var inputValueDefinition = function(size) {
			var rv = [];
			var types = getGenericTypeList(size+1);
			rv.push("<" + types.join(",") + ">(");
			rv.push(indent("a: A,"));
			for (var i=0; i<size; i++) {
				var last = i+1 == size;
				var f = getFunctionName(i);
				var p = getParameterNameOfType(types[i]);
				var r = types[i+1]
				rv.push(indent(f + ": (" + p + ": " + types[i] + ") => " + r + ( last ? "" : "," )));
			}
			rv.push("): " + "Input<" + types[types.length-1] + ">");
			return rv;
		};

		/**
		 *
		 * @param { number } size
		 * @returns { string[] }
		 */
		var processValueDefinition = function(size) {
			var rv = [];
			var types = getGenericTypeList(size);
			rv.push("<" + types.join(",") + ">(");
			rv.push(indent("a: A,"));
			for (var i=0; i<size; i++) {
				var last = i+1 == size;
				var f = getFunctionName(i);
				var p = getParameterNameOfType(types[i]);
				if (!last) {
					var r = types[i+1];
					rv.push(indent(f + ": (" + p + ": " + types[i] + ") => " + r + ( last ? "" : "," )));
				} else {
					rv.push(indent(f + ": Output<" + types[i] + ">" + ( last ? "" : "," )));
				}
			}
			rv.push("): " + "Process");
			return rv;
		}

		/**
		 *
		 * @param { (name: string) => string } open
		 */
		var definition = function(open) {
			/**
			 * @param { string } name
			 * @param { string[][] } nested
			 * @returns { string[] }
			 */
			return function(name, nested) {
				return $api.fp.Arrays.join([
					[open(name)],
					$api.fp.Arrays.join(
						nested.map(function(definition,index,array) {
							var last = (index+1) == array.length;
							return (last) ? definition : definition.concat([""]);
						})
					).map(offset(1)),
					["}"]
				]);
			}
		};

		var typeDefinition = definition(function(name) {
			return "export type " + name + " = {";
		});

		var namespaceDefinition = definition(function(name) {
			return "namespace " + name + " {";
		});

		main(
			function(p) {
				$api.fp.impure.now.process(
					$api.fp.impure.Process.create({
						input: $api.fp.impure.Input.map(
							$api.fp.impure.Input.compose(inputs),
							$api.fp.pipe(
								function(inputs) {
									var impure = namespaceDefinition(
										"slime.$api.fp.impure",
										[
											typeDefinition(
												"Input_value",
												indexes(inputs.counts.input_value).map(function(n,index,array) {
													return inputValueDefinition(array.length-n);
												}).concat([
													//	TODO	seems like this could be pushed into inputValueDefinition
													"<A>(",
													indent("a: A"),
													"): Input<A>"
												])
											),
											typeDefinition(
												"Process_value",
												indexes(inputs.counts.process_value).map(function(n,index,array) {
													return processValueDefinition(array.length-n);
												})
											)
										]
									);
									return inputs.license + "\n" + [
										namespaceDefinition(
											"slime.$api.fp",
											[
												typeDefinition(
													"Pipe",
													indexes(inputs.counts.pipe).map(function(n,index,array) {
														return pipeDefinition(array.length-n);
													})
												),
												typeDefinition(
													"Now_map",
													indexes(inputs.counts.value_map).map(function(n,index,array) {
														return valueMapDefinition(array.length-n);
													})
												),
												typeDefinition(
													"Thunk_map",
													indexes(inputs.counts.thunk_map).map(function(n,index,array) {
														return thunkMapDefinition(array.length-n);
													})
												),
												typeDefinition(
													"Thunk_value",
													indexes(inputs.counts.thunk_value).map(function(n,index,array) {
														return thunkValueDefinition(array.length-n);
													}).concat([
														//	TODO	seems like this could be pushed into thunkValueDefinition
														"<A>(",
														indent("a: A"),
														"): Thunk<A>"
													])
												),
												typeDefinition(
													"Thunk_now",
													indexes(inputs.counts.thunk_value).map(function(n,index,array) {
														return thunkNowDefinition(array.length-n);
													})
												),
											]
										).join("\n"),
										impure.join("\n")
									].join("\n\n").split("\n").map(function(line) {
										var pattern = /(.*?)\s+$/;
										var match = pattern.exec(line);
										if (match) {
											return match[1];
										} else {
											return line;
										}
									}).join("\n") + "\n";
								}
							)
						),
						output: output(inputs.destination())
					})
				)
			}
		);
	}
//@ts-ignore
)($api,jsh,main);
