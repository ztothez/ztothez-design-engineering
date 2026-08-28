# Azure V2 Review Coordinator Guide

Keep this directory private from every reviewer and participant. It is the only directory that maps anonymous candidates to source implementations.

The `maintainer-sessions/` directory contains disclosed, non-blind maintainer evidence. It is coordinator-only and must not be copied into the anonymous reviewer packet. Passing `assess-maintainer` authorizes continued engineering only; it does not satisfy the anonymous review counts below.

## Session Assignment

Assign the first three sequences to human experts. Assign sequences 4, 5, 1, 2, and 3 to the five representative-user sessions. This yields all five required first positions and five distinct orders.

## Neutral Runtime Procedure

1. Build each candidate from the source directory recorded in candidate-map.yaml without modifying it.
2. Serve one candidate at a time on the same neutral loopback URL and reset product state before every session.
3. Give the reviewer only the assigned candidate letter, neutral URL, task prompts, and reviewer packet. Do not expose terminal paths, source labels, browser tab titles that identify a generator, or this directory.
4. Record unavailable actions and failed states as observations. Do not repair, explain, or coach the candidate during the timed task.
5. Stop timing only at the declared success, explicit failure, or participant abandonment point.
6. Ask the contributor whether candidate identities were withheld, whether they had prior candidate exposure, and whether conflicts exist. Record the answer without coaching.
7. Have the contributor review the YAML record before changing top-level status to complete.

## Evidence Handling

Store completed session files in reviewer-packet/completed-sessions. Keep all sessions, including dissent, failed tasks, and low scores. Run compile-comparison only after checking attribution, timestamp, participant pseudonym where required, assigned order, and every matrix cell.
