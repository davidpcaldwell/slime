//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

var Scene = function() {
	var Button = Packages.javafx.scene.control.Button;
	var btn = new Button();
	btn.setText("Say 'Hello World'");
	btn.setOnAction(new JavaAdapter(
		Packages.javafx.event.EventHandler,
		new function() {
			this.handle = function(event) {
				Packages.java.lang.System.out.println("Hello World!");
			}
		}
	));

	var root = new Packages.javafx.scene.layout.StackPane();
	root.getChildren().add(btn);
	return new Packages.javafx.scene.Scene(root,300,250);
}

jsh.ui.javafx.launch({
	title: "Hello, jsh.ui.javafx",
	Scene: Scene
});
