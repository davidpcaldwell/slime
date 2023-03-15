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
		//	TODO	this script generates trailing whitespace
		//	TODO	this script omits trailing newline
		var inputs = {
			counts: $api.fp.impure.Input.value({
				pipe: 8,
				invoke: 8,
				input_map: 8,
				process_value: 8
			}),
			destination: $api.fp.impure.Input.map(
				$api.fp.impure.Input.value(jsh.script.world.file),
				$api.fp.pipe(
					jsh.file.world.Location.relative("../../$api-fp-generated.fifty.ts")
				)
			)
		};

		var output = function(location) {
			return function(string) {
				var write = jsh.file.world.Location.file.write(location);
				$api.fp.world.now.action(write.string, { value: string });
			}
		};

		var offset = function(n) {
			return function(string) {
				for (var i=0; i<n; i++) {
					string = "\t" + string;
				}
				return string;
			}
		};

		var indent = offset(1);

		var indexes = function(n) {
			//	https://stackoverflow.com/questions/3746725/how-to-create-an-array-containing-1-n
			return Array.apply(
				null,
				{
					length: n
				}
			).map(Number.call, Number);
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

		var invokeDefinition = function(size) {
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
		}

		var inputMapDefinition = function(size) {
			var rv = [];
			var types = getGenericTypeList(size+1);
			rv.push("<" + types.join(",") + ">(");
			rv.push(indent("a: Input<A>,"));
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
												"Input_map",
												indexes(inputs.counts.input_map).map(function(n,index,array) {
													return inputMapDefinition(array.length-n);
												})
											),
											typeDefinition(
												"Process_value",
												indexes(inputs.counts.process_value).map(function(n,index,array) {
													return processValueDefinition(array.length-n);
												})
											)
										]
									);
									return [
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
													"Invoke",
													indexes(inputs.counts.invoke).map(function(n,index,array) {
														return invokeDefinition(array.length-n);
													})
												)
											]
										).join("\n"),
										impure.join("\n")
									].join("\n\n");
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
