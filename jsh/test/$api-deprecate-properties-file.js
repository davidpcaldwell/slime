var o = new function() {
	this.f = $context.f;
};
$api.deprecate(o, "f");

$exports.o = o;
