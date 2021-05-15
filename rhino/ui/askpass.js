//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

(
	function() {
		$exports.gui = function(p) {
			var _lock = new $context.api.java.Thread.Monitor();
			var BorderLayout = Packages.java.awt.BorderLayout;
			var _frame = new Packages.javax.swing.JFrame();
			var _label = new Packages.javax.swing.JLabel(p.prompt);
			var _field = (p.nomask) ? new Packages.javax.swing.JTextField() : new Packages.javax.swing.JPasswordField();
			var done = false;
			var doneWaiter = new _lock.Waiter({
				until: function() {
					return true;
				},
				then: function() {
					_frame.dispose();
					done = true;
				}
			});
			_field.addKeyListener(new JavaAdapter(Packages.java.awt.event.KeyListener, {
				keyPressed: function(e) {
					if (e.getKeyCode() == Packages.java.awt.event.KeyEvent.VK_ENTER) {
						doneWaiter();
					}
				},
				//	TODO	for now, below is necessary for Nashorn because of incompatibility surrounding JavaAdapter
				keyTyped: function(){},
				keyReleased: function(){}
			}));
			_frame.addWindowListener(new JavaAdapter(Packages.java.awt.event.WindowListener, new function() {
				this.windowClosing = function(e) {
					doneWaiter();
				};

				//	TODO	for now, below is necessary for Nashorn because of incompatibility surrounding JavaAdapter
				["windowActivated","windowClosed","windowDeactivated","windowDeiconified","windowIconified","windowOpened"].forEach(function(methodName) {
					this[methodName] = function(){};
				},this);
			}));
			_frame.add(_label, BorderLayout.NORTH);
			_frame.add(_field, BorderLayout.CENTER);
			_frame.pack();
			_frame.setVisible(true);
			var rv;
			new _lock.Waiter({
				until: function() {
					return done;
				},
				then: function() {
					rv = _field.getDocument().getText(0,_field.getDocument().getLength());
				}
			})();
			return String(rv);
		}
	}
)();
