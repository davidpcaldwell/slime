namespace slime.fifty.test.data.shopping {
	/**
	 * Something on the shopping list.
	 */
	interface Item {
		name: string
	}

	/**
	 * A compendium of wanted items.
	 */
	interface Database {
		items: Item[],
		add: (p: { item: Item }) => void
	}

	tests.types.Database = function(database: Database) {
		var before = database.items.length;
		database.add({ item: { name: "foo" }});
		verify(database).items.length.is(before + 1);
		verify(database).items[0].name.is("foo");
	}

	interface Exports {
		Database: new () => Database
	}

	tests.types.Exports = function(exports: Exports) {
		var db = new exports.Database();
		tests.types.Database(db);
	}

	tests.suite = function() {
		var module: Exports = $loader.module("module.js");
		tests.types.Exports(module);
	}
}
