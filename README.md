# ElvUI Layout Studio

Edit and upgrade ElvUI character profiles in your browser, without launching World of Warcraft.

ElvUI Layout Studio lets returning players import an existing layout, reposition supported frames on a visual canvas, and export the edited profile for a future login. Profile processing stays in the browser: the app has no backend and does not upload imported settings.

> **Compatibility status:** This is an early community tool built against current Retail ElvUI profile structures. Live in-game import and WoW: Forever compatibility have not yet been verified. Keep your original profile and import edits under a new name.

## What it can do

- Import current `!E2!` character profile strings.
- Import and upgrade legacy `!E1!` character profiles to `!E2!`.
- Import ElvUI Lua table profile exports.
- Read account `SavedVariables/ElvUI.lua` files and select among their profiles.
- Move supported frames by dragging, coordinates, anchors, grid snapping, or arrow keys.
- Resize supported unit frames and the minimap.
- Edit action bar button layout and visibility.
- Preview and edit BenikUI detached portraits, dashboards, custom panels, widget bars, and the request-stop button from their real profile settings.
- Preview common resolutions and UI scales.
- Undo and redo layout changes.
- Export an ElvUI Lua table profile or an experimental `!E2!` profile string.
- Preserve settings the editor does not understand, including plugin data and unknown movers.

## Upgrade an old profile

1. Select **Import profile**.
2. Paste an `!E1!` character profile or choose a text file containing one.
3. Select **Read profile**.
4. Select **Upgrade to !E2!**.
5. Copy or download the upgraded string.

The upgrade action does not change the layout currently open in the editor. Legacy decoding follows ElvUI's former LibDeflate, raw Deflate, and AceSerializer pipeline documented in the [ElvUI encoding change](https://github.com/tukui-org/ElvUI/commit/0e3685c461ee9dd69b47af364c0e2bf879498a14).

## Edit a layout

1. Import a character profile or `ElvUI.lua` backup.
2. Choose a profile when the saved variables file contains more than one.
3. Select frames on the canvas or in the frame list.
4. Move or resize them with the canvas and property controls.
5. Select **Export to ElvUI**, choose a format, and copy or download the result.
6. In ElvUI, import the result under a new profile name and verify the layout before replacing anything.

Your account backup is normally located under:

```text
World of Warcraft/<game version>/WTF/Account/<account>/SavedVariables/ElvUI.lua
```

## Privacy and safety

All parsing, editing, compression, and export happen locally in the browser. The application does not execute imported Lua. Its Lua importer accepts saved data structures and rejects functions, calls, loops, and expressions.

Imports are limited to 4 MB, decompressed data has the same limit, and excessively nested profiles are rejected. Real user profile fixtures are kept out of the repository.

## Compatibility details

Current ElvUI source uses CBOR, a `::profile::name` envelope, Deflate compression, Base64, and the `!E2!` prefix. The importer also accepts a verified Retail profile variant containing direct CBOR without the name envelope. See ElvUI's [Distributor.lua](https://github.com/tukui-org/ElvUI/blob/main/ElvUI/Game/Shared/General/Distributor.lua).

The automated suite covers legacy upgrades, `!E2!` envelopes, unknown-field preservation, plugin tables, mixed table keys, Unicode, coordinate conversion, and malformed inputs. These checks establish internal preservation; they do not replace an import test inside WoW.

The visual canvas is approximate. Missing mover positions use editor estimates, and unknown plugin movers use compact editable anchor markers. BenikUI has first-class geometry and visibility support; dashboard contents and context-only frames can still differ outside the game. Fonts, textures, combat behavior, and live game data are not simulated. Unresolved relative anchors are preserved and cannot be moved until their parent frame is known.

Character profiles are supported. Global, private, filter, and style-filter exports are outside the current editor scope.

## Local development

Requirements: Node.js 22 or newer.

```bash
npm install
npm run build
npm test
npm run dev
```

Open [http://127.0.0.1:5173/](http://127.0.0.1:5173/). Static deployment serves the `dist/` directory; no server-side profile processing is required.

Render deployment is defined in `render.yaml` as a static site. It builds with `npm ci && npm run build`, publishes `dist/`, deploys after GitHub checks pass, and applies basic browser security headers.

The project uses vanilla JavaScript and CSS, [esbuild](https://esbuild.github.io/), [luaparse](https://github.com/fstirlitz/luaparse), [cbor-x](https://github.com/kriszyp/cbor-x), and [fflate](https://github.com/101arrowz/fflate).

## Project status

The next release milestone is an in-game, new-name import test using the target client and corresponding ElvUI version. After that, the editor needs versioned defaults and geometry for WoW: Forever plus broader frame coverage.

ElvUI Layout Studio is an independent community project. It is not affiliated with or endorsed by ElvUI, Tukui, Blizzard Entertainment, or World of Warcraft.
