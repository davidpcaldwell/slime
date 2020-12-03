(
	function(
		$slime: slime.jrunscript.runtime.Exports,
		$loader: slime.fifty.test.$loader,
		verify: slime.fifty.test.verify,
		tests: slime.fifty.test.tests,
		run: slime.fifty.test.run
	) {
		tests.exports = {};
		tests.exports.Resource = function() {
			var file: slime.jrunscript.runtime.Resource.Descriptor = $loader.source.get("expression.fifty.ts");
			var resource = new $slime.Resource({
				type: $slime.mime.Type.parse("application/x.typescript"),
				read: {
					binary: function() {
						return file.read.binary();
					}
				}
			});
			verify(resource).is.type("object");
			verify(resource).type.media.is("application");
			verify(resource).type.subtype.is("x.typescript");

			//	TODO	when running Fifty tests, this shows up as a 'run' child; should use function name ("streamIsCopied")
			//			if there is one
			function streamIsCopied() {
				var data = "foo!";
				var buffer = new $slime.io.Buffer();
				var stream = buffer.writeText();
				stream.write(data);
				stream.close();

				var resource = new $slime.Resource({
					stream: {
						binary: buffer.readBinary()
					}
				});

				var first = resource.read(String);
				var second = resource.read(String);
				verify(first).is(data);
				verify(second).is(data);
			};

			run(streamIsCopied);
		};

		tests.suite = function() {
			var values = {
				a: "1"
			};

			var encoded = $api.jrunscript.Properties.codec.object.encode(values);
			jsh.shell.console(String(encoded));
			verify(encoded).getProperty("a").evaluate(String).is("1");
			verify(encoded).getProperty("foo").is(null);

			var decoded = $api.jrunscript.Properties.codec.object.decode(encoded);
			verify(decoded).a.is("1");
			verify(decoded).evaluate.property("foo").is(void(0));

			run(tests.exports.Resource);
		}
	}
//@ts-ignore
)(jsh.unit["$slime"], $loader, verify, tests, run);
