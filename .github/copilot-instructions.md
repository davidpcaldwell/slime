[comment]: # (	LICENSE)
[comment]: # (	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not)
[comment]: # (	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.)
[comment]: # ()
[comment]: # (	END LICENSE)

Refer to [AGENTS.md](../AGENTS.md) for instructions on how this project works.

Before taking substantive action (code edits, tests, or PR review actions), check `$HOME/.slime/contributor/agents/README.md`
(the canonical host path), `local/agents/README.md` (the per-checkout host override, relative to the repository root), and
`~/.agents/README.md` (the devcontainer path). Load each existing, distinct file and follow any personal instruction files it
references. If none exists (for example, in cloud GitHub review environments), proceed using repository instructions.

## World-oriented modules

When designing or refactoring SLIME modules, prefer a world-oriented structure:

* `$context` contains only code dependencies, or is absent altogether. Runtime configuration and platform capabilities belong in
	the world, not in `$context`.
* The top-level module exports a `use(world: World): Interface` function. The world describes the external capabilities needed
	by the returned interface, allowing callers to supply real platform implementations or deterministic test implementations.
* The world consists of effectful or ambient runtime capabilities: current time, local timezone resolution, filesystem access,
	process state, and similar stateful capabilities that may change outside the program or be externally visible.
* Static domain facts are not world. For example, timezone identities and their civil-time rules are static knowledge and should
	be treated as imported library data or explicitly loaded static definitions, not as hidden runtime state.
* Where code dependencies also need external capabilities, `use` passes the applicable parts of its world to those dependencies
	rather than having them obtain capabilities implicitly or through module-loading context.
* Keep platform-specific world implementations separate from the code that consumes them. Compatibility adapters may construct
	a default world, but the explicit `use(world)` interface should not depend on hidden runtime configuration.
* In ES6 terms, the strong model is: pure algorithmic modules import static data and pure helpers, while platform-specific
	adapters provide the runtime world object. The core module should not branch on platform by doing runtime conditionals or by
	reaching into ambient state.

This structure prepares code dependencies for ES6 imports while keeping external behavior explicit and replaceable.

When evaluating incoming files, attempt to emphasize evaluating test coverage by examining associated Fifty tests and evaluating
documentation provided via the Fifty definition files. Also, attempt to emphasize quality as described in the "Code Quality" section
of [AGENTS.md](../AGENTS.md).

Do other review tasks as you normally would.
