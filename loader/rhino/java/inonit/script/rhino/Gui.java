package inonit.script.rhino;

//	Container for GUI classes created so that these classes are not loaded in restricted class loading environments

import org.mozilla.javascript.tools.debugger.Dim;

public class Gui {
	private Gui() {}
	
	private static class SwingGui extends Engine.RhinoDebugger.Ui {
		private org.mozilla.javascript.tools.debugger.SwingGui delegate;
		
		SwingGui(Dim dim, String title) {
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
	}
	
	public static final Engine.RhinoDebugger.Ui.Factory RHINO_UI_FACTORY = new Engine.RhinoDebugger.Ui.Factory() {
		@Override public Engine.RhinoDebugger.Ui create(Dim dim, String title) {
			return new SwingGui(dim, title);
		}
	};
}
