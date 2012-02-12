var hm = hm || {};

enyo.kind({
	name: "hm.Field",
	kind: enyo.Control,
	
	components: [
		{name: "container", kind: enyo.Control, components: [
			{name: "pieces",kind: enyo.Control,nodeTag:"canvas"},
			{name: "marks",kind: enyo.Control,nodeTag:"canvas"},
			{name: "highlight",kind: enyo.Control,nodeTag:"canvas"},
		]},
	],
	
	published: {
		level: null,
		theme: "default",
	},

	create: function() {
		this.addClass("hmField");
		this.inherited(arguments);
		this.$.container.addClass("hmContainer");
		this.$.pieces.addClass("hmCanvas");
		this.$.marks.addClass("hmCanvas");
		this.$.highlight.addClass("hmCanvas");
	},
	themeChanged: function() {
		if (this._board) {
			this._board.theme = this.theme;
			this.theme = this._board.theme;
		}
	},
	levelChanged: function() {
		if (this._board) {
			this._board.level = this.level;
			this.level = this._board.level;
		}
	},

	rendered: function() {
		var i;
		this.inherited(arguments);
		if (this._board) return;
		if (!this.hasNode() || !this.$.container.hasNode()) return;
		var layers = [this.$.pieces, this.$.marks, this.$.highlight];
		for (i = 0; i < layers.length; i++) {
			if (!layers[i].hasNode()) return;
			layers[i] = layers[i].node;
		}
		this._board = new hm.Board(layers);
		this._board.resize(this.node.clientWidth, this.node.clientHeight);
		this._boardcontrol = new hm.BoardControl(this._board, this.$.container.node);
		this.levelChanged();
		this.themeChanged();
	},
	resizeHandler: function() {
		this.inherited(arguments);
		if (this._board) this._board.resize(this.node.clientWidth, this.node.clientHeight);
	},
	
	solve: function() {
		if (!this._board) return;

		this._board.cheated = true;
		var solution = hm.solve(this._board.level);
		if (solution) {
			this._board.marks = solution.solution;
		} else {
			enyo.log("no solution found");
		}
	},
	reset: function() {
		if (!this._board) return;
		this._board.marks = [];
	}
});

enyo.kind({
	name: "SelectMenuGroup",
	kind: enyo.Control,
	published: {
		caption: "",
		open: false,
	},
	chrome: [
		{name:"item",kind:enyo.Button,onclick:"selectPane"},
		{name:"body",kind:enyo.VFlexBox,components: [
			{name:"client",kind:enyo.HFlexBox},
			{name:"content",kind:enyo.Pane,layoutKind:"",transitionKind: "enyo.transitions.Simple"}
		]}
	],
	create: function() {
		this.inherited(arguments);
		this.$.body.isChrome = false;
		this.captionChanged();
		this._updateBodyContainer();
	},
	_select: function(element) {
		if (this._selected) {
			this._selected.setOpen(false);
		}
		this._selected = element;
		if (this._selected) {
			this._selected.setOpen(true);
		}
	},
	select: function(element) {
		this._select(element);
		this.selectPane();
	},
	selectPane: function() {
		var c = this.menuContainer();
		if (c) {
			c.select(this);
		}
	},
	adjustComponentProps: function(inProps) {
		if (!inProps.kind) {
			if (inProps.components && inProps.components.length > 0) {
				inProps.kind = "SelectMenuGroup";
			} else {
				inProps.kind = enyo.Button;
			}
		}
		this.inherited(arguments);
	},
	menuContainer: function() {
		var node = this.container;
		while (node && !node.getContentPane) {
			node = node.container;
		}
		return node;
	},
	upperPane: function() {
		var node = this.menuContainer();
		if (node) return node.getContentPane();
	},
	_updateBodyContainer: function() {
		if (this.$.body) {
			var c = this.upperPane();
			if (c) {
				var first = (0 == c.getControls().length)
				this.$.body.setContainer(c);
				this.$.body.setParent(c);
				if (first) this.selectPane();
			} else {
				this.$.body.setContainer(null);
				this.$.body.setParent(null);
			}
			this.flow();
		}
	},
	containerChanged: function() {
		this.inherited(arguments);
		this._updateBodyContainer();
	},
	captionChanged: function() {
		this.$.item.setContent(this.caption);
	},
	openChanged: function() {
		if (this.open) {
			this.upperPane().selectView(this.$.body);
		}
		this.$.item.setDepressed(this.open);
	},
	rendered: function() {
		this.inherited(arguments);
	},
	getContentPane: function() {
		return this.$.content;
	},
});

