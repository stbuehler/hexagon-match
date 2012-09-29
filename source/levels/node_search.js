
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
var hm = hm || {};

hm.solve = function(level, uniqueSolution) {
	var occupied = [];
	var i, j;
	var solution = null;
	var cursolution = [];
	var usedcols = { };

	function makeTag(c1, c2) {
		return (c1 < c2) ? c1+c2 : c2+c1;
	}
	function possibleCols(c1, c2) {
		var tags = [], i, j, clist = level.colors, c;
		if ('?' == c1 && '?' == c2) {
			for (i = 0; i < clist.length; i++) {
				for (j = i; j < clist.length; j++) {
					c =  clist[i] + clist[j];
					if (!usedcols[c]) tags.push(c);
				}
			}
		} else if ('?' == c1) {
			for (i = 0; i < clist.length; i++) {
				c =  makeTag(clist[i], c2);
				if (!usedcols[c]) tags.push(c);
			}
		} else if ('?' == c2) {
			for (i = 0; i < clist.length; i++) {
				c =  makeTag(clist[i], c1);
				if (!usedcols[c]) tags.push(c);
			}
		} else {
			c =  makeTag(c1, c2);
			if (!usedcols[c]) tags.push(c);
		}
		return tags;
	}

	function addMoveWith(r, x, y, tx, ty, direction) {
		var i, cols = possibleCols(level.lines[y][x], level.lines[ty][tx]);
		for (i = 0; i < cols.length; i++) {
			r.push({sx: x, sy: y, tx: tx, ty: ty, direction: direction, tag: cols[i] });
		}
	}

	function nextNeighbours(x, y) {
		var r = [];
		var tx = x;
		if (x < 0 || y < 0 || x >= level.width || y >= level.height) return r;
		if (x + 1 < level.width && !occupied[y][x+1]) addMoveWith(r, x, y, x+1, y, 1);
		if (y + 1 < level.height) {
			if (0 === y % 2) tx = tx-1;
			if (tx >= 0 && !occupied[y+1][tx]) addMoveWith(r, x, y, tx, y+1, 3);
			tx = tx + 1;
			if (tx < level.width && !occupied[y+1][tx]) addMoveWith(r, x, y, tx, y+1, 2);
		}
		return r;
	}

	function run(x, y) {
		var l, i, n, r = 0;

		if (x >= level.width) {
			y++;
			x = 0;
			if (y >= level.height) {
				if (!solution) solution = cursolution.slice();
				return 1;
			}
		}
		while (occupied[y][x]) {
			x++;
			if (x >= level.width) {
				y++;
				x = 0;
				if (y >= level.height) {
					if (!solution) solution = cursolution.slice();
					return 1;
				}
			}
		}

		occupied[y][x] = 1;
		l = nextNeighbours(x, y);
		for (i = 0; i < l.length; i++) {
			n = l[i];
			usedcols[n.tag] = 1;
			cursolution.push(n);
			occupied[n.ty][n.tx] = 1;
			r += run(x+1, y);
			occupied[n.ty][n.tx] = 0;
			cursolution.pop();
			usedcols[n.tag] = 0;
			if (r > 1) break; /* we only want to know whether it is unique, not the count of possible solutions */
		}
		occupied[y][x] = 0;
		return r;
	}

	for (j = 0; j < level.height; j++) {
		occupied[j] = [];
		for (i = 0; i < level.width; i++) {
			occupied[j][i] = (' ' == level.lines[j][i]) ? 1 : 0;
		}
	}

	var r = run(0, 0);
	if (r === 0) return false;
	if (r > 1) {
		if (uniqueSolution) return false;
		if (enyo && enyo.warn) enyo.warn("Solution not unique");
	}
	return { solution: solution, unique: r == 1 };
};
var hm = hm || {};

hm.Rating = function Rating(list) {
	this.list = list;
}

hm.Rating.prototype.unique = function(level) {
	level = Math.min(level, this.list.length-1);
	if (level < 0) return 0;
	return this.list[level].unique;
};

hm.Rating.prototype.easy = function(level) {
	level = Math.min(level, this.list.length-1);
	if (level < 0) return 0;
	return this.list[level].easyunique;
};

