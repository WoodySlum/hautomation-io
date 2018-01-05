// Global mocks

Function.prototype.clone = function() {
    var that = this;
    var temp = function temporary() { return that.apply(this, arguments); };
    for(var key in this) {
        if (this.hasOwnProperty(key)) {
            temp[key] = this[key];
        }
    }
    return temp;
};

// setTimeout
const oSetTimeout = setTimeout.clone();
mockSetTimeout = () => {
    setTimeout = (fn, time, ...objs) => {
        fn(...objs);
    }
};

restoreSetTimeout = () => {
    setTimeout = oSetTimeout;
};

mockSetTimeout();
