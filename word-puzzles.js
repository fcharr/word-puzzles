var canvas;
var context;
var gameLoopTimer;
var selectedBoxIndex = -1;

var fontSize = 25;
var tol = 15;
 
var phrase = "";

var letters = [];
var substrings = [];
var boxes = [];
var reverseLookups = [];
var zOrder = [];

function reverseLookup(boxIndex, zIndex)
{
	this.boxIndex = boxIndex;
	this.zIndex = zIndex;
}

function xy(x, y) 
{
	this.x = x;
	this.y = y;
	
	return(this);
}

function link(previous, next)
{
	this.previous = previous;
	this.next = next;
	
	return(this);
}

function substringOccurences(substring, occurences)
{
	this.occurences = occurences;
	this.substring = substring;
	this.phrasePositions = [];
	this.boxIndices = [];
}

function substringOccured(substring)
{
	for(var i = 0; i < substrings.length; i++)
	{
		if(substrings[i].substring == substring)
		{
			return(true);
		}
	}
	
	return(false);
}

function phrasePosition(wordIndex)
{
	this.wordIndex = wordIndex;
	this.letterIndices = [];
	
	return(this);
}

function box(letter, x, y)
{
	this.letter = letter;
	
	this.links = [];
	
	this.previousBox = -1;
	this.nextBox = -1;
	
	this.previousBoxes = [];
	this.nextBoxes = [];
	
	this.x = x;
	this.y = y;
	
	this.phrasePositions = [];
	
	return(this);
}

function boxBounds()
{
	var bounds = new xy(fontSize * 1.5, fontSize * 1.5);
	
	return(bounds);
}

var boxSize = boxBounds();

function startGameLoop () {
	if(gameLoopTimer == null) {
		gameLoopTimer = setInterval(gameLoop, 1000 / 60);
	}
}

function clearArray(array)
{
	while(array.length > 0)
	{
		array.pop();
	}
}

function stopGameLoop () {
	clearTimeout(gameLoopTimer);
	gameLoopTimer = null;
}

function onLoad()
{
	canvas = document.getElementById("canvas");
	context = canvas.getContext("2d");
	context.textAlign = "center";
	
	canvas.addEventListener('mousemove', mouseEvents);
	canvas.addEventListener('mousedown', mouseEvents);
	canvas.addEventListener('mouseup', mouseEvents);
	canvas.addEventListener('click', mouseEvents);
	
	initializePuzzle("WORD LETTER SENTENCE");
	
	startGameLoop();
}

