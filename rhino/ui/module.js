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
			
			var source = this;
			
			this.close = function() {
				_frame.dispose();
			}
			
			_frame.addWindowListener(new JavaAdapter(
				Packages.java.awt.event.WindowListener,
				new function() {
					var empty = function(e){};
					this.windowOpened = empty;
					
					this.windowClosing = function(e) {
						events.fire("close");
						if (o.on && o.on.close) {
							//	TODO	perhaps should replicate entire event API here?
							//	TODO	perhaps should add to $api.Events the ability to create event matching API? Or retrieve
							//			fired event?
							o.on.close.call(source);
						}
					};
					
					this.windowClosed = empty;
					this.windowIconified = empty;
					this.windowDeiconified = empty;
					this.windowActivated = empty;
					this.windowDeactivated = empty;
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
		};
		
		this.Frame = Frame;
		
		var Application = function(o) {
			if (!o.on) o.on = {};
			if (!o.on.close) o.on.close = function() {
				$context.exit(0);				
			}
			var frame = new Frame(o);
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
					this.run = function() {
						new Application(o);
					}
				}
			));
		}
	}
}
