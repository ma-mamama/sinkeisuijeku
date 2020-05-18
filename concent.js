(function() {
'use strict';

var NUMBER_STR = [null, 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
var SUITS = [['♣', 'black'], ['♦', 'red'], ['♥', 'red'], ['♠', 'black']];
var NUM_SUITS = SUITS.length;
var CARD_WIDTH = 100;
var CARD_HEIGHT = 140;
var CARD_COLOR = 'lightyellow'; //'white'; // カードの下地の色
var BACK_IMAGE = 'card.png'; // カードの裏側画像
var BORDER_COLOR = 'blue';
var BORDER_RADIUS = 9;
var BORDER_WIDTH = 1;
var SHADOW_WIDTH = 2;
var SHADOW_COLOR = 'rgb(64, 64, 128)';
var FONT_SIZE = 36; // カードの字の大きさ
var GRID_WIDTH = CARD_WIDTH + BORDER_WIDTH + SHADOW_WIDTH;
var GRID_HEIGHT = CARD_HEIGHT + BORDER_WIDTH + SHADOW_WIDTH;
var SHOW_ON_MISTAKES = 1000; // ミス時に開示する時間 (ミリ秒)
var colorSensitive; // 色を区別するかどうか
var numCols; // 横に並べる枚数
var maxNumber; // カードの最大番号
var numCards;
var numPairs;
var numRows;
var countUpTimer;
var turnUpTimer;
var numBackPairs;
var cards;
var firstCard; // 1枚目に開いたカードを覚える
var startTime;
var fieldElem;
var elapsedElem;
var settingForm;
var startButton;
var colorSensitiveCheck;
var numColsInput;
var maxNumberSelect;

// 配列のシャッフル (Fisher–Yates)
function shuffle(a) {
	var i = a.length;
	while (i > 1) {
		var j = Math.floor(Math.random() * i);
		var t = a[--i];
		a[i] = a[j];
		a[j] = t;
	}
}

function gridX(idx) { return idx % numCols; }

function gridY(idx) { return Math.floor(idx / numCols); }

function cancelEvent() {
	clearInterval(countUpTimer);
	countUpTimer = null;
	if (turnUpTimer) {
		clearTimeout(turnUpTimer);
		turnUpTimer = null;
	}
	cards.forEach(function(card) {
		card.element.removeEventListener('click', card.clickHandler);
	});
}

// カードを表すオブジェクト
var Card = function(idx, num, suit) {
	this.number = num;
	this.suit = suit;
	var elem = document.createElement('div');
	this.element = elem;
	var s = elem.style;
	s.width = CARD_WIDTH + 'px';
	s.height = CARD_HEIGHT + 'px';
	s.lineHeight = CARD_HEIGHT + 'px';
	s.backgroundColor = CARD_COLOR;
	s.backgroundSize = 'cover';
	s.border = BORDER_WIDTH + 'px solid ' + BORDER_COLOR;
	s.borderRadius = BORDER_RADIUS + 'px';
	s.boxShadow = SHADOW_WIDTH + 'px ' + SHADOW_WIDTH + 'px ' + SHADOW_COLOR;
	s.textAlign = 'center';
	s.fontSize = FONT_SIZE + 'px';
	s.color = SUITS[suit][1];
	s.position = 'absolute';
	this.faceDown();
	this.setPos(idx);
	this.clickHandler = this.onClick.bind(this);
	elem.addEventListener('click', this.clickHandler);
};
Card.prototype = {
	// 指定されたインデックスに該当する位置に配置
	setPos: function(idx) {
		this.element.style.left = (gridX(idx) * GRID_WIDTH) + 'px';
		this.element.style.top = (gridY(idx) * GRID_HEIGHT) + 'px';
	},

	// カードをめくる
	faceUp: function() {
		this.element.style.backgroundImage = 'none';
		this.element.textContent = SUITS[this.suit][0] + NUMBER_STR[this.number];
		this.face = true;
	},

	// カードを伏せる
	faceDown: function() {
		this.element.style.backgroundImage = 'url("' + BACK_IMAGE + '")';
		this.element.textContent = '';
		this.face = false;
	},

	// カードがクリックされたときの処理
	onClick: function(event) {
		if (turnUpTimer || this.face) {
			return; // もう開いた札か2枚開いた後なら何もしない
		}
		this.faceUp(); // カードをめくる

		// 1枚目のとき
		if (firstCard === null) {
			firstCard = this;
			return;
		}
		// 2枚目のとき
		if (this.number === firstCard.number &&
			(!colorSensitive
				|| SUITS[this.suit][1] === SUITS[firstCard.suit][1])) {
			// 当り
			firstCard = null;
			--numBackPairs;
			if (numBackPairs === 0) {
				cancelEvent();
				setTimeout(function() { alert('クリアしました'); }, 300);
			}
		} else {
			// はずれ
			turnUpTimer = setTimeout(function() {
				turnUpTimer = null;
				firstCard.faceDown();
				this.faceDown();
				firstCard = null;
			}.bind(this), SHOW_ON_MISTAKES); // this の bind が必要
		}
	}
};

// 周期的呼び出し関数 (プレイ中ずっと動いている)
function countUp() {
	elapsedElem.textContent = ((new Date().getTime() - startTime) / 1000).toFixed();
}

// ゲーム開始
function startGame() {
	if (countUpTimer)
		cancelEvent();

	colorSensitive = colorSensitiveCheck.checked;
	numCols = numColsInput.value;
	maxNumber = maxNumberSelect.value;

	if (isNaN(numCols) || numCols < 2 || numCols > 13) {
		alert('横配置数が不正または範囲外です');
		return;
	}

	numCards = NUM_SUITS * maxNumber;
	numPairs = numCards / 2;
	numRows = Math.ceil(numCards / numCols);

	cards = new Array(numCards);
	var indexes = new Array(numCards);
	for (var i = 0; i < numCards; i++) {
		indexes[i] = i;
	}
	shuffle(indexes); // ランダムに並び替え

	//for (var i = 0; i < numCards; i++) {
	//	var num = Math.floor(i / NUM_SUITS) + 1;
	//	cards[indexes[i]] = new Card(indexes[i], num, i % NUM_SUITS);
	//}
	indexes.forEach(function(idx, i) {
		var num = Math.floor(i / NUM_SUITS) + 1;
		cards[idx] = new Card(idx, num, i % NUM_SUITS);
	});
	fieldElem.style.width = (GRID_WIDTH * numCols) + 'px';
	fieldElem.style.height = (GRID_HEIGHT * numRows) + 'px';

	// 一つ前のゲームがある場合は削除
	while (fieldElem.firstChild)
		fieldElem.removeChild(fieldElem.firstChild);
	// カードの要素をボード要素に追加
	//for (var idx = 0; idx < numCards; idx++) {
	//	fieldElem.appendChild(cards[idx].element);
	//}
	cards.forEach(function(card) {
		fieldElem.appendChild(card.element);
	});

	numBackPairs = numPairs;
	firstCard = null;
	startTime = new Date().getTime();
	countUpTimer = setInterval(countUp, 970);
}

// 初期化関数
function init() {
	fieldElem = document.getElementById('field');
	fieldElem.style.position = 'relative';
	elapsedElem = document.getElementById('elapsed');
	settingForm = document.forms.settingForm;
	startButton = settingForm.startButton;
	startButton.addEventListener('click', startGame);
	colorSensitiveCheck = settingForm.colorSensitiveCheck;
	numColsInput = settingForm.numColsInput;
	maxNumberSelect = settingForm.maxNumberSelect;
}

// 読み込み時に実行
var readyState = document.readyState;
if (readyState !== 'interactive' && readyState !== 'complete')
	document.addEventListener('DOMContentLoaded', init);
else
	setTimeout(init);

}());