function initializePuzzle(newPhrase)
{
	clearArray(letters);
	clearArray(substrings);
	clearArray(boxes);
	clearArray(reverseLookups);
	clearArray(zOrder);
	
	phrase = newPhrase;
	
	var _newWord = true;
	for(var i = 0; i < phrase.length; i++)
	{
		if(phrase.charAt(i) != " ")
		{
			if(_newWord)
			{
				letters.push([]);
				_newWord = false;
			}
			
			letters[letters.length - 1].push(phrase.charAt(i));
		}
		else
		{
			_newWord = true;
		}
	}
	
	console.log(letters);
	
	var _substring, _occurences;
	
	for(var i = 0; i < phrase.length; i++)
	{
		for(var j = i + 1; j < phrase.length - (j - i) && phrase.charAt(i) != " " && phrase.charAt(i + 1) != " " && phrase.charAt(j) != " "; j++)
		{
			//console.log(i + " " + j + " " + phrase.charAt(j) + "[" + phrase.substring(i, j + 1) + "]");
			_substring =  phrase.substring(i, j + 1);
			_occurences = (phrase.match(new RegExp(_substring, "gi")) || []).length;
			
			if(_occurences > 1 && !substringOccured(_substring))
			{
				substrings.push(new substringOccurences(_substring, _occurences));
			}
		}
	}
	
	var _match = true;
	
	for(var i = 0; i < substrings.length; i++)
	{
		for(var ii = 0; ii < letters.length; ii++)
		{
			for(var jj = 0; jj < letters[ii].length; jj++)
			{
				if(substrings[i].substring.charAt(0) == letters[ii][jj])
				{
					_match = true;
					
					for(var j = 0; j < substrings[i].substring.length && j + jj < letters[ii].length; j++)
					{
						if(substrings[i].substring.charAt(j) != letters[ii][j + jj])
						{
							_match = false;
							break;
						}
					}
					
					if(_match && j == substrings[i].substring.length)
					{
						
						var newMatch = true;
						for(var l = 0; l < substrings[i].phrasePositions.length; l++)
						{
							if(substrings[i].phrasePositions[l].wordIndex == ii)
							{
								substrings[i].phrasePositions[l].letterIndices.push(jj);
								newMatch = false;
							}
						}
						
						if(newMatch)
						{
							substrings[i].phrasePositions.push(new phrasePosition(ii));
							substrings[i].phrasePositions[substrings[i].phrasePositions.length - 1].letterIndices.push(jj);
						}
						
					}
				}
			}
		}
	}
	
	console.log(substrings);
	
	var _previousBox, _nextBox;
	
	for(var i = 0; i < letters.length; i++)
	{
		//Populate the boxes.
		for(var j = 0; j < letters[i].length; j++)
		{
			zOrder.push(boxes.length);
			reverseLookups.push(new reverseLookup(boxes.length, boxes.length));
			boxes.push(new box(letters[i][j], 
                               fontSize + Math.random() * (canvas.width - fontSize * 2) , 
                               fontSize + Math.random() * (canvas.height - fontSize * 2)));
            
			//boxes.push(new box(letters[i][j], j * 50 + 50, i * 50 + 50));
			
			_previousBox = boxes.length - 2;
			
			if(j > 0)
			{
				boxes[boxes.length - 1].previousBoxes.push(boxes.length - 2);
			}
			
			if(j < letters[i].length - 1)
			{
				boxes[boxes.length - 1].nextBoxes.push(boxes.length);
				_nextBox = boxes.length;
			} 
			else
			{
				_nextBox = -1;
			}
			
			boxes[boxes.length - 1].links.push(new link(_previousBox, _nextBox));
		}
	}
	
	//Link the boxes.
	for(var i = 0; i < boxes.length; i++)
	{
		for(var j = 0; j < boxes.length; j++)
		{
			if(i != j && boxes[i].letter == boxes[j].letter)
			{
				if(boxes[i].previousBoxes.length > 0 && boxes[j].previousBoxes.lastIndexOf(boxes[i].previousBoxes[0]) == - 1)
				{
					boxes[j].previousBoxes.push(boxes[i].previousBoxes[0]);
					_previousBox = boxes[i].previousBoxes[0];
				}
				else
				{
					_previousBox = -1;
				}
				
				if(boxes[i].nextBoxes.length > 0 && boxes[j].nextBoxes.lastIndexOf(boxes[i].nextBoxes[0]) == -1)
				{
					boxes[j].nextBoxes.push(boxes[i].nextBoxes[0]);
					_nextBox = boxes[i].nextBoxes[0];
				}
				else
				{
					_nextBox = -1;
				}
				
				if((_previousBox != -1 || _nextBox) != -1 && (_previousBox != j && _nextBox != j))
				{
					boxes[j].links.push(new link(_previousBox, _nextBox));
				}
			}
		}
	}
	
	//Handle consecutive switchable letters.
	for(var i = 1; i < boxes.length; i++)
	{
		if(boxes[i].letter == boxes[i - 1].letter)
		{
			boxes[i].links.push(new link(boxes[i - 1].links[0].previous, i - 1));
			boxes[i - 1].links.push(new link(i, boxes[i].links[0].next));
		}
	}
	
	//Scan for switchable letters.
	for(var i = 0; i < boxes.length; i++)
	{
		for(var j = 0; j < boxes.length; j++)
		{
			if(i != j)
			{
				for(var k = 0; k < boxes[i].previousBoxes.length; k++)
				{
					if(boxes[j].letter == boxes[boxes[i].previousBoxes[k]].letter && boxes[i].previousBoxes.lastIndexOf(j) == -1)
					{
						boxes[i].previousBoxes.push(j);
					}
				}
				
				for(var k = 0; k < boxes[i].nextBoxes.length; k++)
				{
					if(boxes[j].letter == boxes[boxes[i].nextBoxes[k]].letter && boxes[i].nextBoxes.lastIndexOf(j) == -1)
					{
						boxes[i].nextBoxes.push(j);
					}
				}
			}
		}
	}
	
	for(var i = 0; i < boxes.length; i++)
	{
		for(var j = 0; j < boxes.length; j++)
		{
			var _links = [];
			if(i != j)
			{
				for(var k = 0; k < boxes[i].links.length; k++)
				{
					if(boxes[i].links[k].previous != -1 && boxes[j].letter == boxes[boxes[i].links[k].previous].letter && boxes[i].previousBoxes.lastIndexOf(j) == -1)
					{
						_links.push(new link(j, boxes[i].links[k].next));
					}
					
					if(boxes[i].links[k].next != -1 && boxes[j].letter == boxes[boxes[i].links[k].next].letter && boxes[i].nextBoxes.lastIndexOf(j) == -1)
					{
						_links.push(new link(boxes[i].links[k].previous, j));
					}
					
					if(_links.length > 0)
					{
						break;
					}
				}
				
				boxes[i].links = boxes[i].links.concat(_links);
			}
		}
	}
	
	var newMatch;
	for(var i = 0; i < letters.length; i++)
	{
		for(var j = 0; j < letters[i].length; j++)
		{
			for(var k = 0; k < boxes.length; k++)
			{
				if(letters[i][j] == boxes[k].letter)
				{
					newMatch = true;
					for(var l = 0; l < boxes[k].phrasePositions.length; l++)
					{
						if(boxes[k].phrasePositions[l].wordIndex == i)
						{
							boxes[k].phrasePositions[l].letterIndices.push(j);
							newMatch = false;
						}
					}
					
					if(newMatch)
					{
						boxes[k].phrasePositions.push(new phrasePosition(i));
						boxes[k].phrasePositions[boxes[k].phrasePositions.length - 1].letterIndices.push(j);
					}
				}
			}
		}
	}
}

