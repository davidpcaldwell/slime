//@ts-check
(
	/**
	 *
	 * @param { { Verify: slime.definition.verify.Export } } $context
	 * @param { (value: slime.definition.unit.internal.EventsScope) => void } $export
	 */
	function($context,$export) {
		$export((function() {
			//	TODO	would like to move this adapter to another file, but would need to alter callers to load unit.js as module first

			var adaptAssertion = new function() {
				var BooleanTest = function(b) {
					var MESSAGE = function(success) {
						return (success) ? "Success." : "FAILED!";
					};

					return $api.deprecate(function() {
						return {
							success: b,
							message: MESSAGE(b),
							error: void(0)
						}
					});
				};

				/**
				 *
				 * @param { any } assertion
				 * @returns { () => { success: boolean, message: string, error: any } }
				 */
				this.assertion = function(assertion) {
					if (typeof(assertion) == "function") return assertion;
					if (typeof(assertion) == "boolean") {
						return BooleanTest(assertion);
					} else if (typeof(assertion) == "undefined") {
						throw new TypeError("Assertion is undefined.");
					} else if (assertion === null) {
						return BooleanTest(assertion);
					} else if (
						(typeof(assertion) == "object" && assertion != null && typeof(assertion.success) == "boolean")
							|| (typeof(assertion) == "object" && assertion != null && assertion.success === null)
					) {
						return (function(object) {
							var MESSAGE_FOR_MESSAGES = function(assertion_messages) {
								return function(success) {
									var messages = {
										success: assertion_messages.success,
										failure: assertion_messages.failure
									};
									if (messages && typeof(messages.success) == "string") {
										messages.success = (function(value) {
											return function() {
												return value;
											}
										})(messages.success)
									}
									if (messages && typeof(messages.failure) == "string") {
										messages.failure = (function(value) {
											return function() {
												return value;
											}
										})(messages.failure)
									}
									return (success) ? messages.success() : messages.failure();
								}
							};
							return $api.deprecate(function() {
								return {
									success: object.success,
									error: object.error,
									message: MESSAGE_FOR_MESSAGES(object.messages)(object.success)
								}
							});
						})(assertion);
					} else if (typeof(assertion) == "object" && typeof(assertion.success) == "function") {
						if (typeof(assertion.message) == "function") {
							return (function(was) {
								return $api.deprecate(function() {
									var success = was.success();
									var message = was.message(success);
									return {
										success: success,
										message: message,
										error: was.error
									};
								})
							})(assertion);
						} else if (typeof(assertion.messages) == "object") {
							return (function(was) {
								return $api.deprecate(function() {
									var success = was.success();
									return {
										success: success,
										message: (success) ? was.messages.success() : was.messages.failure(),
										error: was.error
									};
								});
							})(assertion);
						} else {
							throw new TypeError("Assertion object with success but no messages: " + Object.keys(assertion));
						}
					} else if (true || typeof(assertion) != "object" || typeof(assertion.success) != "function") {
						var error = Object.assign(
							new TypeError("Assertion is not valid format; see this error's 'assertion' property for incorrect value"),
							{ assertion: assertion }
						);
						throw error;
					}
				};

				this.result = function(result) {
					if (typeof(result) == "boolean") {
						return $api.deprecate((function(b) {
							return {
								success: b,
								message: (b) ? "Success." : "FAILED!"
							};
						}))(result);
					}
					return result;
				}
			};

			/**
			 * @type { slime.definition.unit.internal.EventsScope }
			 */
			var Scope = function(o) {
				var success = true;

				//	IE8-compatible implementation below
				//		var self = this;
				//		this.success = true;
				//		var fail = function() {
				//			debugger;
				//			self.success = false;
				//		}

				var checkForFailure = function(detail) {
					if (typeof(detail.success) != "undefined") {
						if (!detail.success) {
							debugger;
							success = false;
						}
					}
				};

				var process = function(type,detail) {
					o.events.fire(type,detail);
					checkForFailure(detail);
				}

				/**
				 * @type { slime.definition.unit.Scope }
				 */
				var rv = {
					test: function(assertion) {
						var getResult = function(assertion) {
							assertion = adaptAssertion.assertion(assertion);
							var result = assertion();
							result = adaptAssertion.result(result);
							return result;
						};

						process("test",getResult(assertion));
					},
					error: function(e) {
						process("test",{
							success: false,
							message: "Uncaught exception: " + e,
							error: e
						});
					},
					verify: $context.Verify(
						function(f) {
							this.test(f)
						}
					),
					success: void(0),
					fire: function(type,detail) {
						process(type,detail);
					},
					checkForFailure: function(e) {
						checkForFailure(e.detail);
					}
				}

				Object.defineProperty(
					rv,
					"success",
					{
						get: function() {
							return success;
						}
					}
				);

				return rv;
			};

			return Scope;
		})());
	}
//@ts-ignore
)($context,$export);
