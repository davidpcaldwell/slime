$exports.multiply = function(a,b) {
	var multiplier = new Packages.module.Module();
	$context.echo("Multiplying " + a + " by " + b);
	return multiplier.multiply(a,b);
}