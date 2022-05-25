// These are yoinked from Underscore.js but are added to the function prototype
// so that we can ruin the world.
(function() {
  var debounce, throttle;

  debounce = function(func, wait, immediate) {
    var timeout;
    return function() {
      var context = this, args = arguments;
      var later = function() {
        timeout = null;
        if (!immediate) func.apply(context, args);
      };
      if (immediate && !timeout) func.apply(context, args);
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  throttle = function(func, wait) {
    var context, args, timeout, throttling, more, result;
    var whenDone = debounce(function(){ more = throttling = false; }, wait);
    return function() {
      context = this; args = arguments;
      var later = function() {
        timeout = null;
        if (more) func.apply(context, args);
        whenDone();
      };
      if (!timeout) timeout = setTimeout(later, wait);
      if (throttling) {
        more = true;
      } else {
        result = func.apply(context, args);
      }
      whenDone();
      throttling = true;
      return result;
    };
  };

  Function.prototype.debounce = function(wait, immediate) {
    return debounce(this, wait, immediate);
  };

  Function.prototype.throttle = function(wait) {
    return throttle(this, wait);
  };
})();
