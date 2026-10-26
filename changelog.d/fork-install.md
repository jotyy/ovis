### Changed
- This fork installs as its own herdr plugin, `jotyy.ovis`, from `jotyy/ovis` at the `studio`
  branch: `curl -fsSL https://raw.githubusercontent.com/jotyy/ovis/studio/install.sh | sh` (Windows:
  `install.ps1` the same way). An upstream install (`devswha.ovis`) is replaced, with its settings and
  token. The fork has no release tags, so a rerun of the installer is the update. Anonymous usage
  counts are off unless `OVIS_TELEMETRY=1`, since the receiver is upstream's; push alerts name the
  fork, and the Settings links (changelog, star, phone setup help) point at it.
