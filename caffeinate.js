macotron.plugin({
  title: "Caffeinate",
  description: "Keep the Mac awake with caffeinate -dim.",
  help: "Click the cup to toggle. Right-click for status.",
});

// Also matches a bare `caffeinate -dim` from a terminal, so the icon reflects it and Off stops it. Other invocations such as `caffeinate -i make` do not match.
const MATCH = "^(/usr/bin/)?caffeinate -dim( -w [0-9]+)?$";
const SH = {
  // $PPID inside zsh -c is Macotron, so caffeinate exits when Macotron quits instead of leaving an assertion behind.
  // Redirect and disown. shell.run reads pipes to EOF, so a child holding them hangs the call.
  start: "/usr/bin/caffeinate -dim -w $PPID >/dev/null 2>&1 &!",
  stop: "/usr/bin/pkill -f '" + MATCH + "'",
  status: "/usr/bin/pgrep -f '" + MATCH + "'",
};

const FROM_EXIT = { 0: "on", 1: "off" };
const VIEW = {
  unknown: { symbol: "cup.and.saucer", label: "Checking...", action: "Turn On", want: true },
  on: { symbol: "cup.and.saucer.fill", label: "Keeping awake (caffeinate -dim)", action: "Turn Off", want: false },
  off: { symbol: "cup.and.saucer", label: "Sleep allowed", action: "Turn On", want: true },
};

let state = "unknown";
let busy = false;

async function locked(fn) {
  while (busy) await macotron.sleep(20);
  busy = true;
  try {
    return await fn();
  } finally {
    busy = false;
  }
}

async function probe() {
  const result = await macotron.shell.run(SH.status);
  const next = FROM_EXIT[result.exitCode];
  if (!next) {
    console.error("caffeinate: status failed:", result.stderr);
    return state;
  }
  if (next !== state) console.log("caffeinate: " + state + " -> " + next);
  state = next;
  return state;
}

function paint() {
  const view = VIEW[state];
  macotron.menubar.status("caffeinate", {
    title: "",
    sfSymbol: view.symbol,
    onClick: toggle,
    menu: [
      { title: view.label },
      "-",
      { title: view.action, onClick: () => setOn(view.want) },
    ],
  });
}

async function refresh() {
  if (busy) return;
  await locked(async () => {
    try {
      await probe();
    } catch (err) {
      console.error("caffeinate: status failed:", err);
    }
    paint();
  });
}

async function setOn(on) {
  const want = on ? "on" : "off";
  await locked(async () => {
    let stderr = "";
    try {
      const result = await macotron.shell.run(on ? SH.start : SH.stop);
      stderr = result.stderr;
      await probe();
    } catch (err) {
      stderr = String(err);
      console.error("caffeinate: shell failed:", err);
    }
    paint();
    if (state === want) return;
    console.error("caffeinate: could not turn " + want, stderr);
    macotron.notify.toast("Caffeinate", "Could not turn " + want, { color: "error" });
  });
}

function toggle() {
  return setOn(state !== "on");
}

console.log("caffeinate: loaded");
paint();
refresh();
macotron.every(5000, refresh);
macotron.command("Toggle Caffeinate", "Keep the Mac awake with caffeinate -dim", toggle, { id: "caffeinate/toggle" });