function mouseEvents(event)
{
	var x = event.x - context.canvas.offsetLeft + window.scrollX;
	var y = event.y - context.canvas.offsetTop + window.scrollY;
	
	if(event.type == "mousedown") 
	{	
		for(var i = zOrder.length - 1; i >= 0; i--)
		{
			if(x > boxes[zOrder[i]].x - boxSize.x / 2 && x < boxes[zOrder[i]].x + boxSize.x / 2 &&
			   y > boxes[zOrder[i]].y - boxSize.y / 2 && y < boxes[zOrder[i]].y + boxSize.y / 2) 
			{
				
				selectedBoxIndex = zOrder[i];
				
				liftBox(i);
				
				var _previousBoxIndex = boxes[selectedBoxIndex].previousBox;
				while(_previousBoxIndex != -1)
				{
					console.log("p " + _previousBoxIndex);
					liftBox(reverseLookups[_previousBoxIndex].zIndex);
					_previousBoxIndex = boxes[_previousBoxIndex].previousBox;
				}
				
				var _nextBoxIndex = boxes[selectedBoxIndex].nextBox;
				while(_nextBoxIndex != -1)
				{
					console.log("n " + _nextBoxIndex);
					liftBox(reverseLookups[_nextBoxIndex].zIndex);
					_nextBoxIndex = boxes[_nextBoxIndex].nextBox;
				}
				
				debugBox(selectedBoxIndex);
			
				break;
			}
		}
	}
	
	if(event.type == "mousemove")
	{
		if(selectedBoxIndex != -1) 
		{
			boxes[selectedBoxIndex].x = x;
			boxes[selectedBoxIndex].y = y;
			
			orderLetters();
		}
	}
	
	if(event.type == "mouseup") 
	{
		if(selectedBoxIndex != -1)
		{
			//i = selectedBoxIndex;
			for(var i = 0; i < boxes.length; i++)
			{
				for(var j = 0; j < boxes[i].previousBoxes.length; j++)
				{
					if(Math.abs((boxes[i].x - boxSize.x / 2) - (boxes[boxes[i].previousBoxes[j]].x + boxSize.x / 2)) < tol &&
						Math.abs(boxes[i].y - boxes[boxes[i].previousBoxes[j]].y) < tol && 
						boxes[boxes[i].previousBoxes[j]].nextBoxes.length > 0 &&
						boxes[i].previousBox != boxes[i].previousBoxes[j] &&
						boxes[boxes[i].previousBoxes[j]].nextBox != i &&
						boxes[boxes[i].previousBoxes[j]].nextBoxes.lastIndexOf(i) != -1)
					{
						if(belongsBefore(i, boxes[i].previousBoxes[j]))
						{
							console.log("previousBoxes");
									
							boxes[i].previousBox = boxes[i].previousBoxes[j];
							boxes[boxes[i].previousBox].nextBox = i;
							
							//cleanPhrasePositions(substringBeginning(boxes[i].previousBoxes[j]));
							//cleanPhrasePositions(substringBeginning(boxes[i].previousBox));
							//cleanPhrasePositions(i);
							cleanSubstringPhrasePositions(i);
							
							//cleanPreviousLinks(substringBeginning(boxes[i].previousBoxes[j]));
							cleanPreviousLinks(substringBeginning(boxes[i].previousBox));
							cleanNextLinks(i);
							
							//boxes[boxes[i].previousBoxes[j]].nextBoxes = [];
							//boxes[substringBeginning(boxes[i].previousBox)].nextBoxes = [];
							//clearNextBoxes(boxes[i].previousBox);
							boxes[boxes[i].previousBox].nextBoxes = [];
							boxes[i].previousBoxes = [];
							
							markSubstring(substringBeginning(i));
							markSubstring(i);
						}
					}
				}
				
				for(var j = 0; j < boxes[i].nextBoxes.length; j++)
				{
					if(Math.abs((boxes[i].x + boxSize.x / 2) - (boxes[boxes[i].nextBoxes[j]].x - boxSize.x / 2)) < tol &&
						Math.abs(boxes[i].y - boxes[boxes[i].nextBoxes[j]].y) < tol &&
						boxes[boxes[i].nextBoxes[j]].previousBoxes.length > 0 &&
						boxes[i].nextBox != boxes[i].nextBoxes[j] &&
						boxes[boxes[i].nextBoxes[j]].previousBox != i && 
						boxes[boxes[i].nextBoxes[j]].previousBoxes.lastIndexOf(i) != -1)
					{	
						if(belongsAfter(i, boxes[i].nextBoxes[j]))
						{
							console.log("nextBoxes");
						
							boxes[i].nextBox = boxes[i].nextBoxes[j];
							boxes[boxes[i].nextBox].previousBox = i;
							
							//cleanPhrasePositions(substringEnd(boxes[i].nextBoxes[j]));
							//cleanPhrasePositions(substringEnd(boxes[i].nextBox));
							//cleanPhrasePositions(i);
							cleanSubstringPhrasePositions(i);
							
							//cleanNextLinks(substringEnd(boxes[i].nextBoxes[j]));
							cleanNextLinks(substringEnd(boxes[i].nextBox));
							cleanPreviousLinks(i);
							
							//boxes[boxes[i].nextBoxes[j]].previousBoxes = [];
							//boxes[substringEnd(boxes[i].nextBox)].previousBoxes = [];
							//clearPreviousBoxes(boxes[i].nextBox);
							boxes[boxes[i].nextBox].previousBoxes = [];
							boxes[i].nextBoxes = [];
							
							markSubstring(substringBeginning(i));
							markSubstring(i);
						}
					}
				}
				
				/*for(var j = 0; j < boxes[i].links.length; j++)
				{
					if(j < boxes[i].links.length && boxes[i].links[j].previous != -1 &&
						Math.abs((boxes[i].x - boxSize.x / 2) - (boxes[boxes[i].links[j].previous].x + boxSize.x / 2)) < tol &&
						Math.abs(boxes[i].y - boxes[boxes[i].links[j].previous].y) < tol &&
						boxes[i].previousBox != boxes[i].links[j].previous &&
						boxes[boxes[i].links[j].previous].nextBox != i)
					{
						console.log("links.previous");
						boxes[i].previousBox = boxes[i].links[j].previous;
						boxes[boxes[i].links[j].previous].nextBox = i;
						
						boxes[i].previousBoxes = [];
						boxes[boxes[i].links[j].previous].nextBoxes = [];
						
						cleanPhrasePositions(substringBeginning(boxes[i].links[j].previous));
						cleanPhrasePositions(i);
						
						cleanPreviousLinks(boxes[i].links[j].previous);
						cleanNextLinks(i);
					}
					
					if(j < boxes[i].links.length && boxes[i].links[j].next != -1 &&
						Math.abs((boxes[i].x + boxSize.x / 2) - (boxes[boxes[i].links[j].next].x - boxSize.x / 2)) < tol &&
						Math.abs(boxes[i].y - boxes[boxes[i].links[j].next].y) < tol &&
						boxes[i].nextBox != boxes[i].links[j].next &&
						boxes[boxes[i].links[j].next].previousBox != i)
					{
						console.log("links.next");
						boxes[i].nextBox = boxes[i].links[j].next;
						boxes[boxes[i].links[j].next].previousBox = i;
						
						boxes[i].nextBoxes = [];
						boxes[boxes[i].links[j].next].previousBoxes = [];
						
						cleanPhrasePositions(substringEnd(boxes[i].links[j].next));
						cleanPhrasePositions(i);
						
						cleanNextLinks(boxes[i].links[j].next);
						cleanPreviousLinks(i);
					}
				}*/
			}
		}
		
		orderLetters();
		
		solveWords();
		
		if(selectedBoxIndex == -1)
		{
			console.log(boxes);
			console.log(substrings);
			console.log(zOrder);
			console.log(reverseLookups);
			debugLookup();
		}
		
		selectedBoxIndex = -1;
	}
	
	if(event.type == "click")
	{
		
	}
}

