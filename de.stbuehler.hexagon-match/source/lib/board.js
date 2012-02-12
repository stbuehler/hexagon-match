var hm = hm || {};

hm.Board = function(canvaslayers, themeName, noStorage) {
	this._layers = canvaslayers;
	this.resize(canvaslayers[0].clientWidth, canvaslayers[0].clientHeight);
	this._level = null;
	this._levelid = null;
	this._storage = { marks: [] };
	this._marks = [];
	this.cheated = false;
	this.noStorage = noStorage;
	this.theme = themeName;
	this.highlight();
};
hm.Board.LAYERS = 3;

hm.Board.prototype = {
	resize: function(width, height) {
		var i, l, c;
		if (!width) width = 800;
		if (!height) height = 640;

		this._dim = { width: width, height: height };

		for (i = 0; i < hm.Board.LAYERS; i++) {
			l = this._layers[i];

			l.setAttribute("width", width);
			l.setAttribute("height", height);
		}
		this._calcLevelGrid();
		this.refresh();
	},
	refresh: function() {
		var i, l, c;
		if (!this._level || !this._theme) {
			for (i = 0; i < hm.Board.LAYERS; i++) {
				l = this._layers[i];

				c = l.getContext('2d');
				c.clearRect(0, 0, this._dim.width, this._dim.height);
			}
		} else {
			this._renderLevel();
			this._renderMarks();
			this._renderHighlight();
		}
	},
	_renderLevel: function() {
		var i, j, c;

		if (!this._level || !this._theme) return;

		c = this._layers[0].getContext('2d');
		c.clearRect(0, 0, this._dim.width, this._dim.height);
		c.drawImage(this._theme.background, 0, 0, this._dim.width, this._dim.height);

		for (j = 0; j < this._level.height; j++) {
			for (i = 0; i < this._level.width; i++) {
				this._drawPiece(i, j, this._theme.pieces[this._level.lines[j][i]], c);
			}
		}
	},
	_renderMarks: function() {
		var i, c;

		if (!this._level || !this._theme) return;

		c = this._layers[1].getContext('2d');
		c.clearRect(0, 0, this._dim.width, this._dim.height);

		for (i = 0; i < this._marks.length; i++) {
			this._drawMark(this._marks[i], c);
		}
	},
	_renderHighlight: function() {
		var i, c;

		if (!this._level || !this._theme) return;

		c = this._layers[2].getContext('2d');
		c.clearRect(0, 0, this._dim.width, this._dim.height);

		if (!this._highlight_active) return;

		for (j = 0; j < this._level.height; j++) {
			for (i = 0; i < this._level.width; i++) {
				if (' ' != this._level.lines[j][i] && !this._highlight[j][i]) {
					this._drawPiece(i, j, this._theme.disable, c);
				}
			}
		}
	},
	_calcLevelGrid: function() {
		if (!this._level) return;

		var pw = (this._level_right - this._level_left)*0.5*Math.sqrt(3.0);
		var ph = this._level.height * 0.75 + 0.25;
		var ratio = Math.min(this._dim.width / pw, this._dim.height / ph);
		/* one piece is ratio high and 0.5*Math.sqrt(3)*ratio wide */

		pw = 0.5*Math.sqrt(3.0)*ratio;
		ph = ratio;

		this._grid = {
			offx: - this._level_left * pw + (this._dim.width - (this._level_right - this._level_left)*pw)/2.0,
			offy: 0,
			stepx: pw,
			stepy: 0.75*ph,
			pieceWidth: pw,
			pieceHeight: ph,
		};
	},
	_verifyPos: function(p) {
		if (!this._level) return false;
		if (p.x < 0 || p.x >= this._level.width || p.y < 0 || p.y >= this._level.height) return false;
		if (' ' == this._level.lines[p.y][p.x]) return false;
		return p;
	},
	getField: function(x, y) { /* canvas coords to field coords */
		if (!this._level) return false;
		var j, i, dx = 0.5*Math.sqrt(3.0), dy = 0.75; 

		/* normalize x/y */
		x = x - this._grid.offx - this._grid.stepx/2;
		y = y - this._grid.offy - this._grid.pieceHeight/2;
		y = y / this._grid.pieceHeight;
		x = x / this._grid.pieceHeight;

		/* base line and column */
		j = Math.floor(y / dy);
		y = y - j * dy;
		if (0 != j % 2) x = x - 0.5*dx; /* offset on odd lines */
		i = Math.floor(x / dx);
		x = x - i * dx;

		var mx = x - 0.5*dx;
		x = 0.5*dx - Math.abs(mx);

		if (x + 2*y <= dx) {
			if (mx < 0) {
				return this._verifyPos({ x: i, y: j });
			} else {
				return this._verifyPos({ x: i+1, y: j });
			}
		} else {
			return this._verifyPos({ x: i + (0 == j % 2 ? 0 : 1), y: j+1 });
		}
	},

	set level(value) {
		if (!value) return;
		this._level = value;
		this.cheated = false;
		this._levelid = hm.levelID(this._level);

		var j;
		this._level_left = 0.5;
		this._level_right = this._level.width;
		for (j = 0; j < this._level.height; j++) {
			if (0 == j % 2) {
				if (this._level.lines[j][0] != ' ') this._level_left = 0;
			} else {
				if (this._level.lines[j][this._level.width-1] != ' ') this._level_right = this._level.width+0.5;
			}
		}
		this._calcLevelGrid();
		this._clearMarks();
		this._clearHighlight();
		this._loadStorage();
		this._renderLevel();
	},
	get level() {
		return this._level;
	},

	_makeTag: function(c1, c2) {
		return (c1 < c2) ? c1+c2 : c2+c1;
	},
	_makeTags: function(c1, c2) {
		var i, j, clist = this._level.colors, tags = [];
		if ('?' == c1 && '?' == c2) {
			for (i = 0; i < clist.length; i++) {
				for (j = i; j < clist.length; j++) {
					tags.push(clist[i] + clist[j]);
				}
			}
		} else if ('?' == c1) {
			for (i = 0; i < clist.length; i++) {
				tags.push(this._makeTag(clist[i], c2));
			}
		} else if ('?' == c2) {
			for (i = 0; i < clist.length; i++) {
				tags.push(this._makeTag(clist[i], c1));
			}
		} else {
			return [this._makeTag(c1, c2)];
		}
		return tags;
	},
	getPossibleTags: function (sx, sy, tx, ty) {
		var tags = this._makeTags(this._level.lines[sy][sx], this._level.lines[ty][tx]);
		return tags.filter(function (t) { return !this._usedcolors[t]; }.bind(this));
	},
	getTag: function (sx, sy, tx, ty) {
		var tags = this.getPossibleTags(sx, sy, tx, ty);
		if (1 != tags.length) return null;
		return tags[0];
	},
	fieldTupleDirected: function(sx, sy, direction) { /* accepts negative direction, returns positive */
		if (!this._level) return;

		var tx, ty = sy;
		if (direction < 0) {
			tx = sx;
			sx = sx - (0 == sy % 2 ? 1 : 0);
		} else {
			tx = sx - (0 == sy % 2 ? 1 : 0);
		}
		switch (direction) {
		case -3: sy = sy - 1; sx = sx + 1; break;
		case -2: sy = sy - 1; break;
		case -1: sx = tx - 1; break;
		case  1: tx = sx + 1; break;
		case  2: ty = ty + 1; tx = tx + 1; break;
		case  3: ty = ty + 1; break;
		default: return;
		}
		if (direction < 0) direction = - direction;
		if (sx < 0 || sy < 0 || tx < 0 || tx >= this._level.width || ty >= this._level.height) return;
		if (' ' == this._level.lines[sy][sx] || ' ' == this._level.lines[ty][tx]) return;

		return { sx: sx, sy: sy, tx: tx, ty: ty, direction: direction };
	},
	fieldTuple: function(sx, sy, tx, ty) {
		if (!this._level) return;
		if (sx < 0 || sy < 0 || tx < 0 || tx >= this._level.width || ty >= this._level.height) return;
		if (' ' == this._level.lines[sy][sx] || ' ' == this._level.lines[ty][tx]) return;

		if (sy > ty || (sy == ty && sx > tx)) return this.fieldTuple(tx, ty, sx, sy);

		if (sy == ty) {
			if (sx + 1 == tx) return { sx: sx, sy: sy, tx: tx, ty: ty, direction: 1 };
		} else if (sy + 1 == ty) {
			if (1 == sy % 2) tx = tx - 1;
			if (sx == tx) return { sx: sx, sy: sy, tx: tx, ty: ty, direction: 2 };
			if (sx == tx + 1) return { sx: sx, sy: sy, tx: tx, ty: ty, direction: 3 };
		}
	},
	possibleFields: function(x, y) {
		if (!this._level) return [];
		if (x < 0 || y < 0 || x >= this._level.width || y >= this._level.height) return [];
		if (' ' == this._level.lines[y][x]) return [];

		var dirs = [-3, -2, -1, 1, 2, 3], i, fields = [], t, ox, oy, m = this._occupied[y][x], tags, j;
		if (m) { /* temporarily remove mark */
			this._usedcolors[m.tag] = false;
			this._occupied[m.sy][m.sx] = false;
			this._occupied[m.ty][m.tx] = false;
		}
		for (i = 0; i < dirs.length; i++) {
			t = this.fieldTupleDirected(x, y, dirs[i]);
			if (!t) continue;
			if (dirs[i] < 0) { ox = t.sx; oy = t.sy; } else { ox = t.tx; oy = t.ty; }
			if (this._occupied[oy][ox]) continue;
			t.tags = this.getPossibleTags(x, y, ox, oy);
			for (j = 0; j < t.tags.length; j++) {
				t.tag = t.tags[j];
				fields.push({x: ox, y: oy, mark: { sx: t.sx, sy: t.sy, tx: t.tx, ty: t.ty, direction: t.direction, tag: t.tags[j], tags: t.tags}});
			}
		}
		if (m) { /* restore mark */
			this._usedcolors[m.tag] = true;
			this._occupied[m.sy][m.sx] = m;
			this._occupied[m.ty][m.tx] = m;
		}
		return fields;
	},

	_clearMarks: function() {
		if (!this._level) return;

		this._occupied = [];
		for (j = 0; j < this._level.height; j++) {
			this._occupied[j] = [];
			for (i = 0; i < this._level.width; i++) {
				this._occupied[j][i] = (' ' == this._level.lines[j][i]) ? true : false;
			}
		}
		this._marks = [];
		this._usedcolors = { };

		var c = this._layers[1].getContext('2d');
		c.clearRect(0, 0, this._dim.width, this._dim.height);
	},
	
	mark: function(x, y, direction, tag) {
		if (!this._level) return;
		var m = this.fieldTupleDirected(x, y, direction);

		if (!m || this._occupied[m.sy][m.sx] || this._occupied[m.ty][m.tx]) return;

		if (!tag) tag = this.getTag(m.sx, m.sy, m.tx, m.ty);
		if (!tag) return;
		m.tag = tag;

		this._occupied[m.sy][m.sx] = m;
		this._occupied[m.ty][m.tx] = m;
		this._usedcolors[tag] = 1;

		this._marks.push(m);
		this._drawMark(m);
		this._saveStorage();
	},
	getMark: function(sx, sy, tx, ty) { /* optionally specify mandatory target */
		var m = this._occupied[sy][sx];
		if (true === m || !m) return false;
		if (m && typeof(ty) == 'number') {
			if ((m.sx == sx && m.sy == sy && m.tx == tx && m.ty == ty)
				|| (m.sx == tx && m.sy == ty && m.tx == sx && m.ty == sy)) return m;
			return false;
		}
		return m;
	},
	getColor: function (x, y) {
		var col = this._level.lines[y][x], m, col2;
		if (col != '?') return col;
		m = this._occupied[y][x];
		if (!m) return col;
		if (m.sx == x && m.sy == y) {
			col2 = this._level.lines[m.ty][m.tx];
		} else {
			col2 = this._level.lines[m.sy][m.sx];
		}
		if (m.tag[0] == col2) return m.tag[1];
		return m.tag[0];
	},
	unmark: function(x, y) {
		var m = this._occupied[y][x], i;
		if (true === m || !m) return false;

		for (i = 0; i < this._marks.length; i++) {
			if (m == this._marks[i]) {
				this._marks.splice(i, 1);
				this._occupied[m.sy][m.sx] = false;
				this._occupied[m.ty][m.tx] = false;
				this._usedcolors[m.tag] = false;
				this._renderMarks();
				break;
			}
		}
		this._saveStorage();
	},
	set marks(value) {
		var i, m;
		value = value || [];
		this._clearMarks();
		for (i = 0; i < value.length; i++) {
			m = value[i]; 
			this.mark(m.sx, m.sy, m.direction, m.tag);
		}
	},
	get marks() {
		return this._marks;
	},

	_clearHighlight: function() {
		var i, j;

		this._highlight_active = false;
		if (this._level) {
			this._highlight = [];
			for (j = 0; j < this._level.height; j++) {
				this._highlight[j] = [];
				for (i = 0; i < this._level.width; i++) {
					this._highlight[j][i] = false;
				}
			}
		}
	},
	highlight: function(fields) {
		var i;
		this._clearHighlight();

		if (this._level && fields && fields.length > 0) {
			this._highlight_active = true;

			for (i = 0; i < fields.length; i++) {
				this._highlight[fields[i].y][fields[i].x] = true;
			}
		}
		this._renderHighlight();
	},
	isHighlighted: function(x, y) {
		if (!this._level || x < 0 || y < 0 || x >= this._level.width || y >= this._level.height) return false;
		if (' ' == this._level.lines[y][x]) return false;
		return !this._highlight_active || this._highlight[y][x];
	},

	_drawPiece: function(i, j, pic, c) {
		if (!pic) return;
		c.drawImage(pic,
				((0 == j % 2 ? 0 : 0.5) + i) * this._grid.stepx + this._grid.offx,
				j * this._grid.stepy + this._grid.offy,
				this._grid.pieceWidth, this._grid.pieceHeight);
	},
	_drawMark: function (mark, c) {
		if (!this._theme || !this._theme.marks[mark.direction]) return;

		var w, h, offx = 0;
		switch (mark.direction) {
		case 1: w = 2 * this._grid.pieceWidth; h = this._grid.pieceHeight; break;
		case 2: w = 1.5 * this._grid.pieceWidth; h = 1.75 * this._grid.pieceHeight; break;
		case 3: w = 1.5 * this._grid.pieceWidth; h = 1.75 * this._grid.pieceHeight; offx = - 0.5; break;
		}

		c = c || this._layers[1].getContext('2d');
		c.drawImage(this._theme.marks[mark.direction],
				((0 == mark.sy % 2 ? 0 : 0.5) + mark.sx + offx) * this._grid.stepx + this._grid.offx,
				mark.sy * this._grid.stepy + this._grid.offy,
				w, h);

		if ('?' == this._level.lines[mark.sy][mark.sx]) {
			this._drawPiece(mark.sx, mark.sy, this._theme.pieces[this.getColor(mark.sx, mark.sy)], c);
		}
		if ('?' == this._level.lines[mark.ty][mark.tx]) {
			this._drawPiece(mark.tx, mark.ty, this._theme.pieces[this.getColor(mark.tx, mark.ty)], c);
		}
	},
	_loadThemeImage: function(ctx, src) {
		var i = new Image();
		i.onload = this._onLoadedThemeImage.bind(this, ctx);
		i.src = ctx.path + src;
		ctx.count++;
		return i;
	},
	_onLoadedThemeImage: function(ctx) {
		if (ctx.use) {
			ctx.count--;
			if (0 >= ctx.count) {
				this._theme = ctx.theme;
				this.refresh();
			}
		}
	},
	set theme(value) {
		value = value || 'default';
		if (value == this._themeName) return;

		this._themeName = value;

		var ctx = this._loading_theme_ctx = {
			count: 0, use: true, path: 'themes/' + this._themeName + '/'
		}
		ctx.theme = {
			pieces: {
				R: this._loadThemeImage(ctx, 'red.png'),
				G: this._loadThemeImage(ctx, 'green.png'),
				B: this._loadThemeImage(ctx, 'blue.png'),
				Y: this._loadThemeImage(ctx, 'yellow.png'),
				V: this._loadThemeImage(ctx, 'violet.png'),
				O: this._loadThemeImage(ctx, 'orange.png'),
				'?': this._loadThemeImage(ctx, 'joker.png'),
			},
			disable: this._loadThemeImage(ctx, 'disable.png'),
			marks: {
				1: this._loadThemeImage(ctx, 'double1.png'),
				2: this._loadThemeImage(ctx, 'double2.png'),
				3: this._loadThemeImage(ctx, 'double3.png'),
			},
			background: this._loadThemeImage(ctx, 'background.png'),
		};
	},
	get theme() {
		return this._themeName;
	},

	_loadStorage: function() {
		if (this.noStorage) return;
		this._loadingStorage = true;
		var data;
		try {
			data = window.localStorage && window.localStorage.getItem(this._levelid);
		} catch (e) { }
		var s = this._storage = (data && window.JSON.parse(data)) || { };
		s.marks = s.marks || [];
		if (s.marks) {
			for (var i = 0; i < s.marks.length; i++) {
				this.mark(s.marks[i][0], s.marks[i][1], s.marks[i][2], s.marks[i][3]);
			}
		}
		this._loadingStorage = false;
	},

	_saveStorage: function() {
		if (this.noStorage) return;
		if (this._loadingStorage) return;
		try {
			if (!window.localStorage) return;
		} catch (e) { return; }
		var l, m, i;
		if (!this.cheated && window.localStorage) {
			l = [];
			for (i = 0; i < this._marks.length; i++) {
				m = this._marks[i];
				l.push([m.sx, m.sy, m.direction, m.tag]);
			}
			this._storage.marks = l;
			try {
				window.localStorage.setItem(this._levelid, window.JSON.stringify(this._storage));
			} catch (e) { }
		}
	},
};
