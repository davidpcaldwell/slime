//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { slime.$api.fp.internal.mapping.Context } $context
	 * @param { slime.loader.Export<slime.$api.fp.internal.mapping.Exports> } $export
	 */
	function($context,$export) {
		$export({
			Mapping: {
				from: {
					value: function(r) {
						return function(p) {
							return r;
						}
					},
					thunk: function(f) {
						return function(p) {
							return f();
						}
					}
				},
				thunk: function(p) {
					return function(m) {
						return function() {
							return m(p);
						}
					}
				},
				now: function(p) {
					return function(m) {
						return m(p);
					}
				},
				all: $context.deprecate(function(r) {
					return function(p) {
						return r;
					}
				}),
				thunks: function(mapping) {
					return function(p) {
						return function() {
							return mapping(p);
						}
					}
				},
				applyResultWith: function(p) {
					return function(f) {
						return function(t) {
							return f(t)(p);
						}
					}
				},
				properties: function(definition) {
					return function(p) {
						/** @type { object } */
						var rv = {};
						for (var x in definition) {
							rv[x] = definition[x](p);
						}
						return rv;
					}
				},
				invocation: function(i) {
					return i.mapping(i.argument);
				}
			}
		})
	}
//@ts-ignore
)($context,$export);