function gameLoop() 
{
	context.clearRect(0, 0, canvas.width, canvas.height);
	
	for(var i = 0; i < zOrder.length; i++)
	{
		drawLetter(boxes[zOrder[i]].letter, boxes[zOrder[i]].x, boxes[zOrder[i]].y);
	}
	
}

function liftBox(zIndex)
{
	console.log("liftBox(" + zIndex + ") Letter " + boxes[zOrder[zIndex]].letter + " at " + zOrder[zIndex]);
	var _pickedUpZ = zOrder[zIndex];
	var _zIndex = reverseLookups[zOrder[zIndex]].zIndex;
	
	for(var i = zIndex; i < zOrder.length - 1; i++)
	{
		//reverseLookups[zOrder[i]].zIndex = reverseLookups[zOrder[i + 1]].zIndex
		zOrder[i] = zOrder[i + 1];
		reverseLookups[zOrder[i]].zIndex = i;
	}
	
	zOrder[zOrder.length - 1] = _pickedUpZ;
	reverseLookups[zOrder[zOrder.length - 1]].zIndex = zOrder.length - 1;
}

function orderLetters()
{
	if(selectedBoxIndex != -1)
	{
		var _box = selectedBoxIndex;
				
		while(boxes[_box].previousBox != -1)
		{
			boxes[boxes[_box].previousBox].y = boxes[_box].y;
			boxes[boxes[_box].previousBox].x = boxes[_box].x - boxSize.x;
			
			_box = boxes[_box].previousBox;
		} 
		
		_box = selectedBoxIndex;
		
		while(boxes[_box].nextBox != -1)
		{
			boxes[boxes[_box].nextBox].y = boxes[_box].y;
			boxes[boxes[_box].nextBox].x = boxes[_box].x + boxSize.x;
			
			_box = boxes[_box].nextBox;
		} 
	}
}

//Remove previous and next links because they no longer form words when placed next to the box in question.

function cleanPreviousLinks(boxIndex)
{
	var _previous, _next;
	var _previousLetters = [];
	
	//console.log("cleanPreviousLinks(" + boxes[boxIndex].letter + " at " + boxIndex + ")");
	for(var i = 0; i < boxes[boxIndex].links.length; i++)
	{
		//console.log(boxes[boxes[boxIndex].nextBox].letter + " at " + boxes[boxIndex].nextBox + " != " + boxes[boxes[boxIndex].links[i].next].letter + " at " + boxes[boxIndex].links[i].next + " i = " + i);
		while(boxes[boxIndex].links.length > i && 
			(
			(boxes[boxIndex].nextBox != -1 && boxes[boxIndex].links[i].next != -1 && boxes[boxes[boxIndex].nextBox].letter != boxes[boxes[boxIndex].links[i].next].letter) ||
			((boxes[boxIndex].nextBox == -1 || boxes[boxIndex].links[i].next == -1) && boxes[boxIndex].nextBox != boxes[boxIndex].links[i].next) ||
			(boxes[boxIndex].previousBox == boxes[boxIndex].links[i].previous && boxes[boxIndex].nextBox == boxes[boxIndex].links[i].next))
			)
		{
			_previous = boxes[boxIndex].links[i].previous != -1 ? boxes[boxes[boxIndex].links[i].previous].letter : "start";
			_next = boxes[boxIndex].links[i].next != -1 ? boxes[boxes[boxIndex].links[i].next].letter : "end";
			//console.log("pop " + _previous + ", " + _next + " at (" + boxes[boxIndex].links[i].previous + ", " + boxes[boxIndex].links[i].next + ") i = " + i);
			
			boxes[boxIndex].links[i] = boxes[boxIndex].links[boxes[boxIndex].links.length - 1];
			boxes[boxIndex].links.pop();
			
			//debugBox(boxIndex);
		}
	}
	
	//clearArray(boxes[boxIndex].previousBoxes);
	
	for(var i = 0; i < boxes[boxIndex].links.length; i++)
	{
		if(boxes[boxIndex].links[i].previous != -1)
		{
			_previousLetters.push(boxes[boxes[boxIndex].links[i].previous].letter);
		}
	}
	
	for(var i = 0; i < boxes[boxIndex].previousBoxes.length; i++)
	{
		while(i <  boxes[boxIndex].previousBoxes.length && _previousLetters.lastIndexOf(boxes[boxes[boxIndex].previousBoxes[i]].letter) == -1)
		{
			boxes[boxIndex].previousBoxes[i] = boxes[boxIndex].previousBoxes[boxes[boxIndex].previousBoxes.length - 1];
			boxes[boxIndex].previousBoxes.pop();
		}
	}
	
	clearArray(_previousLetters);
	
	cleanAllOtherLinks(boxIndex);
	
	removeAllPrevious(boxIndex);
}

