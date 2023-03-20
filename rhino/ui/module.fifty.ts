//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.ui {
	export interface Context {
		/**
		 * If it evaluates to `true`, means JavaFX is present.
		 */
		javafx: boolean

		/**
		 * An implementation for exiting a GUI application.
		 *
		 * @param status An exit status.
		 */
		exit: (status: number) => never
	}

	export interface Exports {
		javafx: any
	}

	(
		function(
			Packages: slime.jrunscript.Packages,
			JavaAdapter: any,
			fifty: slime.fifty.test.Kit
		) {
			const { jsh } = fifty.global;

			fifty.tests.manual = {
				javafx: {}
			};

			fifty.tests.manual.javafx.launch = function() {
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
				//	This immediately exits if not kept alive by running in a debugger and pausing here
				//	TODO	obviously lots to do in terms of making this more robust
				debugger;
			}

			fifty.tests.suite = function() {

			}
		}
	//@ts-ignore
	)(Packages,JavaAdapter,fifty);

	export type Script = slime.loader.Script<Context,Exports>
}
