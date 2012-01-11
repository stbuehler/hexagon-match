var hm = hm || {};

hm.BoardControl = (function() {
	function BoardControl(board, node) {
		this._board = board;
		this._node = node;
		this._te = false;
		this._t = {};
		this._clicked = false;

		this._hasTouchEvents = isEventSupported("touchstart");
		if (this._hasTouchEvents) {
			this._listenTo([ "touchstart", "touchend", "touchmove", "touchcancel" ]);
		} else {
			this._listenTo([ "mousedown", "mousemove", "mouseup"]);
		}
		if (enyo && enyo.log) enyo.log("touch event support: " + this._hasTouchEvents);
	};

	var TYPES = {
		UNKOWN: 0,
		FIELD: 1,
	};
	var DRAG_THRESHOLD = 5*5;

	function hmbc_round(d) {
		return Math.floor(100*d) / 100;
	}

	function abspos(node) {
		var p = { x: node.offsetLeft, y: node.offsetTop };
		while (node.offsetParent) {
			node = node.offsetParent;
			p.x += node.offsetLeft;
			p.y += node.offsetTop;
		}
		return p;
	}

	BoardControl.prototype = {
		_listenTo: function(events) {
			for (var i = 0; i < events.length; i++) {
				this._node.addEventListener(events[i], this["on_"+events[i]].bind(this));
			}
		},
		_offsetPos: function(e) {
			var p = abspos(this._node);
			return { x: e.pageX - p.x, y: e.pageY - p.y};
		},
		getField: function(e) {
			var p = this._offsetPos(e);
			return this._board.getField(p.x, p.y);
		},

		/* poor touch emulation */
		on_mousedown: function (e) {
			//enyo.log("mousedown: " + hmbc_round(e.clientX) + "/" + hmbc_round(e.clientY));

			this._te = { target: 0 }; //e.target };
			var t = { identifier: 0, target: this._te.target, screenX: e.screenX, screenY: e.screenY, clientX: e.clientX, clientY: e.clientY, pageX: e.pageX, pageY: e.pageY };
			return this.on_touchstart({ touches: [t], targetTouches: [t], changedTouches: [t], altKey: e.altKey, metaKey: e.metaKey, ctrlKey: e.ctrlKey, shiftKey: e.shiftKey });
		},
		on_mousemove: function (e) {
			if (this._te) {
				//enyo.log("mousemove: " + hmbc_round(e.clientX) + "/" + hmbc_round(e.clientY));

				var t = { identifier: 0, target: this._te.target, screenX: e.screenX, screenY: e.screenY, clientX: e.clientX, clientY: e.clientY, pageX: e.pageX, pageY: e.pageY };
				return this.on_touchmove({ touches: [t], targetTouches: [t], changedTouches: [t], altKey: e.altKey, metaKey: e.metaKey, ctrlKey: e.ctrlKey, shiftKey: e.shiftKey });
			}
		},
		on_mouseup: function (e) {
			//enyo.log("mouseup: " + hmbc_round(e.clientX) + "/" + hmbc_round(e.clientY));

			if (this._te) {
				var t = { identifier: 0, target: this._te.target, screenX: e.screenX, screenY: e.screenY, clientX: e.clientX, clientY: e.clientY, pageX: e.pageX, pageY: e.pageY };
				this._te = false;
				return this.on_touchend({ touches: [], targetTouches: [], changedTouches: [t], altKey: e.altKey, metaKey: e.metaKey, ctrlKey: e.ctrlKey, shiftKey: e.shiftKey });
			}
		},

		/* touch handling */
		on_touchstart: function (event) {
			var i, e, t;
			for (i = 0; i < event.changedTouches.length; i++) {
				e = event.changedTouches[i];
				//enyo.log("touchstart: " + hmbc_round(e.clientX) + "/" + hmbc_round(e.clientY));

				var pos = this.getField(e);
				if (!pos) {
					this._t[e.identifier] = { type: TYPES.UKNOWN };
				} else {
					this._t[e.identifier] = t = { type: TYPES.FIELD, start: pos, current: null, dragStart: e, wasClicked: false, drag: false, mark: this._board.getMark(pos.x, pos.y) };

					if (this._clicked && this._clicked.field) {
						/* test whether pos is in reach of old click */
						if (pos.x == this._clicked.field.x && pos.y == this._clicked.field.y) {
							t.drag = true;
						} else if (m = this._clicked.mark) {
							if ((pos.x == m.sx && pos.y == m.sy) || (pos.x == m.tx && pos.y == m.ty)) {
								t.drag = true;
							}
						} else if (m = this._clicked.field) {
							fields = this._board.possibleFields(m.x, m.y)
							for (j = 0; j < fields.length; j++) {
								if (fields[j].x == pos.x && fields[j].y == pos.y) {
									t.drag = true;
									break;
								}
							}
						}
						if (t.drag) {
							t.start = this._clicked.field;
							t.dragStart = this._clicked.event;
							t.mark = this._clicked.mark;
							t.wasClicked = true;
							this._clicked = false;
						}
					}
				}
			}
			this.on_touchmove(event, true);
			return true;
		},
		on_touchend: function (event) {
			var i, e;
			for (i = 0; i < event.changedTouches.length; i++) {
				e = event.changedTouches[i];
				//enyo.log("touchend: " + hmbc_round(e.clientX) + "/" + hmbc_round(e.clientY));

				t = this._t[e.identifier];
				if (!t) continue;

				if (!t.drag) {
					this.handleClick(e);
				}

				delete this._t[e.identifier];
			}
			this.updateHighlight();
			return true;
		},
		on_touchmove: function (event, changed) {
			var i, e, t, pos, tuple, m, j, fields;
			for (i = 0; i < event.changedTouches.length; i++) {
				e = event.changedTouches[i];
				//enyo.log("touchmove: " + hmbc_round(e.clientX) + "/" + hmbc_round(e.clientY));

				t = this._t[e.identifier];
				if (!t) continue;

				if (!t.drag && t.dragStart) {
					var dx = e.clientX - t.dragStart.clientX, dy = e.clientY - t.dragStart.clientY;
					t.drag = (dx*dx + dy*dy > DRAG_THRESHOLD);
					if (t.drag) {
						//enyo.log("touchmove: now a drag operation");
					}
				}

				if (t.drag) {
					pos = this.getField(e);
					if ((!t.current && pos) || (t.current && !pos) || t.current.x != pos.x || t.current.y != pos.y) {
						changed = true;
						t.current = pos;
						//enyo.log("new drag status: ", t);
						if (t.mark) {
							if (t.wasClicked && t.start.x == pos.x && t.start.y == pos.y) {
								this._board.unmark(t.start.x, t.start.y);
							} else {
								tuple = pos && this._board.fieldTuple(t.start.x, t.start.y, pos.x, pos.y);
								if (tuple && tuple.sx == t.mark.sx && tuple.sy == t.mark.sy && tuple.direction == t.mark.direction) {
									this._board.unmark(t.start.x, t.start.y);
								} else {
									this._board.mark(t.mark.sx, t.mark.sy, t.mark.direction);
								}
							}
						} else {
							this._board.unmark(t.start.x, t.start.y);
							if (t.wasClicked && t.start.x == pos.x && t.start.y == pos.y) {
								tuple = this._board.possibleFields(pos.x, pos.y);
								if (1 == tuple.length) this._board.mark(tuple[0].mark.sx, tuple[0].mark.sy, tuple[0].mark.direction);
							} else {
								tuple = pos && this._board.fieldTuple(t.start.x, t.start.y, pos.x, pos.y);
								if (tuple) {
									this._board.mark(tuple.sx, tuple.sy, tuple.direction);
								}
							}
						}
					}
				}
			}
			if (changed) {
				this.updateHighlight();
			}
			return true;
		},
		on_touchcancel: function (event) {
			var i, e;
			for (i = 0; i < event.changedTouches.length; i++) {
				e = event.changedTouches[i];

				t = this._t[e.identifier];
				if (!t) continue;

				delete this._t[e.identifier];
			}
			this.updateHighlight();
			return true;
		},

		updateHighlight: function() {
			var fields = [], m, id, t;
			if (this._clicked) {
				if (m = this._clicked.mark) {
					fields.push({x:m.sx, y:m.sy, del: true}, {x:m.tx, y:m.ty, del: true});
				} else if (m = this._clicked.field) {
					fields.push.apply(fields, this._board.possibleFields(m.x, m.y));
					fields.push({x:m.x, y:m.y, source: true});
				}
			}
			for (id in this._t) {
				t = this._t[id];
				if (t.type == TYPES.FIELD) {
					if (m = t.mark) {
						/* TODO: only mark "del" on other field */
						fields.push({x:m.sx, y:m.sy, del: true}, {x:m.tx, y:m.ty, del: true});
					} else {
						m = t.start;
						fields.push.apply(fields, this._board.possibleFields(m.x, m.y));
						fields.push({x:m.x, y:m.y, source: true});
					}
				}
			}
			this._board.highlight(fields);
		},

		handleClick: function (e) {
			var pos = this.getField(e);
			if (pos) m = this._board.getMark(pos.x, pos.y);
			if (this._clicked) {
				/* second "click" is handled through drag code (with t.wasClicked: true) */
				this._clicked = false;
			} else {
				if (pos && (m || this._board.possibleFields(pos.x, pos.y).length > 0)) {
					this._clicked = { event: e, field: pos, mark: m };
				}
			}
			this.updateHighlight();
		},
	};

	return BoardControl;
})();