function cleanNextLinks(boxIndex)
{
	var _previous, _next;
	var _nextLetters = [];

	//console.log("cleanNextLinks(" + boxes[boxIndex].letter + " at " + boxIndex + ")");
	for(var i = 0; i < boxes[boxIndex].links.length; i++)
	{
		while(boxes[boxIndex].links.length > i && 
			(
			(boxes[boxIndex].previousBox != -1 && boxes[boxIndex].links[i].previous != -1 && boxes[boxes[boxIndex].previousBox].letter != boxes[boxes[boxIndex].links[i].previous].letter) ||
			((boxes[boxIndex].previousBox == -1 || boxes[boxIndex].links[i].previous == -1) && boxes[boxIndex].previousBox != boxes[boxIndex].links[i].previous) ||
			(boxes[boxIndex].previousBox == boxes[boxIndex].links[i].previous && boxes[boxIndex].nextBox == boxes[boxIndex].links[i].next))
			)
		{
			_previous = boxes[boxIndex].links[i].previous != - 1 ? boxes[boxes[boxIndex].links[i].previous].letter : "start";
			_next = boxes[boxIndex].links[i].next != -1 ? boxes[boxes[boxIndex].links[i].next].letter : "end";
			//console.log("pop " + _previous + ", " + _next + " at " + boxes[boxIndex].links[i].previous + ", " + boxes[boxIndex].links[i].next);
			
			boxes[boxIndex].links[i] = boxes[boxIndex].links[boxes[boxIndex].links.length - 1];
			boxes[boxIndex].links.pop();
			
			//debugBox(boxIndex);
		}
	}
	
	for(var i = 0; i < boxes[boxIndex].links.length; i++)
	{
		if(boxes[boxIndex].links[i].next != -1)
		{
			_nextLetters.push(boxes[boxes[boxIndex].links[i].next].letter);
		}
	}
	
	for(var i = 0; i < boxes[boxIndex].nextBoxes.length; i++)
	{
		while(i <  boxes[boxIndex].nextBoxes.length && _nextLetters.lastIndexOf(boxes[boxes[boxIndex].nextBoxes[i]].letter) == -1)
		{
			boxes[boxIndex].nextBoxes[i] = boxes[boxIndex].nextBoxes[boxes[boxIndex].nextBoxes.length - 1];
			boxes[boxIndex].nextBoxes.pop();
		}
	}
	
	clearArray(_nextLetters);

	cleanAllOtherLinks(boxIndex);
	
	removeAllNext(boxIndex);
}

//Remove all references (previous and next) to a given box.

function removeAllPrevious(previousBox)
{
	//console.log("removeAllPrevious(" + boxes[previousBox].letter + " at " + previousBox + ")");
	for(var i = 0; i < boxes.length; i++)
	{
		for(var j = 0; j < boxes[i].previousBoxes.length; j++)
		{
			if(boxes[i].previousBoxes[j] == previousBox)
			{
				boxes[i].previousBoxes[j] = boxes[i].previousBoxes[boxes[i].previousBoxes.length - 1];
				boxes[i].previousBoxes.pop();
			}
		}
	}
}

function removeAllNext(nextBox)
{
	//console.log("removeAllNext(" + boxes[nextBox].letter + " at " + nextBox + ")");
	for(var i = 0; i < boxes.length; i++)
	{
		for(var j = 0; j < boxes[i].nextBoxes.length; j++)
		{
			if(boxes[i].nextBoxes[j] == nextBox)
			{
				boxes[i].nextBoxes[j] = boxes[i].nextBoxes[boxes[i].nextBoxes.length - 1];
				boxes[i].nextBoxes.pop();
			}
		}
	}
}

function cleanAllOtherLinks(boxIndex)
{
	//console.log("cleanAllOtherLinks(" + boxes[boxIndex].letter + " at " + boxIndex + ")");
	var previousFit = false;
	for(var i = 0; i < boxes.length; i++)
	{
		for(var j = 0; j < boxes[i].nextBoxes.length; j++)
		{
			if(boxes[i].nextBoxes[j] == boxIndex)
			{
				previousFit = false;
				
				for(var ii = 0; ii < boxes[boxIndex].phrasePositions.length; ii++)
				{
					for(var jj = 0; jj < boxes[boxIndex].phrasePositions[ii].letterIndices.length; jj++)
					{
						if(letters[boxes[boxIndex].phrasePositions[ii].wordIndex][boxes[boxIndex].phrasePositions[ii].letterIndices[jj] - 1] == boxes[i].letter)
						{
							previousFit = true;
							break;
						}
					}
					
					if(previousFit)
					{
						break;
					}
				}
				
				if(!previousFit)
				{
					boxes[i].nextBoxes[j] = boxes[i].nextBoxes[boxes[i].nextBoxes.length - 1];
					boxes[i].nextBoxes.pop();
				}
			}
		}
	}
	
	var nextFit = false;
	for(var i = 0; i < boxes.length; i++)
	{
		for(var j = 0; j < boxes[i].previousBoxes.length; j++)
		{
			if(boxes[i].previousBoxes[j] == boxIndex)
			{
				nextFit = false;
				
				for(var ii = 0; ii < boxes[boxIndex].phrasePositions.length; ii++)
				{
					for(var jj = 0; jj < boxes[boxIndex].phrasePositions[ii].letterIndices.length; jj++)
					{
						if(letters[boxes[boxIndex].phrasePositions[ii].wordIndex][boxes[boxIndex].phrasePositions[ii].letterIndices[jj] + 1] == boxes[i].letter)
						{
							nextFit = true;
							break;
						}
					}
					
					if(nextFit)
					{
						break;
					}
				}
				
				if(!nextFit)
				{
					boxes[i].previousBoxes[j] = boxes[i].previousBoxes[boxes[i].previousBoxes.length - 1];
					boxes[i].previousBoxes.pop();
				}
			}
		}
	}
}

