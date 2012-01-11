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
	var items = [], i;
	for (i = 0; i < levels.length; i++) {
		items.push({caption: levels[i].title, value: i });
	}
	return items;
}

enyo.kind({
	name: "hexagon_match",
	kind: enyo.VFlexBox,
	components: [
		{kind: enyo.PageHeader, components: [
			{content: "Hexagon Match",flex:1},
			{name:"themeSelector",kind: enyo.ListSelector,label:"Theme",value:"default",items: ["default"],onChange:"_selectedTheme",showing: false},
			{name:"levelSelector",kind: enyo.ListSelector,label:"Level",value:0,items: levelSelectorItems(),onChange:"_selectedLevel"},
			{kind: enyo.Button,caption: "Reset",onclick:"reset"},
			{name:"solve",kind: enyo.Button,caption: "Solve",onclick:"solve",showing: false},
		]},
		{name: "board",kind: enyo.Control, layoutKind: enyo.VFlexLayout, flex:1, components: [
			{name: "field",kind: hm.Field, level: levels[0], flex: 1 }
		]}
	],
	create: function() {
		this.inherited(arguments);
		this.$.board.addClass("board");
		if (enyo.args.cheat) this.$.solve.show();
	},
	_selectedLevel: function(inSender, inValue, inOldValue) {
		this.$.field.setLevel(levels[inValue]);
	},
	setLevel: function(level) {
		if (typeof(level) == 'number') {
			this.$.levelSelector.setValue(level);
			this.$.field.setLevel(levels[level]);
		} else {
			this.$.field.setLevel(level);
		}
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
