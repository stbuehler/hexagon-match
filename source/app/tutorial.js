enyo.kind({
	name: "hm.ReadonlyField",
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
		solution: false,
		marks: [],
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
			this.marksChanged();
			this.solutionChanged();
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
		this._board = new hm.Board(layers, null, true);
		this._board.resize(this.node.clientWidth, this.node.clientHeight);
		this.levelChanged();
		this.themeChanged();
	},
	resizeHandler: function() {
		this.inherited(arguments);
		if (this._board) this._board.resize(this.node.clientWidth, this.node.clientHeight);
	},
	solutionChanged: function() {
		if (!this.solution) return;
		if (!this._board) return;

		var solution = hm.solve(this._board.level);
		if (solution) {
			this.setMarks(solution.solution);
		} else {
			enyo.log("no solution found");
		}
		
	},
	marksChanged: function() {
		if (!this._board) return;
		this._board.marks = this.marks;
	},
	reset: function() {
		this.setMarks([]);
	}
});


hm.tutorialLevel = {
	title: "Tutorial",
	width: 5,
	height: 3,
	colors: "BGR",
	lines: [[" RGR ","RBGBG"," RBGB"]]
}

enyo.kind({
	name: "hm.Tutorial",
	kind: enyo.Popup,

	components: [
		{}
	]
});
