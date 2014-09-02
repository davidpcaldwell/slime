//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//
//	The Original Code is the SLIME JDK interface.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2014 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

var _lock = new jsh.java.Thread.Monitor();
var BorderLayout = Packages.java.awt.BorderLayout;
var _frame = new Packages.javax.swing.JFrame();
var _label = new Packages.javax.swing.JLabel(jsh.script.arguments[0]);
var _field = new Packages.javax.swing.JPasswordField();
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
	}
}));
_frame.addWindowListener(new JavaAdapter(Packages.java.awt.event.WindowListener, {
	windowClosing: function(e) {
		doneWaiter();
	}
}));
_frame.add(_label, BorderLayout.NORTH);
_frame.add(_field, BorderLayout.CENTER);
_frame.pack();
_frame.setVisible(true);
new _lock.Waiter({
	until: function() {
		return done;
	},
	then: function() {
		jsh.shell.echo(_field.getDocument().getText(0,_field.getDocument().getLength()));
		jsh.shell.exit(0);
	}
})();
