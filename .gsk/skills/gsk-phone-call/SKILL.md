---
name: gsk-phone-call
version: 1.0.0
description: Make a real AI phone call on the user's behalf. Validates prerequisites
  (membership, phone setup, credits), resolves the contact, then dials and returns
  status, real audio duration, dial attempts, summary, and transcript. After every
  call, present the outcome, disclose every dial attempt, point to call_log or call_detail,
  and show short transcripts inline. Never fabricate a phone number or Maps place_id;
  contact_info must have verified lineage. A dry run validates only and never places
  a call. On code=setup_incomplete, show setup_url, wait for setup, and use phone_call_setup_status
  before retrying. For sending a real text message instead, use the SMS sibling `gsk
  telephony sms send` — same setup, lineage, and disclosure rules.
metadata:
  category: phone-call
  generated_by: genspark_tool_cli/generate_skills.py
  requires:
    bins:
    - gsk
  cliHelp: gsk telephony call dial --help
---

# gsk-phone-call

**PREREQUISITE:** Read `../gsk-shared/SKILL.md` for auth, global flags, and security rules.

Make a real AI phone call on the user's behalf. Validates prerequisites (membership, phone setup, credits), resolves the contact, then dials and returns status, real audio duration, dial attempts, summary, and transcript. After every call, present the outcome, disclose every dial attempt, point to call_log or call_detail, and show short transcripts inline. Never fabricate a phone number or Maps place_id; contact_info must have verified lineage. A dry run validates only and never places a call. On code=setup_incomplete, show setup_url, wait for setup, and use phone_call_setup_status before retrying. For sending a real text message instead, use the SMS sibling `gsk telephony sms send` — same setup, lineage, and disclosure rules.

## Usage

```bash
gsk telephony call dial [options]
```

## SMS sibling: `gsk telephony sms send`

Send a real SMS on the user's behalf. The message body is sent VERBATIM — pass exactly the text the user approved, never compose or embellish it. Validates prerequisites (membership, phone setup, credits), destination number lineage, and the per-country segment budget (South Korea: single segment only, 70 chars for Korean text; Japan: max 5 segments), then sends and returns the delivery handle (sid), segments, and credits charged. Over-budget messages are rejected, never truncated.
Destination numbers must have verifiable lineage (user-provided, prior tool results, or a calllog: contact_ref) — never fabricate a number.
Use dry_run=true first when unsure: it validates and prices (encoding, segment count, credits) without sending.
MANDATORY after every send: report to the user the recipient, delivery status, segment count, and credits charged.

```bash
gsk telephony sms send [options]   # see `gsk telephony sms send --help`
```

## Getting the recording file

`gsk telephony call detail <project_id>` returns the call record and a recording link. To hand the audio file itself to the user or a channel, download it:

    gsk telephony call recording <project_id> ./call.wav

Default is dual-channel (L=callee, R=caller). Add `--channels mono` for a single server-mixed track. `--info` reports duration and size without downloading.
If the answer is `recording_not_ready`, the call has not finished finalising — poll `gsk telephony call status` and retry.

## The flow — a phone task from ask to delivered result

`dial` is one step of a flow, not the whole job. Run the flow below for every
phone task; the sections above hold the command details.

1. **Settle everything up front, once.** Before the first dial, confirm with
   the user in a single exchange: the goal, the hard constraints, what the call
   may agree to and what it must decline (payment, deposit, contract, private
   data), how many calls are allowed, and the language the callee speaks.
   Everything after this runs without coming back to ask. There is no live
   channel during a call: the voice agent works from `purpose` alone.
