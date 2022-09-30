function validateParams(args) {
    let requiredKeys = args.requiredKeys || []
    let invalidParams = []
    requiredKeys.forEach(argKey => {
        if (!args[argKey] || !args[argKey].trim().length) {
            invalidParams.push({
                error: `Invalid value for ${argKey}`
            })
        }
    });
    return invalidParams
}

module.exports = validateParams;