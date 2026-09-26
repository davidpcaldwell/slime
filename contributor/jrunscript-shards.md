[comment]: # (	LICENSE)
[comment]: # (	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not)
[comment]: # (	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.)
[comment]: # ()
[comment]: # (	END LICENSE)

# jrunscript suite sharding

`contributor/jrunscript.fifty.ts` is the top-level test suite run by `wf test.jrunscript`. On CI, running it end-to-end
in a single job takes roughly 45-55 minutes per JDK version (see the "Testing" workflows). Since GitHub Actions jobs
already run in parallel, the only way to reduce the *wall-clock* time to a green check is to split the single long job
into several shorter jobs that run concurrently.

## How it works

`contributor/jrunscript.fifty.ts` reads the `SLIME_TEST_JRUNSCRIPT_SHARD` environment variable. If unset, the entire
suite runs (this is the default, used for local development via `wf test.jrunscript`). If set, it must be a shard number
from 1-3 (e.g., `2`) or a comma-separated list of them (e.g., `1,3`), and only the `fifty.load(...)` calls assigned to
those shards run.

Each Linux `test-jdk*.yaml` workflow runs a 3-way matrix over `SLIME_TEST_JRUNSCRIPT_SHARD`, so each JDK's single
~50-minute job becomes three jobs of roughly 11-15 minutes each that run in parallel. Each shard pays its own fixed
overhead (Docker build, JDK/Rhino/TypeScript install -- roughly 3 minutes), so the total wall-clock savings are smaller
than 3x, but still substantial.

`test-jdk-macos.yaml` uses the same three shards, but in two jobs: one runs shards `1,3` and the other runs shard `2`
followed by `wf check` (ESLint and TypeScript). macOS runs the suite faster than Linux (~21 minutes unsharded) and its
setup is short, so both jobs should finish around the same time as the slowest Linux shard.

## Staying within the concurrent job limit

This repository's account is limited to 20 concurrently-running Actions jobs; jobs beyond that queue until a slot frees
up. A PR or push to `main` currently runs exactly 20 jobs:

* 15 Linux JDK shard jobs (5 JDKs x 3 shards)
* 2 macOS jobs (which also run `wf check`)
* `test-node`, `test-browsers`, and `test-jrunscript-engines-jdk25`

Before `wf check` was moved into a macOS job and macOS was reduced to two jobs, runs used 22 jobs; the two that queued
waited about 6 minutes for a slot, adding roughly 4 minutes to total CI time. When adding a job or workflow, consider
whether it pushes the total above 20.

## How the shard assignment was derived

Shard assignment is a static, hand-maintained mapping baked into `contributor/jrunscript.fifty.ts`, not computed
dynamically. This keeps shard membership stable, reviewable in diffs, and independent of how long some other shard
happens to take on a given CI run.

The initial assignment (three shards, each around ~8.9 minutes of actual suite runtime) was derived from real
per-file timing data captured from a completed `test-jdk21` CI run (using the existing
`contributor/fifty-timing-lines.bash` / `contributor/fifty-timing-lines.js` timing-extraction tooling, run with a
`0` threshold to capture every top-level `fifty.load()` entry rather than just the >=60s/>=2% ones normally logged).
Loads were then greedily bin-packed into 3 buckets, always adding the next-largest remaining load to whichever
bucket currently has the smallest total.

## Rebalancing

As the suite's contents and timing profile change over time, shard assignment may become unbalanced. To rebalance:

1. Download the timing artifact (or full log) from a recent, representative CI run for one of the sharded JDK
   workflows.
2. Extract real per-`fifty.load()` durations for each depth of `contributor/jrunscript.fifty.ts:suite`'s direct
   children (i.e., matching lines like `  PASSED: /slime/<path>:suite (<n> ms)` two levels below the root).
3. Bin-pack the loads across the desired number of shards (currently 3), for example via a small script that sorts
   loads by duration descending and always assigns the next load to the currently-smallest bucket.
4. Update the `runsShard(n)` assignments in `contributor/jrunscript.fifty.ts` to match.

This process does not need to be automated; it is expected to be run manually, infrequently (e.g., if a shard becomes
persistently much slower or faster than the others).

## Disk space

The sharded `test-jdk*` workflows do not run the `jlumbroso/free-disk-space` step used by other workflows. It was
added when the whole suite ran in a single job; with the suite sharded, each job does much less work, and the step
itself cost 2-11 minutes per job (it was the dominant source of variance between shards). If a sharded job starts
failing with out-of-disk errors, restore that step to the affected workflow.
