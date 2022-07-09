# fwg

A Windows command line tool to block outbound connections for files within a directory.

fwg utilizes the power of PowerShell and Windows Network Shell to bulk create firewall rules for a specified folder and targeted files.

## Features

- Bulk generate firewall rules for executables
- Target specific files with wildcard support
- Remove generated firewall rules

## Installation

To use fwg in the terminal, install with the `-g` option

```console
npm install -g fwg
```

## Usage

_Command must be run with administrator privileges!_

```console
fwg TARGET-DIRECTORY [-l -r] FILE-TARGETS...
```

`*.exe` executables are selected by default. User-provided file targets will override this selector.

**Options**

_Options must be typed separately_

`-r`

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Remove generated firewall rules (if exists)

`-l`

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Saves output to a new log file in `%INSTALLATION_DIRECTORY%/logs/`

## Examples

This command would block all outbound connections from executables and installers within the user's downloads folder and generate a log file.

```console
fwg ~/Downloads -l *.exe *.msi *.msp
```

fwg also works with relative paths. This command will run fwg in the current directory of the console and block executables (set by default).

```console
fwg ./
```

This command will remove generated firewall rules for any executable matching the pattern `*Launcher.exe` in the user's Documents folder.

```console
fwg ~/Documents -r *Launcher.exe
```
