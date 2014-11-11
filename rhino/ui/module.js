//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//
//	The Original Code is the SLIME Java GUI module.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2014 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

if ($context.javafx) {
	$exports.javafx = new function() {
		var Frame = function(o) {
			var _frame = new Packages.javax.swing.JFrame();
			_frame.setDefaultCloseOperation(Packages.javax.swing.WindowConstants.DO_NOTHING_ON_CLOSE);
			var _panel = new Packages.javafx.embed.swing.JFXPanel();

			var events = $api.Events({
				source: this
			});
			
			_frame.addWindowListener(new JavaAdapter(
				Packages.java.awt.event.WindowListener,
				new function() {
					this.windowClosing = function(e) {
						events.fire("close");
					}
				}
			));

			if (o.title) _frame.setTitle(o.title);

			var setScene = function(sceneFactory) {
				var task = new JavaAdapter(
					Packages.java.lang.Runnable,
					new function() {
						this.run = function() {
							_panel.setScene(sceneFactory.call({
								_panel: _panel,
								_frame: _frame
							}));
							_frame.add(_panel);
							_frame.pack();
							_frame.setVisible(true);
						}
					}
				);
				Packages.javafx.application.Platform.runLater(task);
			}

			if (o.Scene) {
				setScene(function() {
					return o.Scene.call(this);
				});
			}
		}
		
		var Application = function(o) {
			var frame = new Frame(o);
			frame.listeners.add("close", function() {
				Packages.java.lang.System.exit(0);
			});
		}
		
		var run = function(f) {
			var task = new JavaAdapter(
				Packages.java.lang.Runnable,
				new function() {
					this.run = f;
				}
			);
			Packages.javafx.application.Platform.runLater(task);
		};

		this.run = run;

		this.launch = function(o) {
			var invoker = Packages.javax.swing.SwingUtilities.invokeAndWait;
			invoker(new JavaAdapter(
				Packages.java.lang.Runnable,
				new function() {
					new Application(o);
				}
			));
		}
	}
}
