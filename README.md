# ElvUI Layout Studio

A browser editor for arranging ElvUI layouts without an active WoW subscription. Intended audience: returning players and prospective WoW: Forever players. Current implementation is an early working editor, not a verified Forever integration.

## Development

Node 22 or newer. Run `npm install`, `npm run build`, and `npm run dev`. The preview runs at http://127.0.0.1:5173. Run `npm test` for the profile preservation and coordinate checks. Static hosting serves `dist/`; no backend or account is required for profile processing.

## Implemented

- Import account SavedVariables/ElvUI.lua data with multiple-profile selection, current !E2! strings, and Lua table profile exports.
- Client-side data-only Lua parsing; no Lua code execution. Imports are not uploaded or stored by the application.
- Move supported frames with dragging, offsets, anchors, grid snapping, or arrow keys; resize supported unit frames and minimap; edit action-bar button layout and visibility.
- Undo/redo; viewport and scale preview; explicit handling of unknown/circular relative anchors.
- Export ElvUI Lua profile text and experimental !E2! strings. Preserve unknown settings, numeric/string/boolean table keys, UTF-8 text, and plugin tables within the selected profile.
- Optional WebMCP read-layout and move-frame tools using the same editor state.

## Compatibility boundaries

Retail source inspected on 2026-09-14: [Distributor.lua](https://github.com/tukui-org/ElvUI/blob/main/ElvUI/Game/Shared/General/Distributor.lua), [Movers.lua](https://github.com/tukui-org/ElvUI/blob/main/ElvUI/Game/Shared/General/Movers.lua), and [Layout.lua](https://github.com/tukui-org/ElvUI/blob/main/ElvUI/Game/Shared/Layout/Layout.lua).

The current export implementation uses CBOR plus `::profile::name`, Deflate compression, Base64, and an !E2! prefix. Lua table import is an independently supported path in the inspected ElvUI source. The application's tests verify internal round trips, not Blizzard's C_EncodingUtil or a real WoW import. Lua output doubles pipe characters as expected by ElvUI's table import path.

WoW: Forever addon APIs, an ElvUI Forever release, and live-client imports are unverified. The editor must not claim release compatibility until representative in-game imports and screenshots have been checked. Do not overwrite a user's original profile during acceptance testing.

Legacy !E1! compressed strings are not yet supported; use a local ElvUI.lua backup instead. Global/private/filter settings are not exported by this character-profile editor. Binary non-UTF-8 Lua strings and CBOR values outside supported Lua table types are rejected. Import size is limited to 4 MB, with a decompression limit.

The canvas is an approximation. Missing mover positions use editor estimates; missing dimensions use preview defaults. UI scale is a manual preview setting. Raid groups, chat data bars, dynamic unit frames, textures/fonts, and plugin geometry are not faithfully rendered. Unsupported relative anchor targets are retained without movement. Dragging deliberately writes a CENTER/UIParent anchor; raw offsets preserve the existing anchor relation. Unknown settings in the selected profile remain unchanged.

## Next validation milestone

Obtain a real target-client profile and the corresponding ElvUI version. Add immutable fixtures from that version, verify !E2! decoding against its encoding API, and test new-name import in the game. Then add a versioned defaults/geometry adapter for Forever, extend frame types, and cover legacy exports. Existing users can export their edits now for preservation, but game compatibility remains experimental.
