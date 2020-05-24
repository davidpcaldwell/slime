namespace slime.fifty.shopping {
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

	var module = $loader.module("module.js");

	$exports.Database = function() {
		var db = new module.Database();
		verify(db.items.length == 0);
		db.add({ item: { name: "foo" }});
		verify(db.items.length == 1);
		verify(db.items[0].name == "foo");
	}

	interface Exports {
		Database: new () => Database
	}
}
