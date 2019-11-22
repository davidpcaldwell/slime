interface Context {
	prefix: string
}

interface Exports {
	foo: String
}

declare var $context : Context
declare var $exports : Exports

var person : string = "Foo";

$exports.foo = $context.prefix + "bar"
