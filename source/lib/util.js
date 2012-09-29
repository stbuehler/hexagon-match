
/* http://perfectionkills.com/detecting-event-support-without-browser-sniffing/
 *  - doesn't work with "unload" in IE
 */
var isEventSupported = (function(){
	var TAGNAMES = {
			'select':'input','change':'input',
			'submit':'form','reset':'form',
			'error':'img','load':'img','abort':'img'
	};
	function isEventSupported(eventName) {
		var el = document.createElement(TAGNAMES[eventName] || 'div');
		eventName = 'on' + eventName;
		var isSupported = (eventName in el);
		if (!isSupported) {
			el.setAttribute(eventName, 'return;');
			isSupported = typeof el[eventName] == 'function';
		}
		el = null;
		return isSupported;
	}
	return isEventSupported;
})();

Array.prototype.doShuffle = function() {
	var j, x, i;
	for(i = this.length-1; i >= 0; --i) {
		j = Math.floor(Math.random() * i);
		x = this[i]; this[i] = this[j]; this[j] = x;
	}
};

Array.prototype.shuffle = function() {
	var r = this.slice();
	r.doShuffle();
	return r;
};

var hm = hm || {};

hm.levelID = function(level) {
	return hex_sha1(window.JSON.stringify([level.width,level.height,level.colors,level.lines]));
};

var enyo = enyo || {};
