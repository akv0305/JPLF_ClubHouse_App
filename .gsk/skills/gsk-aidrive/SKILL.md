---
name: gsk-aidrive
version: 1.0.0
description: 'Read, search, and manage files in My Drive and Team Drive. Find original
  passages with search/grep; use wo-peer for live Office editing. Web downloader:
  download_video (YouTube), download_audio, and download_file import URLs into Drive.'
metadata:
  category: general
  generated_by: genspark_tool_cli/generate_skills.py
  requires:
    bins:
    - gsk
  cliHelp: gsk drive --help
---

# gsk-aidrive

**PREREQUISITE:** Read `../gsk-shared/SKILL.md` for auth, global flags, and security rules.

**SOURCE DISCOVERY:** `../gsk-second-brain/SKILL.md` explains Drive sources and addressing. With a selected source/id, use the Context commands below directly; consult that guide when the source is unknown.

Read, search, and manage files in My Drive and Team Drive. Find original passages with search/grep; use wo-peer for live Office editing. Web downloader: download_video (YouTube), download_audio, and download_file import URLs into Drive.

## Usage

```bash
gsk drive [options]
```

**Aliases:** `drive`

## What this command reaches

`gsk drive` opens the **Drive** half of the user's Second Brain — My Drive,
Team Drive, and the Shared-with-me view. For selected Context, start with the
commands below. To find a Team Drive, or to create, replace, rename, move, or
share files, see "Finding drives", "Working with files", and "Sharing" further
down. Consult `../gsk-second-brain/SKILL.md` to resolve shortcuts or work with
GenTeam channel drives.

## Reading selected Context

Reuse the selected path or `source`/`id`; do not rediscover the Drive each turn.
Use provided context summaries for a broad overview and to choose files.
For specific facts or calculations, find the relevant original passages.

| Need | Command |
|---|---|
| Find content in a selected folder | `gsk drive search --id '<folder-id>' --query 'short topic'` |
| Locate words in a known large file | `gsk drive grep --id '<file-id>' --query 'literal phrase'` |
| Read a known file | `gsk drive read --id '<file-id>'` |
| Get a cached file/folder overview | `gsk drive overview --id '<entry-id>'` |
| Inspect missing directory structure | `gsk drive tree --id '<folder-id>'` |

Add `--source '<source-id>'` for a shared selection. `--path` can replace `--id`.
Use short search queries; words in one search are ANDed. `--queries` accepts
several complementary searches, or several literal phrases for file grep.
`read --query` and `grep` match literal source phrases; use `search` for topic questions.
Missing overviews prepare asynchronously; continue searching or reading.

Search `evidence[].passages` and grep `passages` already contain original text.
Use them directly when sufficient, and cite `[title](url)` with the returned
source URL. To expand a passage, use `gsk drive read --cursor '<read_cursor>'`.
Do not read the same evidence again just to obtain a citation.

**Continue only when needed.** Use the returned cursor with the same action:

```bash
gsk drive read --cursor '<cursor>'
gsk drive search --cursor '<cursor>'
gsk drive grep --cursor '<cursor>'
gsk drive tree --cursor '<cursor>'
```

The cursor remembers the source and query. Follow pages sequentially; do not
calculate offsets. Stop once the question is answered. A whole-document summary
requires reading from the beginning until `read_progress.document_fully_returned`
is true; reaching the end of a selected passage is not reading the whole file.
If a cursor expires or the source changes, start a fresh targeted read/search;
do not retry the same invalid cursor. A legacy cursor may ask for the original
command's arguments.

Use `read --ids '<id-1>' '<id-2>'` for independent files from one source.
Results share a bounded output budget. Keep returned JSON intact; use the
command's limits instead of `head`, `tail`, or another tool that truncates it.
On `index_pending`, follow the returned retry instructions at most once if the
file is essential. An incomplete index or listing cannot prove content is absent.
If a new flag is rejected, refresh CLI metadata once with `gsk --refresh drive ...`.

Use `download` or `get_readable_url` when extraction is unavailable, visual/table
layout needs checking, or the task needs the actual file. For active Office
files and edits, use **wo-peer** with the returned collaboration identifiers:
indexed text is a persisted snapshot, not the live room. Never work around
an access denial by trying another tool.

