//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

package inonit.script.rhino;

//	Container for GUI classes created so that these classes are not loaded in restricted class loading environments

import org.mozilla.javascript.tools.debugger.Dim;

public class Gui {
	private Gui() {}

	private static class SwingGui extends Debugger.RhinoDebugger.Ui {
		private org.mozilla.javascript.tools.debugger.SwingGui delegate;

		private void workAroundOsxSwingSlowness() {
			try {
				for (javax.swing.UIManager.LookAndFeelInfo info : javax.swing.UIManager.getInstalledLookAndFeels()) {
					//	Used to use Nimbus but Metal works better. Default is Mac OS X, which runs terribly slowly with the
					//	Rhino debugger, for unknown reasons.
					if ("Metal".equals(info.getName())) {
						javax.swing.UIManager.setLookAndFeel(info.getClassName());
						break;
					}
				}
			} catch (ClassNotFoundException e) {

			} catch (InstantiationException e) {

			} catch (IllegalAccessException e) {

			} catch (javax.swing.UnsupportedLookAndFeelException e) {

			}
		}

		SwingGui(Dim dim, String title) {
			if (System.getProperty("os.name").equals("Mac OS X")) {
				workAroundOsxSwingSlowness();
			}
			this.delegate = new org.mozilla.javascript.tools.debugger.SwingGui(dim, title);
			java.awt.Dimension screenSize = java.awt.Toolkit.getDefaultToolkit().getScreenSize();
			java.awt.Dimension size = new java.awt.Dimension((int)screenSize.getWidth() * 3/4, (int)screenSize.getHeight() * 3/4);
			this.delegate.setPreferredSize(size);
		}

		public void setExitAction(Runnable action) {
			this.delegate.setExitAction(action);
		}

		public void pack() {
			this.delegate.pack();
		}

		public void setVisible(boolean visible) {
			this.delegate.setVisible(visible);
		}

		public void destroy() {
			this.delegate.dispose();
		}
	}

	public static final Debugger.RhinoDebugger.Ui.Factory RHINO_UI_FACTORY = new Debugger.RhinoDebugger.Ui.Factory() {
		@Override public Debugger.RhinoDebugger.Ui create(Dim dim, String title) {
			return new SwingGui(dim, title);
		}
	};
}
