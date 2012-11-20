
/// logging functions ///
function clearOutput() {
    id("outputbox").value = "";
}

function log(text) {
    id("outputbox").value += text + "\r\n";
}

function logSeperatorLine() {
    log("------------------" + new Date().toTimeString() + "--------------------");
}

function logObject(name, obj) {
    log(name + " : ");
    log(window.JSON.stringify(obj, null, "\t"));
    logSeperatorLine();
}