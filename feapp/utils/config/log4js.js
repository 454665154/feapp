module.exports = {
    appenders: [{
        type: "file",
        filename: "logs/startup.log",
        category: "startup"
    }, {
        type: "logLevelFilter",
        level: "ERROR",
        appender: {
            type: "dateFile",
            filename: "logs/error",
            alwaysIncludePattern: true,
            pattern: "-yyyy-MM-dd.log"
        }
    }]
}
