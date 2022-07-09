#!/usr/bin/env node

// fwg 
// https://github.com/waymondrang/fwg

const { spawn, spawnSync } = require('child_process');
const path = require('path');
const fs = require("fs");

if (process.platform !== "win32") {
    console.error('Oops! Sorry, this script only works on Windows');
    process.exit(1);
}

var ps_version = spawnSync('$PSVersionTable.PSVersion', [], { shell: 'powershell.exe' });

if (!ps_version.stdout && ps_version.error) {
    console.log('Powershell is required to run this script');
    process.exit(1);
}

var args = process.argv.slice(2);

var target = args[0];

if (!target) {
    console.error('Specify a target directory. Type \"fwg help\" for more info');
    process.exit(1);
}

if (target.startsWith("help")) {
    console.log(`Usage\n\tfwg TARGET-DIRECTORY [-r -l] FILE-TARGETS...\n\nArguments\n\t${"TARGET-DIRECTORY".padEnd(20)}The directory in which to search for files\n\t${"OPTIONS".padEnd(20)}\n\t${"-r".padStart(10).padEnd(20)}Remove generated rules\n\t${"-l".padStart(10).padEnd(20)}Generate and save log file\n\t${"FILE-TARGETS".padEnd(20)}The file target rules. Default is *.exe\n\nExamples\n\tfwg ~/Downloads -l *.exe *.msi *.msp\n\tfwg ~/Documents -r *Launcher.exe\n`);
    process.exit(0);
}

var quotation_index = args[0].indexOf('"');

if (args.length == 1 && quotation_index != -1) {
    target = args[0].substring(0, quotation_index);
    args.push(...args[0].substring(quotation_index + 1).split(" ").map(e => e.trim()));
}

if (target.slice(-1) == "\"") {
    target = target.substring(0, target.length - 1);
}

if (target.slice(-1) != "\\" && target.slice(-1) != "/") {
    target += '\\';
}

var create_log = args.slice(1).some(e => /(\B-\bl\b)/gm.test(e.trim()));

var parsed_args = args.slice(1).map(e => e.replace(/(\B-\bl\b)/gm, '').trim()).filter(e => e != "");

// console.log('powershell', ['-c', `\"& \'${path.join(__dirname, 'fwg.ps1')}\' \'${target}\' ${args.slice(1).join(" ")}\"`]);

var start_time = new Date();

var file_path = path.join(__dirname, "/logs/" + "fwg-" + start_time.toISOString().replace(/[:.]/g, "-") + '.log');

function log_to_file(data) {
    if (!create_log)
        return;

    if (!fs.existsSync(__dirname + "/logs/"))
        fs.mkdirSync(__dirname + "/logs/");

    try {
        fs.appendFileSync(file_path, data, function (error) {
            if (error) console.error(error);
        })
    } catch {
        console.error("Could not write to log file");
    }
}

var ps = spawn('powershell', ['-c', `\"& \'${path.join(__dirname, 'fwg.ps1')}\' \'${target}\' ${parsed_args.join(" ")}\"`], { shell: 'powershell.exe' });

ps.on("spawn", function () {
    console.log(`Starting fwg version ${require("./package.json").version}`);
})

ps.stdout.on('data', (data) => {
    process.stdout.write(data);
    log_to_file("[stdout] " + data);
});

ps.stderr.on('data', (data) => {
    process.stderr.write(data);
    log_to_file("[stderr] " + data);
});

ps.on("exit", function () {
    if (create_log)
        console.log(`Created log file at ${file_path}`);

    var exit_message = `Process ended in ${((new Date() - start_time) / 1000).toFixed(2)} seconds with exit code ${ps.exitCode}`;
    log_to_file("[exit] " + exit_message);
    console.log(exit_message);
    process.exit(0);
})