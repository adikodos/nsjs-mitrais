const roundingValueConverter = {
    /* A Converter object should have one or two functions (toView and toModel) 
    executed every time when a data should be converted
    */
    
    /* A toView function is called when data will be 
    displayed to the end user as a value of any UI view */
    toView: function (value) {
        return value;
    },
    /*a toModel function will be called when there is 
    an editable element (like TextField) and the user enters a new value. */
    toModel: function (value) {
        return Math.round(value);
    }
}

module.exports = roundingValueConverter;