function markSubstring(boxIndex)
{
	//console.log("markSubstring(" + boxes[boxIndex].letter + " at " + boxIndex + ")");
	var _match, _boxIndex, _boxIndices;
	
	for(var i = 0; i < substrings.length; i++)
	{
		if(substrings[i].occurences > 0 && substrings[i].boxIndices.lastIndexOf(boxIndex) == -1)
		{
			_match = true;
			
			_boxIndex = boxIndex;
			
			_boxIndices = [];
			
			for(var j = 0; j < substrings[i].substring.length && _boxIndex != -1; j++)
			{
				//console.log(substrings[i].substring + " " + boxes[_boxIndex].letter + " != " + substrings[i].substring.charAt(j));
				if(boxes[_boxIndex].letter != substrings[i].substring.charAt(j))
				{
					_match = false;
					break;
				}
				else
				{
					_boxIndices.push(_boxIndex);
				}
				
				_boxIndex = boxes[_boxIndex].nextBox;
			}
			
			//console.log(i + " " + _match + " " + j + " == " + (substrings[i].substring.length));
			
			if(_match && j == substrings[i].substring.length)
			{
				substrings[i].occurences--;
				substrings[i].boxIndices = substrings[i].boxIndices.concat(_boxIndices);
				console.log(substrings[i].substring + " occured!");
				
				if(substrings[i].occurences == 0)
				{
					console.log("all " + substrings[i].substring + " occured!");
					for(var ii = 0; ii < boxes.length; ii++)
					{
						if(substrings[i].boxIndices.lastIndexOf(ii) == -1)
						{
							for(var iii = 0; iii < substrings[i].phrasePositions.length; iii++)
							{
								for(var jjj = 0; jjj < substrings[i].phrasePositions[iii].letterIndices.length; jjj++)
								{
									deletePhrasePosition(ii, substrings[i].phrasePositions[iii].wordIndex, substrings[i].phrasePositions[iii].letterIndices[jjj]);
									cleanAllOtherLinks(ii);
								}
							}
						}
					}
				}
			}
			
			clearArray(_boxIndices);
		}
	}
}

function cleanPhrasePositions(boxIndex)
{
	//console.log("cleanPhrasePositions(" + boxes[boxIndex].letter + " at " + boxIndex + ")");
	var _previousBox, _nextBox, _matches, _letter;
	
	for(var i = 0; i < boxes[boxIndex].phrasePositions.length; i++)
	{
		for(var j = 0; j < boxes[boxIndex].phrasePositions[i].letterIndices.length; j++)
		{
			_matches = true;
			_previousBox = boxes[boxIndex].previousBox;
			_letter =  boxes[boxIndex].phrasePositions[i].letterIndices[j] - 1;
			
			while(_previousBox != -1)
			{
				//console.log(boxes[boxIndex].phrasePositions[i].wordIndex + " " + _letter + " " + letters[boxes[boxIndex].phrasePositions[i].wordIndex][_letter] + " == " + boxes[_previousBox].letter);
				if(letters[boxes[boxIndex].phrasePositions[i].wordIndex][_letter] != boxes[_previousBox].letter)
				{
					boxes[boxIndex].phrasePositions[i].letterIndices[j] = boxes[boxIndex].phrasePositions[i].letterIndices[boxes[boxIndex].phrasePositions[i].letterIndices.length - 1];
					boxes[boxIndex].phrasePositions[i].letterIndices.pop();
					j--;
					break;
				}
				
				_previousBox = boxes[_previousBox].previousBox;
				_letter--;
			}
		}
	}
	
	for(var i = 0; i < boxes[boxIndex].phrasePositions.length; i++)
	{
		for(var j = 0; j < boxes[boxIndex].phrasePositions[i].letterIndices.length; j++)
		{
			_nextBox = boxes[boxIndex].nextBox;
			_letter =  boxes[boxIndex].phrasePositions[i].letterIndices[j] + 1;
			
			while(_nextBox != -1)
			{
				//console.log(boxes[boxIndex].phrasePositions[i].wordIndex + " " + _letter + " " + letters[boxes[boxIndex].phrasePositions[i].wordIndex][_letter] + " == " + boxes[_nextBox].letter);
				if(letters[boxes[boxIndex].phrasePositions[i].wordIndex][_letter] != boxes[_nextBox].letter)
				{
					boxes[boxIndex].phrasePositions[i].letterIndices[j] = boxes[boxIndex].phrasePositions[i].letterIndices[boxes[boxIndex].phrasePositions[i].letterIndices.length - 1];
					boxes[boxIndex].phrasePositions[i].letterIndices.pop();
					j--;
					break;
				}
				
				_nextBox = boxes[_nextBox].nextBox;
				_letter++;
			}
		}
	}
	
	for(var i = 0; i < boxes[boxIndex].phrasePositions.length; i++)
	{
		while(i < boxes[boxIndex].phrasePositions.length && boxes[boxIndex].phrasePositions[i].letterIndices.length == 0)
		{
			boxes[boxIndex].phrasePositions[i] = boxes[boxIndex].phrasePositions[boxes[boxIndex].phrasePositions.length - 1];
			boxes[boxIndex].phrasePositions.pop();
		}
	}
	
	if(numberOfPhrasePositions(boxIndex) == 1)
	{
		for(var i = 0; i < boxes.length; i++)
		{
			if(i != boxIndex)
			{
				deletePhrasePosition(i, boxes[boxIndex].phrasePositions[0].wordIndex, boxes[boxIndex].phrasePositions[0].letterIndices[0]);
			}
		}
	}
}