## Finding drives

- `gsk drive ls -p /` lists My Drive. `gsk drive ls --workspace shared_drive`
  lists every shared drive you can open, and each text line says what it is:
  `(Team Drive, edit, directory)`; `(in Team Drive 'Finance', view, file)` for
  something shared out of a Team Drive rather than the drive itself;
  `(GenTeam channel, …)`, `(GenTeam direct message, …)`, `(Hub, …)`,
  `(Ask Org knowledge, …)`. `--workspace shared_with_me` adds what people
  shared from their own My Drive: `(shared by <name>, …)`. The JSON rows carry
  `source_id`, `source_type`, `is_drive_root`, `drive_source_name`, and `owner_name`.
- Work inside one with `--workspace shared_drive --source <source_id>`; paths
  are relative to it. A browser address `/.shared-workspace/<source_id>/…`
  works as `--path` or `--upload_path` on its own.
- Not listed: Team Drives an org admin sees on the web without holding access
  to them (admin access there is governance only). Creating, renaming, and
  deleting a Team Drive itself happens on the web.

## Working with files

| Task | My Drive | Team Drive (add `--workspace shared_drive --source <source_id>`) |
|---|---|---|
| New folder | `gsk drive mkdir --path /Reports` | same (editors) |
| Upload a local file | `gsk drive upload --local_file ./q3.pdf --upload_path /Reports/q3.pdf` | same |
| Replace a file, keeping its link | `… --upload_path /Reports/q3.pdf --on-conflict overwrite` | same |
| Rename | `gsk drive move --path /Reports/q3.pdf --target_path /Reports/q3-final.pdf` | same |
| Move into a folder | `gsk drive move --path /q3.pdf --target_path /Reports` | same, within one source |
| Delete | `gsk drive rm --path /Reports/old.pdf` (to trash) | same (editors) |
| Restore | `gsk drive list_trash`, then `restore --entry_id <id>` | on the web |
| Copy into a folder | `gsk drive copy --path /Reports/q3.pdf --target_path /Archive` | same; `--target_source my_drive` copies out to My Drive |
| Copy beside the original | `gsk drive copy --path /Reports/q3.pdf` (lands as `q3(1).pdf`) | same |

- `move` into an existing folder moves the entry; a new last segment renames
  it; a name that already exists is refused (move never overwrites). Rename
  and replace keep the entry's id, so its share link keeps working.
- An upload with `--file_content` needs its folder to exist (`mkdir` first);
  a local-file upload creates missing folders.
- `--upload_path` is the file's own full path: one that names a folder, or
  ends in `/`, is refused rather than saved as a copy beside the folder.
- gsk 1.14 and later also read paths given as operands: `gsk drive ls
  /Reports`, `gsk drive move /q3.pdf /Archive`, `gsk drive find budget
  /Reports`, `gsk drive upload ./q3.pdf /Reports/`. Earlier versions need the
  flags shown in the table. A list flag like `--ids` takes every word after
  it: give the destination before it, or as `--target_path`.
- `copy` works across drives: `--target_source` is `my_drive` or a
  `source_id` (default: the drive copied from) and `--target_path` a folder
  in it; a web address `/.shared-workspace/<source_id>/<folder>` names both.
  `--ids` copies up to 16 entries of one source in one job. Copies are new
  entries with new ids: they open for whoever can open the folder they land
  in, not for the originals' shares, and the reply lists each copy's link.
  A person runs one copy at a time. A copy still running after about 20
  seconds answers with a job id: read it back with `gsk drive copy --job_id
  <id>`; one that stopped continues with `--job_id <id> --retry true`,
  keeping what it copied. Copying needs download rights on the source and
  edit rights on the destination; GenTeam channel and DM drives take files,
  not folders.
- GenTeam channel and DM drives are flat: files go at the root, and only a
  channel admin can move, rename, or delete them.

## Sharing

