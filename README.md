# Caffeinate for Macotron

Keep the Mac awake from the [Macotron](https://github.com/statico/macotron) menu bar. One click runs `caffeinate -dim`. Click again and that process stops. No terminal window stays open.

- Click the cup to turn caffeinate on or off.
- Right-click or Control-click the cup for status.
- Run **Toggle Caffeinate** from the launcher, or bind it to a hotkey.

A filled cup means a matching `caffeinate -dim` is running. A hollow cup means sleep is allowed.

## Install

1. Open Macotron. Go to Settings → Plugins → Catalog → Community.
2. Find **Caffeinate**. Press **Add**.
3. Read the source in the review sheet. Press **Add** again.

Macotron scans the plugin before it runs.

## How it works

The process list decides the icon. The plugin does not store its own on or off flag, so a reload picks up a `caffeinate` that is already running and does not start a new one.

Every five seconds the plugin runs `pgrep` for `caffeinate -dim`, including a copy started in a terminal. Other `caffeinate` commands, such as `caffeinate -i make`, are ignored.

Turning it on runs this in the background:

```sh
/usr/bin/caffeinate -dim -w $PPID >/dev/null 2>&1 &!
```

`$PPID` is Macotron, because the command runs under `zsh -c`. caffeinate exits when Macotron quits, so quitting does not leave the Mac awake. `-d`, `-i`, and `-m` hold off idle display sleep, idle system sleep, and disk idle sleep.

Turning it off runs `pkill` with the same pattern. The icon updates from a fresh `pgrep`, not from what the click asked for. The menu says "Keeping awake (caffeinate -dim)", "Sleep allowed", or "Checking...".

## Debugging

Plugin output goes to the system log under the `plugin` category.

```sh
log stream --level info --style compact \
  --predicate 'subsystem == "io.statico.macotron" AND category == "plugin"'
```

The plugin logs when it loads and when the state changes. A failed start or stop logs the shell stderr.

## License

MIT
