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