hm.rate = function(level) {
	var occupied = [];
	var i, j;
	var tags = {};
	var info = { unique: 0, easyunique: 0 };
	var l = level.lines;
	var w = level.width, h = level.height;

	function addMoveWith(r, x, y, tx, ty, othercol) {
		var col = l[ty][tx];
		if ('?' != col && -1 == othercol.indexOf(col)) return;
		r.push([x,y,tx,ty]);
		//r.push({sx: x, sy: y, tx: tx, ty: ty});
	}

	function nextNeighbours(r, x, y, tag) {
		if (occupied[y][x]) return;
		var col0 = l[y][x], col1;
		if (col0 == tag[0]) {
			col1 = tag[1]
		} else if (col0 == tag[1]) {
			col1 = tag[0];
		} else if (col0 == '?') {
			col1 = tag;
		} else {
			return;
		}

		var tx = x;
		if (x + 1 < w && !occupied[y][x+1]) addMoveWith(r, x, y, x+1, y, col1);
		if (y + 1 < h) {
			var ty = y + 1;
			if (0 === y % 2) tx = tx-1;
			if (tx >= 0 && !occupied[ty][tx]) addMoveWith(r, x, y, tx, ty, col1);
			++tx;
			if (tx < w && !occupied[ty][tx]) addMoveWith(r, x, y, tx, ty, col1);
		}
	}

	function placesFor(tag) {
		var x, y, r = [];
		for (x = 0; x < w; ++x) {
			for (y = 0; y < h; ++y) {
				nextNeighbours(r, x, y, tag);
			}
		}
		return r;
	}

	function firstSearch() {
		var remove = [];
		var i, j, tag, l;
		for (i = 0; i < level.colors.length; ++i) {
			for (j = i; j < level.colors.length; ++j) {
				tag = level.colors[i] + level.colors[j];
				tags[tag] = l = placesFor(tag);
				if (1 == l.length) remove.push(tag);
			}
		}
		return remove;
	}

	function remove(taglist) {
		var i;
		for (i = 0; i < taglist.length; ++i) {
			var tag = taglist[i];
			var m = tags[tag][0];
			delete tags[tag];

			++info.unique;
			if (tag[0] == tag[1]) ++info.easyunique;

			/* mark field */
			occupied[m[1]][m[0]] = 1;
			occupied[m[3]][m[2]] = 1;
		}
	}

	function filter() {
		var remove = [];
		var i, tag, moves, m;
		for (tag in tags) {
			var moves = tags[tag];
			for (i = 0; i < moves.length; ++i) {
				m = moves[i];
				if (occupied[m[1]][m[0]] || occupied[m[3]][m[2]]) {
					moves.splice(i, 1);
					--i;
				}
			}
			if (1 == moves.length) remove.push(tag);
		}
		return remove;
	}

	for (j = 0; j < h; ++j) {
		occupied[j] = [];
		for (i = 0; i < w; ++i) {
			occupied[j][i] = (' ' == l[j][i]) ? 1 : 0;
		}
	}

	var rem;
	rem = firstSearch();

	var rating = [];
	while (rem.length > 0) {
		remove(rem);
		rating.push({ unique: info.unique, easyunique: info.easyunique});
		rem = filter();
	}

	return (new hm.Rating(rating));
};
var hm = hm || {};

hm.levelPattern = function(level) {
	var i, j, l, lines = level.lines, n;
	level = {
		title: 'Pattern ' + level.title,
		width: level.width,
		height: level.height,
		colors: level.colors,
		lines: []
	};
	for (j = 0; j < lines.length; j++) {
		l = lines[j];
		n = '';
		for (i = 0; i < l.length; i++) {
			n += (' ' == l[i]) ? ' ' : '?';
		}
		level.lines.push(n);
	}
	return level;
};

hm.allTags = function (colors) {
	var i, j, tags = [];
	for (j = 0; j < colors.length; j++) {
		for (i = j; i < colors.length; i++) {
			tags.push(colors[i] + colors[j]);
		}
	}
	return tags;
};