function cleanSubstringPhrasePositions(boxIndex)
{
	var _boxIndex;
	
	cleanPhrasePositions(boxIndex);
	
	_boxIndex = boxes[boxIndex].previousBox;
	
	while(_boxIndex != -1)
	{
		//console.log(_boxIndex);
		cleanPhrasePositions(_boxIndex);
		_boxIndex = boxes[_boxIndex].previousBox;
	}
	
	_boxIndex = boxes[boxIndex].nextBox;
	
	while(_boxIndex != -1)
	{
		//console.log(_boxIndex);
		cleanPhrasePositions(_boxIndex);
		_boxIndex = boxes[_boxIndex].nextBox;
	}
}

//Determines that a word has been solved.

function solveWords()
{
	for(var i = 0; i < letters.length; i++)
	{
		for(var j = 0; j < letters[i].length; j++)
		{
			for(var b = 0; b < boxes.length; b++)
			{
				var bb = b;
				var jj = j;
				var previousMatch = false;
				
				while(bb != -1 && boxes[bb].letter == letters[i][jj] && jj < letters[i].length && (previousMatch || boxes[bb].previousBox == -1))
				{
					jj++;
					
					if(jj - j == letters[i].length && boxes[bb].previousBoxes.length == 0 && boxes[bb].nextBox == -1)
					{
						console.log(boxes[bb].letter + "[" + bb + "] is at the end of word " + i + " and letter " + (jj - j));
						//boxes[bb].nextBoxes = [];
						//boxes[b].previousBoxes = [];
					}
					
					previousMatch = true;
					bb = boxes[bb].nextBox;
				}
			}
		}
	}
}

/*function boxIndex(wordIndex, letterIndex)
{
	var _boxIndex = 0;
	
	for(var i = 0; i < wordIndex; i++)
	{
		_boxIndex += boxes[i].length;
	}
	
	_boxIndex += letterIndex;
	
	return(_boxIndex);
}*/

function clearPreviousBoxes(boxIndex)
{
	do
	{
		clearArray(boxes[boxIndex].previousBoxes);
		boxIndex = boxes[boxIndex].nextBox;
	} while (boxIndex != -1)
}

function clearNextBoxes(boxIndex)
{
	do
	{
		clearArray(boxes[boxIndex].nextBoxes);
		boxIndex = boxes[boxIndex].previousBox;
	} while (boxIndex != -1)
}

//Beginning and End of a solved substring of a word.

function substringBeginning(boxIndex)
{
	while (boxes[boxIndex].previousBox != -1)
	{
		boxIndex = boxes[boxIndex].previousBox;
	} 
	
	return(boxIndex);
}

function substringEnd(boxIndex)
{
	while (boxes[boxIndex].nextBox != -1)
	{
		boxIndex = boxes[boxIndex].nextBox;
	} 
	
	return(boxIndex);
}

function belongsAfter(boxIndex, nextBoxIndex)
{
	//console.log("belongsAfter(" + boxIndex + ", " + nextBoxIndex + ")");
	if(boxIndex != -1 && nextBoxIndex != -1)
	{
		//console.log("belongsAfter(" + boxes[boxIndex].letter + " at " + boxIndex + ", " + boxes[nextBoxIndex].letter + " at " + nextBoxIndex + ")");
	}
	
	for(var i = 0; i < boxes[boxIndex].phrasePositions.length; i++)
	{
		for(var j = 0; j < boxes[boxIndex].phrasePositions[i].letterIndices.length; j++)
		{
			//console.log(nextBoxIndex + " : " + boxes[boxIndex].phrasePositions[i].wordIndex + " " + (boxes[boxIndex].phrasePositions[i].letters[j] + 1));
			if(containsPhrasePostion(nextBoxIndex, boxes[boxIndex].phrasePositions[i].wordIndex, boxes[boxIndex].phrasePositions[i].letterIndices[j] + 1))
			{
				return(true);
			}
		}
	}
	
	return(false);
}

function belongsBefore(boxIndex, previousBoxIndex)
{
	//console.log("belongsAfter(" + boxIndex + ", " + previousBoxIndex + ")");
	if(boxIndex != -1 && previousBoxIndex != -1)
	{
		//console.log("belongsBefore(" + boxes[boxIndex].letter + " at " + boxIndex + ", " + boxes[previousBoxIndex].letter + " at " + previousBoxIndex + ")");
	}
	
	for(var i = 0; i < boxes[boxIndex].phrasePositions.length; i++)
	{
		for(var j = 0; j < boxes[boxIndex].phrasePositions[i].letterIndices.length; j++)
		{
			//console.log(previousBoxIndex + " : " + boxes[boxIndex].phrasePositions[i].wordIndex + " " + (boxes[boxIndex].phrasePositions[i].letters[j] - 1));
			if(containsPhrasePostion(previousBoxIndex, boxes[boxIndex].phrasePositions[i].wordIndex, boxes[boxIndex].phrasePositions[i].letterIndices[j] - 1))
			{
				return(true);
			}
		}
	}
	
	console.log("was false");
	return(false);
}