2. **Check readiness.** Run `gsk telephony setup-status` whenever the ask is
   about calling. Not ready → hand the user the returned `setup_url` and stop;
   never dial around a gate. The number and the recipient name come from the user, prior tool results
   or research (a maps search returns the business's phone number) — never
   invented.
3. **Write a self-sufficient `purpose`.** One string carrying the goal, every
   fact the callee may need, every question that must be answered, what to
   accept and what to decline, and the call language. Nothing can be added
   mid-call; a thin `purpose` is the top cause of a failed call. Use
   `--dry-run` first when the contact is unverified.

   Every real dial passes a purpose review before anything is dialed
   (`--dry-run` currently stops before it). The review refuses: emergency
   and premium-rate numbers; political purposes; sensitive institutions
   (police non-emergency lines, embassies and consulates, airports,
   military, government security); marketing, sales or any commercial
   solicitation; harassment, scams, threats or other malicious intent;
   call-pumping patterns (silent presence, "never hang up", padding the
   duration); any instruction to deny being an AI, impersonate a real
   person or hide who the call is for; and a purpose the callee cannot act
   on (a reservation without date, time and party size; a scheduling call
   without the caller's availability). Separately, some countries and
   number prefixes are refused as outbound destinations, and a number
   called too often in the last 24 hours is refused. Never write a purpose
   that argues around any of this.
4. **Dial once, asynchronously, then poll.**
   `gsk telephony call dial <recipient> -c <contact> -p <purpose> --async`
   returns at once with `project_id`. Poll `gsk telephony call status
   <project_id>` until the status is terminal. A call can run several minutes
   through IVR and hold; a long call still in progress is not a stuck call. If
   a blocking dial timed out, the call is still live: take the project id from
   the `Dialing... (project: ...)` line and poll its status. **Never dial the
   same number again while a call is not terminal.**

   When a dial does not end in a conversation, read `call_status` together
   with `dial_attempts` (present only when a dial was actually placed) and
   the reason text in `call_summary`, then pick the class below. Phone
   manners apply throughout: a line that was engaged, unanswered or refused
   is not chased, and the system accepts at most 4 dials to one number per
   user per day (6 across all users) — plan every retry inside that.

   - `blocked` or `dial_rejection_reason: purpose_rejected` — the purpose
     review refused it; nothing was dialed.
     - It asks for a fact you already hold from step 1 (date, time, party
       size, your availability, who is calling): add it to `purpose` and
       dial once more, no question to the user.
     - "Failed to analyze the purpose of the call": the review did not
       run; dial once more.
     - It names information you do not have: ask the user for exactly
       that, then dial.
     - It names a policy category (political, marketing, malicious, call
       pumping, hiding the AI or the principal): tell the user which one
       and quote the reason; dial again only if the user changes the goal
       itself — rewording the same intent is refused again.
     - The purpose does not fit the callee: confirm the target with the
       user.
   - `failed` with no `dial_attempts` — a check refused it before any dial.
     - "called too frequently": retry later. The limit is per 24 hours and
       the message carries no timer; tell the user this callee cannot be
       reached before tomorrow.
     - Destination refused (country or region not supported, number
       blocked): do not retry — final for that party. Never try another
       number for the same callee to get around it.
     - `code=setup_incomplete`, a rejected caller-ID choice, a membership
       or credit limit: hand the user the `setup_url` or the message, wait,
       and run `setup-status` again before dialing.
     - Any other reason ("unexpected error", "temporarily unavailable"):
       one retry a few minutes later; if it fails again, stop and report.
   - `busy` — the line was engaged. Do not redial on your own; report it.
     If the user wants another try, wait at least 30 minutes.
   - `no-answer` — it rang out. At most one more try within the count
     agreed in step 1, at least 30 minutes later and inside the callee's
     daytime (never before 08:00 or after 21:00 callee local time); a
     second no-answer ends the task for that party — report.
   - `canceled` — stopped from our side (a hang-up or a timeout before
     pickup). Do not redial unless the user asks.
   - `failed` with `dial_attempts` — the carrier could not complete the
     call. Read `sip_response_code`, `error_code`, `error_message` and
     `dial_rejection_reason` from the dial result or status when present.
     `dial_attempts: 2` means the system already retried; do not add an
     automatic retry. SIP 404, 410 or 484: ask the user to verify the
     number, never redial the unchanged number. SIP 403 or a destination
     rejection: stop; do not change numbers to bypass it. SIP 603: treat
     it as a refusal, no redial that day. For other or missing codes,
     report the available reason without guessing; retry only after the
     user confirms, at least 10 minutes later. Older servers may omit
     these fields; do not infer a cause from their absence.
   - `completed` — judge from the transcript (step 6). Voicemail or an
     unattended IVR counts as not reached: at most one more try, not
     within the same hour, and never a second voicemail on the same day.

   Whatever the class: never split a refused goal into several smaller
   calls, and never change the contact to make a refused purpose pass.
5. **Fetch the record of each call.** On terminal status,
   `gsk telephony call detail <project_id>` returns the summary and the full
   transcript; `gsk telephony call recording <project_id> ./call.wav` saves
   the audio file (see "Getting the recording file" above). Redirect stdout
   to a file and parse the file: long transcripts truncate in context.
6. **Judge every `completed` call from the transcript, not from the
   status.** `completed` includes voicemail, refusals and "we will call you
   back". Goal met → the task ends; do not dial again to "confirm".
   Terminal (declined, closed, will not talk to an AI, goal impossible) →
   stop, do not redial. Decision needed (payment, identity, legal) → the
   call declined as told by `purpose`; raise it to the user now, between
   calls. Not reached (voicemail, IVR loop, an endless hold) → the retry
   table in step 4 applies. Any status other than `completed` is handled by
   that table too.
7. **Deliver per call.** Report how many calls were made and, for each: whom
   you called, when, status, real duration, what was agreed (quoted from the
   transcript), the transcript or where it is (`detail`), and the recording
   file. Report in the user's language; the call itself runs in the callee's.

Keep one line per call in a durable place as you go (`project_id`, status,
goal met, one-line summary) and build the report from it. Several candidates:
call them one at a time and stop at the first acceptable result; for a
"compare all" goal, reach every candidate with the same `purpose` first.

## Flags

| Flag | Required | Description |
|------|----------|-------------|
| `<recipient>` (positional) | Yes | The name of the person or business to call. Examples: - Personal: 'John Smith', 'Dr. Sarah Johnson' - Business: 'Starbucks George Street', 'Hilton Hotel Downtown' (string) |
| `-c`, `--contact_info` | Yes | Contact information — a phone number, a calllog: contact_ref, or a Google Maps place_id; the type is detected automatically from its shape.  **Phone numbers**: include the international country code ('+1-555-123-4567'); numbers without one are treated as US. MUST have verified data lineage from (1) user-provided info, (2) previous tool results, or (3) explicit context — NEVER fabricate, estimate, or infer a number.  **calllog: contact_ref** (from the call_log tool's contacts view, `--view contacts`): the preferred way to re-dial someone previously called — their real number stays masked.  **Google Maps place_id** (e.g. 'ChIJcawkWTyuEmsRG56o5LAc0LQ'): must come from maps_search results — never fabricate or guess one. The call then uses the business's Maps phone number and enriches the call record with the place data. (string) |
| `-p`, `--purpose` | Yes | The clear reason for making the call (e.g., 'Check reservation availability', 'Inquire about business hours'). (string) |

> **CAUTION:** This command performs a write/send operation. Double-check parameters before executing.

## See Also

- [gsk-shared](../gsk-shared/SKILL.md) — Authentication and global flags