hm.fillPattern = function (level, uniqueSolution, filter) {
	var i;
	var tags = hm.allTags(level.colors);
	var lines = level.lines, width = level.width, height = level.height;
	var tries = 0, totals = 0, filtered = 0;
	var rndOrder = [];

	function strToArray(s) {
		var a = [];
		for (var i = 0; i < s.length; ++i) a[i] = s[i];
		return a;
	}
	function arrToString(a) {
		return ''.concat.apply('', a);
	}

	function addMoveWith(r, x, y, tx, ty, tag) {
		r.push({sx: x, sy: y, tx: tx, ty: ty, scolor: tag[0], tcolor: tag[1] });
		if (tag[0] != tag[1]) {
			r.push({sx: x, sy: y, tx: tx, ty: ty, scolor: tag[1], tcolor: tag[0] });
		}
	}

	function nextNeighbours(x, y, tag) {
		var r = [];
		var tx = x;
		if (x < 0 || y < 0 || x >= width || y >= height) return r;
		if (x + 1 < width && ('?' == lines[y][x+1])) addMoveWith(r, x, y, x+1, y, tag);
		if (y + 1 < height) {
			if (0 === y % 2) tx = tx-1;
			if (tx >= 0 && ('?' == lines[y+1][tx])) addMoveWith(r, x, y, tx, y+1, tag);
			tx = tx + 1;
			if (tx < width && ('?' == lines[y+1][tx])) addMoveWith(r, x, y, tx, y+1, tag);
		}
		return r;
	}

	function run(x, y, tagndx) {
		var l, i, n, ord = rndOrder[tagndx];

		if (x >= width) {
			++y;
			x = 0;
			if (y >= height) {
				++tries; ++totals;
				//if (0 === totals % 20000 && console && console.log) console.log("Running solver after " + totals + " tries.");
				if (filter && !filter(level)) { ++filtered; return false; };
				if (uniqueSolution && !hm.solve(level, true)) return false;
				return true;
			}
		}
		while ('?' != lines[y][x]) {
			++x;
			if (x >= width) {
				++y;
				x = 0;
				if (y >= height) {
					++tries; ++totals;
					//if (0 === totals % 20000 && console && console.log) console.log("Running solver after " + totals + " tries.");
					if (filter && !filter(level)) { ++filtered; return false; }
					if (uniqueSolution && !hm.solve(level, true)) return false;
					return true;
				}
			}
		}

		l = nextNeighbours(x, y, tags[tagndx]);
		l.doShuffle();
		for (i = 0; i < ord.length; ++i) {
			n = l[ord[i]];
			if (!n) continue;
			lines[n.sy][n.sx] = n.scolor;
			lines[n.ty][n.tx] = n.tcolor;
			if (run(x+1, y, tagndx+1)) return true;
			lines[n.ty][n.tx] = '?';
			if (tries >= 15000) break;
		}
		lines[y][x] = '?';
		return false;
	}

	function randomizeOrder() {
		var i, l = [0,1,2,3,4,5], thin = 2*tags.length / 3, ll;
		for (i = 0; i < tags.length; ++i) {
			ll = l.shuffle();
			if (i < thin) ll.splice(3, 3);
			rndOrder[i] = ll;
		}
	}

	for (i = 0; i < lines.length; ++i) {
		lines[i] = strToArray(lines[i]);
	}

	while (true) {
		tries = 0;
		tags.doShuffle();
		randomizeOrder();
		var r = run(0, 0, 0);
		if (r) break;
		if (tries > 0 && console && console.log) console.log("No solution found after " + totals + " tries (" + filtered + " were filtered), restart.");
	}

	for (i = 0; i < lines.length; i++) {
		lines[i] = arrToString(lines[i]);
	}
	if (console && console.log) console.log("Found solution after " + totals + " tries (" + filtered + " were filtered).");

	return r;

};

var tstLevel = {
	title: "Test",
	width: 9,
	height: 9,
	colors: "BGORVY",
	lines: ["BBGBOBYVG","YYBOGBOG "," ORV GGY "," BR  OY  ","  RRGRV  ","  VVRR   ","   VOV   ","   YO    ","    Y    "]
};

function Medium_filterRating(level) {
	var rating = hm.rate(level);
	if (rating.unique(0) < 3 || rating.easy(0) < 1) return false;
	if (rating.unique(1) < 5) return false;
	if (rating.unique(2) < 6 || rating.easy(2) < 2) return false;
	return true;
}

function createLevel1() {
	var pattern = {
		title:"Pattern",
		width:9,
		height:9,
		colors:"BGORVY",
		lines:[
			"?????????",
			"???????? ",
			" ??? ??? ",
			" ??  ??  ",
			"  ?????  ",
			"  ????   ",
			"   ???   ",
			"   ??    ",
			"    ?    "
		]
	};
	hm.fillPattern(pattern, true, Medium_filterRating);
	console.log("Level found: %j", pattern.lines);
}

function createLevel2() {
	var pattern = {
		title:"Pattern",
		width:5,
		height:3,
		colors:"BGR",
		lines:[
			" ??? ",
			"?????",
			" ????",
		]
	};
	hm.fillPattern(pattern, true);
	console.log("Level found: %j", pattern.lines);
}

/*
var start = (new Date).getTime();
var num = 10000;
for (var i = 0; i < num; i++) hm.rate(tstLevel);
var diff = ((new Date).getTime() - start) / 1000.0;

console.log("Rated ", Math.round(num / diff), " levels per second");
console.log("Rate result: ", hm.rate(tstLevel));
*/

while (true) {
	createLevel2();
}