function containsPhrasePostion(boxIndex, wordIndex, letterIndex)
{
	for(var i = 0; i < boxes[boxIndex].phrasePositions.length; i++)
	{
		if(boxes[boxIndex].phrasePositions[i].wordIndex == wordIndex)
		{
			for(var j = 0; j < boxes[boxIndex].phrasePositions[i].letterIndices.length; j++)
			{
				if(boxes[boxIndex].phrasePositions[i].letterIndices[j] == letterIndex)
				{
					return(true);
				}
			}
		}
	}
	
	return(false);
}

function numberOfPhrasePositions(boxIndex)
{
	var _num = 0;
	
	for(var i = 0; i < boxes[boxIndex].phrasePositions.length; i++)
	{
		for(var j = 0; j < boxes[boxIndex].phrasePositions[i].letterIndices.length; j++)
		{
			_num++;
		}
	}
	
	return(_num);
}

function deletePhrasePosition(boxIndex, wordIndex, letterIndex)
{
	//console.log("deletePhrasePosition(" + boxIndex + ", " + wordIndex + ", " + letterIndex + ")");
	for(var i = 0; i < boxes[boxIndex].phrasePositions.length; i++)
	{
		if(boxes[boxIndex].phrasePositions[i].wordIndex == wordIndex)
		{
			for(var j = 0; j < boxes[boxIndex].phrasePositions[i].letterIndices.length; j++)
			{
				if(boxes[boxIndex].phrasePositions[i].letterIndices[j] == letterIndex)
				{
					boxes[boxIndex].phrasePositions[i].letterIndices[j] = boxes[boxIndex].phrasePositions[i].letterIndices[boxes[boxIndex].phrasePositions[i].letterIndices.length - 1];
					boxes[boxIndex].phrasePositions[i].letterIndices.pop();
				}
			}
			
			if(boxes[boxIndex].phrasePositions[i].letterIndices.length == 0)
			{
				boxes[boxIndex].phrasePositions[i] = boxes[boxIndex].phrasePositions[boxes[boxIndex].phrasePositions.length - 1];
				boxes[boxIndex].phrasePositions.pop();
			}
		}
	}
}

function drawLetter(letter, x, y)
{
	var width = boxSize.x;
	var height = boxSize.y;
	context.font = fontSize + "px Arial";
	
	context.fillStyle = "grey";
	context.fillRect(x - width / 2, y - height / 2, width, height);
	context.fillStyle = "black";
	context.fillText(letter, x, y + height / 4);
}

function debugBox(boxIndex)
{
	var _debug = "[" + boxes[boxIndex].letter + " at " + boxIndex +  " with " + boxes[boxIndex].links.length + " links]";
	var _previous = "";
	var _next = "";
	
	if(boxIndex != -1)
	{
		for(var i = 0; i < boxes[boxIndex].links.length; i++)
		{
			if(boxes[boxIndex].links[i].previous != -1)
			{
				_previous = boxes[boxes[boxIndex].links[i].previous].letter + " at " + boxes[boxIndex].links[i].previous;
			}
			else
			{
				_previous = "start";
			}
			
			if(boxes[boxIndex].links[i].next != -1)
			{
				_next = boxes[boxes[boxIndex].links[i].next].letter + " at " + boxes[boxIndex].links[i].next;
			}
			else
			{
				_next= " end";
			}
			
			_debug += "(" + _previous + ", " + _next + ") ";
		}
		
		_debug += "\n" + boxes[boxIndex].previousBoxes.length +  " previous boxes :";
		for(var i = 0; i < boxes[boxIndex].previousBoxes.length; i++)
		{
			_debug += "(" + boxes[boxes[boxIndex].previousBoxes[i]].letter + " at " + boxes[boxIndex].previousBoxes[i] + ") ";
		}
		
		_debug += "\n" + boxes[boxIndex].nextBoxes.length +  " next boxes :";
		for(var i = 0; i < boxes[boxIndex].nextBoxes.length; i++)
		{
			_debug += "(" + boxes[boxes[boxIndex].nextBoxes[i]].letter + " at " + boxes[boxIndex].nextBoxes[i] + ") ";
		}
		
		_debug += "\n";
		for(var i = 0; i < boxes[boxIndex].phrasePositions.length; i++)
		{
			_debug += "[word " + boxes[boxIndex].phrasePositions[i].wordIndex + " : ";
			
			for(var j = 0; j < boxes[boxIndex].phrasePositions[i].letterIndices.length; j++)
			{
				_debug += " " + boxes[boxIndex].phrasePositions[i].letterIndices[j] + " ";
			}
			
			_debug += "] \n";
		}
	}
	
	console.log(_debug);
}

function debugLookup()
{
	var _debug = "Zorder \n";
	
	for(var i = 0; i < zOrder.length; i++)
	{
		_debug += "(zI: " + i + ", bI: " + zOrder[i] + " > " + boxes[zOrder[i]].letter + ") ";
	}
	
	_debug += "\n reverseLookups \n";
		
	for(var i = 0; i < reverseLookups.length; i++)
	{
		_debug += "(zI: " + reverseLookups[i].zIndex + ", bI: " + reverseLookups[i].boxIndex + " > " + boxes[reverseLookups[i].boxIndex].letter + ") ";
	}
	
	console.log(_debug);
}