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

function levelSelectorItems() {
	var items = [], i, setitems = [], curset, set;
	for (i = 0; i < levels.length; i++) {
		set = levels[i].set;
		if (set !== curset) {
			if (setitems.length > 0) {
				items.push({caption: curset, components: setitems });
			}
			setitems = [];
			curset = set;
		}
		setitems.push({caption: levels[i].title, value: i,onclick:"_selectedLevel" });
	}
	if (setitems.length > 0) {
		items.push({caption: curset || 'Undefined', components: setitems });
	}
	enyo.log("levels: %j", items);
	return items;
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
		{name:"levelMenu",kind: enyo.Menu,components: levelSelectorItems()},
	],
	create: function() {
		this.inherited(arguments);
		this.$.board.addClass("board");
		this.setLevel(0);
		if (enyo.args.cheat) this.$.solve.show();
	},
	selectLevel: function(inSender, inValue, inOldValue) {
		this.$.levelMenu.openAroundControl(inSender, false, "right");
	},
	_selectedLevel: function(inSender, inValue, inOldValue) {
		this.setLevel(inSender.value);
	},
	setLevel: function(level) {
		if (typeof(level) == 'number') {
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
