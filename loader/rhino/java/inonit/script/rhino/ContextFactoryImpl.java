//	LICENSE
//	The contents of this file are subject to the Mozilla Public License Version 1.1 (the "License"); you may not use
//	this file except in compliance with the License. You may obtain a copy of the License at http://www.mozilla.org/MPL/
//
//	Software distributed under the License is distributed on an "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either
//	express or implied. See the License for the specific language governing rights and limitations under the License.
//
//	The Original Code is the SLIME loader for rhino.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2010 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

package inonit.script.rhino;

import java.util.*;
import org.mozilla.javascript.*;

public class ContextFactoryImpl extends ContextFactory {
	//	TODO	rename this class to SingleContextFactory and get rid of thread mapping; just cache the single context
	private HashMap<Thread,Context> byThread = new HashMap<Thread,Context>();

	private int optimization = -1;

	public final void setOptimization(int optimization) {
		this.optimization = optimization;
	}

	protected Context makeContext() {
		Context rv = super.makeContext();
		rv.setErrorReporter(new Engine.Errors().getErrorReporter());
		rv.setOptimizationLevel(optimization);
		byThread.put(Thread.currentThread(), rv);
		return rv;
	}

	Context getCurrentContext() {
		Context rv = byThread.get(Thread.currentThread());
		if (rv == null) {
			rv = makeContext();
		}
		return rv;
	}

	protected boolean hasFeature(Context context, int feature) {
		if (feature == Context.FEATURE_STRICT_VARS) {
			return true;
		} else if (feature == Context.FEATURE_STRICT_EVAL) {
			return true;
		}
		return super.hasFeature(context, feature);
	}
}