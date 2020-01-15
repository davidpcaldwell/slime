interface TypescriptTestContext {
	prefix: string
}

interface TypescriptTestExports {
	foo: String
}

declare var $context : TypescriptTestContext
declare var $exports : TypescriptTestExports

var person : string = "Foo";

$exports.foo = $context.prefix + "bar"