| Audience | My Drive | Team Drive entry | GenTeam channel / DM / Hub drive |
|---|---|---|---|
| A person | `share --to a@x.com`; an address without an account becomes a pending invite | managers; the person needs an account | membership comes from the product |
| Your org | `share --to org` | `share --to org` (the drive's org) | — |
| A group | `share --to group:<uid>` | not available | — |
| Anyone with the link | `share --general_access link` | managers | — |
| A GenTeam channel | `share --to channel:<server_id>:<channel_id>` (posts a card unless `--post_card false`) | managers, same form | — |
| Undo | `unshare --to …`, or `unshare --general_access restricted` | managers | — |

- A new email share notifies that person with the link, on My Drive and Team
  Drives alike; org, group, and link access notify no one.
- General access is ONE setting: restricted, your org, or anyone with the
  link. `--to org` and `--general_access org` set the same thing and replace
  link access; `unshare --to org` returns it to restricted.
- `access` shows who can open an entry, including what it inherits from the
  folders above it; for a Team Drive entry, managers see the full list.
- `gsk drive link --path <My Drive entry> --workspace shared_drive --source
  <Team Drive, channel, or Hub> [--target_path <folder in it>]` places a
  shortcut to your file in a shared drive; its members open your original.
  `gsk drive unlink --workspace shared_drive --source <link_workspace_id>`
  removes the shortcut.

## Flags

| Flag | Required | Description |
|------|----------|-------------|
| `<action>` (positional) | Yes | Action to perform (string, one of: ls, find, mkdir, rm, move, get_readable_url, download, download_video, download_audio, download_file, compress, decompress, share, unshare, access, link, unlink, upload, list_trash, restore, tree, search, read, overview, copy, grep) |
| `--workspace` | No | AI Drive location. my_drive owns your bytes and quota; shared_drive selects managed org, GenTeam, Hub, or authorized knowledge drives; shared_with_me is an ACL-filtered view across both kinds of container and owns no bytes or quota. GenTeam drives are flat: upload files or share source folders at the root; no native mkdir. In GenTeam channel and DM drives, moving, renaming, and deleting native files needs a channel admin; Team Drive editors can do all three. (string, one of: my_drive, shared_with_me, shared_drive, default: `my_drive`) |
| `--source` | No | Stable source_id returned by ls in shared_with_me or shared_drive. It identifies the storage-owning drive and entry; names are accepted only when unique. (string) |
| `--share` | No | Deprecated alias for source, retained for older gsk scripts. (string) |
| `--scope` | No | For find only: search My Drive, accessible shared sources, or both. Use all when only a filename is known. Cannot combine with source/id/url; a specific source keeps the existing directory search behavior. Aggregate search is bounded; inspect coverage before concluding a file is absent. (string, one of: mine, shared, all) |
| `--to` | No | Who to share with, for share/unshare: an email address; My Drive also accepts 'org' / 'group:<uid>' and 'channel:<server_id>:<channel_id>' (a GenTeam channel you belong to — the file is opened to its members and, unless post_card is false, posted there as a card). Managed Drive sources use email or general_access; a Team Drive source (workspace=shared_drive, source=<source_id>) also takes 'channel:…' — for its root, or for one entry inside it named by path (relative to the source) or id — when you manage sharing there. Also accepted by upload into My Drive: the file is shared the moment it lands and the reply carries the link that opens for them. A new email share notifies that person with the link. A Team Drive email share needs manager rights and an existing account; My Drive can share with an address before it signs up. (string) |
| `--post_card` | No | For share to a channel: also post the document card into the channel (default true). false opens the file to the channel's members without a message. (boolean, default: `True`) |
| `--permission` | No | What the recipient or delegated mount may do: view or edit (share/link). The public link audience can only ever view. (string, one of: view, edit, default: `view`) |
| `--link_name` | No | Optional destination alias for link. The source entry's current name is used when omitted. (string) |
| `--general_access` | No | Who else can open it, for share without a recipient: restricted, org, or link. Also accepted by upload into My Drive, to open the new file at once. (string, one of: restricted, org, link) |
| `--organization_id` | No | Which organization to share with, when you belong to more than one and use to=org or to=group:<uid>. (string) |
| `--expires_at` | No | Optional ISO-8601 UTC instant after which the access stops, e.g. 2026-12-31T00:00:00+00:00. (string) |
| `-p`, `--path` | No | Path to file or folder for ls, mkdir, rm, move, get_readable_url. For link: the existing source path in My Drive. For unlink: the LinkNode path in the selected managed source. For compress: folder path to compress. For decompress: archive file path to extract. For find: which directory to search. Omit it to search the whole of My Drive, or the root of the selected shared source. Naming a directory searches THAT DIRECTORY ONLY and does not descend into its subfolders — and a shared folder's own root is one such directory. To cover a subtree, use search with query_scope=subtree. tree/search/read/overview also accept a path relative to source or id. (string) |
| `-q`, `--query` | No | Find: words in names/link metadata. Search: words in names and indexed content (AND). Grep: a literal phrase in one file. Read: a literal phrase anchoring the first matching passage. Phrase matching ignores case and whitespace differences. (string) |
| `-f`, `--filter_type` | No | Filter by entry type for ls (improves performance): all (default), file, directory. Use 'file' when only need files. (string, one of: all, file, directory) |
| `--file_type` | No | Filter by file MIME type for ls (improves performance): all (default), audio, video, image. Combine with filter_type='file' for best results. (string, one of: all, audio, video, image) |
| `--target_path` | No | Destination entry path for move; destination directory for restore (the original filename is retained); destination directory inside the selected Team Drive source for link; destination folder for copy, in target_source's drive (a web Drive address /.shared-workspace/<source_id>/<folder> names the drive by itself). (string) |
| `--target_source` | No | For copy: the drive the copies go to, my_drive or a source_id from `ls --workspace shared_drive`. Defaults to the drive being copied from. Without target_source and target_path, each copy lands beside its original as name(1).ext. (string) |
| `--job_id` | No | For copy: the job id a copy still in progress answered with. Alone, it reads that copy's progress and, once done, its links; with retry=true it continues a copy that stopped. (string) |
| `--retry` | No | For copy with job_id: true continues a copy that stopped (ran out of time, failed) from where it stopped; the entries already copied are kept. (boolean) |
| `--entry_id` | No | Stable entry id, required by restore. (string) |
| `--id` | No | Address most actions by a stable entry id instead of a path — a folder id for ls/find/upload/mkdir, a file id for get_readable_url/download/rm/move. Ids come from ls/find rows and from Drive URLs (#p_fid=…, ?id=…, /s/<owner>/<id>). Your own drive is tried first, then folders shared with you; pass --owner when the URL names one. (string) |
| `--owner` | No | Owner (cogen id) of the entry given by --id, as carried by /s/<owner>/<id> and ?link=<owner>:<folder> URLs. Optional. (string) |
| `--url` | No | A Drive URL copied from the browser (drive?path=…, #p_fid=…, ?id=…&link=…, /s/<owner>/<id>). The ids it carries are extracted and resolved exactly like --id/--owner. (string) |
| `--target_folder` | No | Destination folder for download_video, download_audio, and download_file (string) |
| `--video_url` | No | Video URL to save into Drive with download_video. YouTube: billed 1 credit per MB of the delivered file (min 1 credit); downloads estimated over 1 GB are rejected up front. (string) |
| `--audio_url` | No | Audio/video URL to save into Drive with download_audio. YouTube: billed 1 credit per MB of the delivered file (min 1 credit); downloads estimated over 1 GB are rejected up front. (string) |
| `--file_url` | No | External file URL to save into Drive with download_file (string) |
| `--file_name` | No | Filename for download_file (for example annual_report.pdf); inferred when omitted (string) |
| `--file_content` | No | Content to upload to AI Drive. Can be plain text or base64-encoded binary data. For text files (txt, md, json, csv, etc.), provide plain text content. For binary files, provide base64-encoded content with 'base64:' prefix. Size limit: 1MB without confirmation, 5MB absolute maximum. (string) |
| `--upload_path` | No | Where the upload lands: the full file path (must start with '/' and include the file name), relative to --source in a shared drive. A web Drive address /.shared-workspace/<source_id>/<path> selects that shared drive by itself. To upload a new version of an existing file, reuse the same path with overwrite=true instead of creating v2/_final name variants; give genuinely new artifacts (e.g. each run of a recurring workflow) their own path. In GenTeam drives, upload at the root. With file_content the parent folder must exist (mkdir first); a local-file upload creates missing folders. (string) |
| `--overwrite` | No | Set to true to replace the file at upload_path in place (upload only). It keeps the file's id, so a share link already handed out opens the new bytes. Without it, a file_content upload fails when the name exists and a local-file upload is saved as name(1).ext under a new id. Local-file uploads also take --on-conflict overwrite, which gsk 1.10 and later honor; gsk 1.13.1 and earlier ignore --overwrite for them. (boolean) |
| `--content_type` | No | MIME type of the content. If not provided, will be auto-detected from filename. Common types: text/plain, text/markdown, application/json, text/csv (string) |
| `--confirmed` | No | Set to true to confirm upload when: (1) file size > 1MB, or (2) content contains potentially sensitive patterns. If confirmation is required but not provided, upload will fail with a warning. (boolean) |
| `--ids` | No | Read up to 16 ids, automatically limited to 6 concurrent reads, with one shared output budget. Overview accepts up to 6 ids. Copy takes up to 16 ids from one source in one job. Retain source; omit id/path/offset. (array) |
| `--queries` | No | Search: up to 4 queries, each with its own cursor. Grep: up to 16 literal phrases, matching any. Use query or queries, not both. (array) |
| `--include_passages` | No | Search: return original passages and citation URLs with hits (default true); false returns navigation only. (boolean, default: `True`) |
| `--query_scope` | No | Search: children, subtree (default), or drive (drive-root only). A file id searches just that file. (string, one of: children, subtree, drive, default: `subtree`) |
| `--search_mode` | No | For search: all (names and indexed text), filename, or content. Coverage is reported explicitly. (string, one of: all, filename, content, default: `all`) |
| `--limit` | No | Maximum results: tree 1–200 (default 100), search 1–50 (default 20), grep 1–6 (default 3). (integer) |
| `--byte_limit` | No | Maximum output bytes: 4096–65536 (default 20480); shared across search results and passages. (integer, default: `20480`) |
| `--depth` | No | Tree breadth-first depth, 1–6 (default 2). Expand a returned folder id for deeper browsing. (integer, default: `2`) |
| `--cursor` | No | Continue the same action using its returned cursor; source and query are remembered. Legacy cursors may require the original arguments. (string, default: ``) |
| `--offset` | No | Read: starting character position for a fresh range (default 0). Use cursor for continuation. (integer, default: `0`) |
| `--char_limit` | No | Maximum characters: read 1–24000 per file (default 12000); grep 512–6000 per passage (default 4000). The shared byte budget can shorten results. (integer, default: `12000`) |
| `--source_version` | No | Optional source-version check for a fresh read. Cursors include this check automatically. (string, default: ``) |
| `--wait_seconds` | No | Read: wait for an empty pending index, 0–15 seconds (default 6). Reuse retry_read once. (number, default: `6.0`) |
| `--generate` | No | For overview: return cached summaries; missing/stale summaries are queued asynchronously. Continue search/read without waiting. True also requests refresh of an existing summary. (boolean, default: `False`) |

## Address by id or URL

- Most actions accept `--id <entry_id>` instead of a path: a folder id for `ls`/`find`/`upload`/`mkdir`, a file id for `get_readable_url`/`download`/`rm`/`move`/`share`/`access`. Ids appear in `ls`/`find` rows and in Drive URLs (`#p_fid=…`, `?id=…`, `/s/<owner>/<id>`). Your own drive is tried first, then folders shared with you. (`restore` takes `--entry_id`; `link` names its My Drive entry with `--path`.)
- Add `--owner <cogen_id>` when the URL names one (`/s/<owner>/<id>`, `?link=<owner>:<folder>`), or just pass the whole address with `--url <browser-url>` — the ids are extracted for you.
- With a folder id, a `--path`/`--upload_path` you also pass is RELATIVE to that folder: `mkdir --id <folder> --path reports` creates `<folder>/reports`; `upload --id <folder> --local_file x.pdf` lands in the folder.
- A web Drive address `/.shared-workspace/<source_id>/…` (the `path=` of a browser URL) works as `--path` and as `--upload_path`: it selects that shared drive under the same edit permission as `--source`. Pass it alone; together with `--source`, `--id` or `--url` it is refused.

## Local Drive Transfers

- Upload a file or directory with `gsk drive upload --local_file <local-path> --upload_path /folder/name.ext`, on any gsk version. gsk 1.14 and later also take `gsk drive upload <local-path> /folder/` (or `-p /folder/`): the upload goes into that folder under its own name, and a last name with the file's extension renames it; gsk 1.13.1 and earlier ignore both and land the file at the drive root. Missing folders on the path are created. For shared locations, also pass `--workspace shared_with_me|shared_drive --source <source_id>`. The source drive owns the uploaded bytes and quota. The reply carries the file's `id` and `url`.
- Edit in place: upload the new bytes to the SAME path with `--on-conflict overwrite`, which gsk 1.10 and later honor (newer gsk also accepts `--overwrite true`; gsk 1.13.1 ignores it for local files). The file keeps its id, so the link already sent keeps opening the new version; a same-name upload without it lands as `name(1).ext` under a new id, and `--on-conflict error` refuses instead. Office files open in the editor are edited through wo-peer, not uploaded over.
- Upload and share in one step: `gsk drive upload --local_file <path> --upload_path /<name> --to <email|org|channel:…>` or `--general_access link|org` (My Drive only). The reply's `url` then opens for those people, and each new email recipient is notified with the link.
- Download to this machine with `gsk drive download <drive-path> [local-path]`; this is distinct from `download_file`, which saves an external URL into Drive.

## Discover, resolve, and collaborate

- Only when the source is unknown, use `ls -p /` for My Drive, `ls --workspace shared_drive` for Team/channel/DM/Hub sources, or `ls --workspace shared_with_me` for all shared sources. Reuse source IDs; duplicate source names require an explicit ID.
- With only a name, use `find --scope all -q <name>`; `mine` and `shared` narrow it. Reuse a hit's `entry_locator` (workspace/source/path). Search is bounded and may use an incomplete index: inspect coverage and never interpret no matches as proof of absence.
- A LinkNode path follows its live source for reads, folder browsing and uploads. Its `content_source_id`/`link_workspace_id` also opens that source at `/`. Do not combine the content mount with the alias's old path. `rm`/`move` on the alias operate on the alias; on a child they operate inside its source. Cross-source moves are refused. Shared source roots cannot be removed. Source-owned shared projections cannot be moved/renamed; unlinking may end that audience's share, reported by share_ended, while preserving source bytes.
- `get_readable_url` returns the native `entry_id` and, for Office files, `collaboration.file_id` and `link_workspace_id`. For live editing use `wo-peer open <file_id> --link-workspace-id <context>` (omit the flag for My Drive). Never use the shortcut ID as the room ID. Minting rechecks edit access; PDF and project links are not Office rooms.
- A DM reference grants no source access by itself. Revoked/unavailable/view-only results are permission outcomes; retrying download on the LinkNode cannot fix them.

## Which link to hand the user

- `read`, `upload`, `share`, `access`, and `link` replies carry `url`, and a `copy` reply one `url` per copy: the entry's share link (`/second-brain/s/<drive>/<entry>`, or `/aidrive/s/…` where the sharer's org blocks Second Brain). It carries no access of its own — the server decides per visitor — so paste THAT into chat, email, or a card. Reuse it without an identity lookup or URL reconstruction.
- `upload` replies carry the new file's `url` too — but the link opens only for people the file is shared with, so share it (`--to` on the upload, or `gsk drive share --id <id> …`) before handing it out.
- `download_*`, `compress`, and `decompress` replies carry a browse-location link to the folder in the user's own drive.
- `ls`/`find` rows for shared shortcuts show their open link in the Type cell (`link:file → <url>`).
- `get_readable_url` returns two different links: `readable_url` is a one-hour bytes URL for tools (`curl`, media analysis); `url` is the document page for people. Label `url` Open in AI Drive and show the path separately as plain text. If downloads are disabled, the error reply can still include `url` and `can_download: false`, but no `readable_url`. Use that `url` for viewing only; never fetch it as file bytes or change sharing to make a download work.

## YouTube Downloads

`download_video` / `download_audio` with a YouTube URL bill 1 credit per MB of the delivered file (min 1 credit); requests estimated over 1 GB are rejected up front. Time-range clipping is not supported for YouTube — provider clip downloads are broken, so download the full video and trim it locally.

## Local File Support

Parameters that accept URLs (`--video_url`, `--audio_url`, `--file_url`) also accept local file paths. The CLI automatically uploads local files before sending to the API.

## See Also

- [gsk-shared](../gsk-shared/SKILL.md) — Authentication and global flags