enyo.kind({
	name: "SelectMenu",
	kind: enyo.Popup,
	events: {
		onSelect: "",
	},
	chrome: [
		{kind:enyo.VFlexBox,components: [
			{name:"client",kind:enyo.HFlexBox},
			{name:"content",kind:enyo.Pane,layoutKind:"",transitionKind: "enyo.transitions.Simple"}
		]}
	],
	componentsReady: function() {
		this.inherited(arguments);
		this.flow();
	},
	select: function(element) {
		if (this._selected) {
			this._selected.setOpen(false);
		}
		this._selected = element;
		if (this._selected) {
			this._selected.setOpen(true);
		}
	},
	_selectItem: function(inSender) {
		if (this._selectedItem) {
			this._selectedItem.setDepressed(false);
		}
		this._selectedItem = inSender;
		if (this._selectedItem) {
			this._selectedItem.setDepressed(true);
		}
	},
	selectItem: function(inSender) {
		this._selectItem(inSender);
		this.close();
		this.doSelect(this._selectedItem)
	},
	captureDomEvent: function(inEvent) {
		if (inEvent.type != "click") return;

		var node = inEvent.dispatchTarget;
		while (node && node != this) {
			if (node.hasOwnProperty('value')) {
				this.selectItem(node);
				break;
			}
			node = node.container;
		}
	},
	_selectValue: function(node, value) {
		if (node.hasOwnProperty('value')) {
			if (value === node.value) {
				this._selectItem(node);
				while (node) {
					if (node.selectPane) {
						node.selectPane();
						break;
					}
					node = node.container;
				}
				return true;
			}
			return false;
		}
		for (var i=0, cs=node.controls, c; c=cs[i]; i++) {
			if (!c.isChrome) {
				if (this._selectValue(c, value)) return true;
			}
		}
		return false;
	},
	selectValue: function(value) {
		this._selectValue(this, value);
	},
	adjustComponentProps: function(inProps) {
		inProps.kind = inProps.kind || (inProps.components && inProps.components.length > 0 ? "SelectMenuGroup" : enyo.Button);
		this.inherited(arguments);
	},
	published: {
		value: undefined,
	},
	getContentPane: function() {
		return this.$.content;
	},
});


function levelSelectorItems() {
	function group(items) {
		//if (items.length <= 10) return items;
		var r = [];
		while (items.length > 0) {
			r.push({kind:enyo.HFlexBox,components: items.splice(0, 10)});
		}
		return [{kind:enyo.VFlexBox,components:r}];
	}

	function build(g) {
		var i, r = [];
		for (i = 0; i < g.list.length; ++i) {
			r.push({caption: g.list[i].title, kind: SelectMenuGroup, components: build(g.list[i])});
		}
		if (g.levels) for (i = 0; i < g.levels.length; ++i) {
			var ndx = g.levels[i];
			r.push({caption: levels[ndx].short, value: ndx, kind: enyo.Button,onclick: "selectItem" });
		}
		return group(r);
	}

	return build(levelGroups);
}

enyo.kind({
	name: "hexagon_match",
	kind: enyo.VFlexBox,
	components: [
		{kind: enyo.PageHeader, components: [
			{content: "Hexagon Match"},
			{flex:1},
			{name:"levelTitle",content: ""},
			{flex:1},
			{name:"themeSelector",kind: enyo.ListSelector,label:"Theme",value:"default",items: ["default"],onChange:"_selectedTheme",showing: false},
			{name:"levelSelector",kind: enyo.Button,caption:"Change Level",onclick:"selectLevel"},
			{kind: enyo.Button,caption: "Reset",onclick:"reset"},
			{name:"solve",kind: enyo.Button,caption: "Solve",onclick:"solve",showing: false},
		]},
		{name: "board",kind: enyo.Control, layoutKind: enyo.VFlexLayout, flex:1, components: [
			{name: "field",kind: hm.Field, flex: 1 }
		]},
		{name:"levelMenu",kind: SelectMenu,components: levelSelectorItems(),onSelect: "_selectedLevel"},
	],
	create: function() {
		this.inherited(arguments);
		this.$.board.addClass("board");
		this.setLevel(0);
		if (enyo.args.cheat) this.$.solve.show();
	},
	selectLevel: function(inSender, inValue, inOldValue) {
		if (this.$.levelMenu.canOpen()) {
			this.$.levelMenu.openAroundControl(inSender, false, "right");
			this.$.levelMenu.selectValue(this._levelNo);
		} else {
			this.$.levelMenu.close();
		}
	},
	_selectedLevel: function(inSender, inItem) {
		this.setLevel(inItem.value);
	},
	setLevel: function(level) {
		if (typeof(level) == 'number') {
			this._levelNo = level;
			level = levels[level];
		}
		this.$.levelTitle.setContent(level.title);
		this.$.field.setLevel(level);
	},
	_selectedTheme: function(inSender, inValue, inOldValue) {
		this.$.field.setTheme(inValue);
	},
	setTheme: function(theme) {
		this.$.themeSelector.setValue(theme);
		this.$.field.setTheme(theme);
	},
	solve: function() {
		this.$.field.solve();
	},
	reset: function() {
		this.$.field.reset();
	}
});
