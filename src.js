timesteps = []
headers = []
columns = {}
currentXValues = []
createColumns = function() {
	columns = []
	for(var i=0; i<headers.length; i++) {
		var values = []
		for(var j=0; j<timesteps.length; j++) {
			if(timesteps[j][i]===undefined) {
				console.log("faen da...")
			}
			values.push(timesteps[j][i])
		}

		columns[headers[i]] = values
	}
	
}

parse = function(text) {
	arrayOfLines = text.match(/[^\r\n]+/g)
	var nextLineIsHeader = false
	var nextLineIsData = false
	var currentLineIsLastDataLine = false
	var entryNumber = -1
	for(var i in arrayOfLines) {
		var line = arrayOfLines[i]
		if(line.search("Memory usage per processor =") > -1 || line.search("Per MPI rank memory allocation") > -1) {
			console.log("Found stuff")
			// Next line is a header line
			nextLineIsHeader = true
			continue
		}

		if(nextLineIsData && i < arrayOfLines.length-1) {
			var nextLine = arrayOfLines[parseInt(i)+1]
			if(nextLine.search("Loop time of ") > -1) {
				// Next line is a header line
				currentLineIsLastDataLine = true
			}
		}

		if(nextLineIsHeader) {
			// Parse word by word, compare to existing header and throw exception if headers have changed

			var words = line.trim().split(/[ ]+/)
			if(headers.length > 0) {
				for(var j in words) {
					var word = words[j]
					var oldWord = headers[j]
					if(word !== oldWord) {
						timesteps = []
					}

				}
			}
			headers = words
			nextLineIsHeader = false
			nextLineIsData = true
			continue
		}

		if(nextLineIsData) {
			entryNumber += 1
			var words = line.trim().split(/[ ]+/)
			var values = []
			if(words.length !== headers.length) {
				console.log("Skipping entry number ", entryNumber)
				continue
			}
			for(var j in words) {
				var value = parseFloat(words[j])
				values.push(value)
			}
			timesteps.push(values)
		}

		if(currentLineIsLastDataLine) {
			nextLineIsData = false
			currentLineIsLastDataLine = false
		}
	}
}

var hasPlottedOnce = false
updateChart = function() {
	// Save input text
	localStorage.setItem('input', document.getElementById("input").value)

	var xaxis = document.getElementById("xaxis")
	currentXValues = []
	var datasets = []

	var summaryHtml = ""

	if(xaxis.value==="linenumber") {
		for (var i = 0; i < columns[headers[0]].length; i++) {
		    currentXValues.push(i);
		}
	} else {
		currentXValues = columns[xaxis.value]
	}
	var xlabel = xaxis.value
	for(var header in columns) {
		if(columnEnabled(header)) {
			datasets.push({x: currentXValues, y: columns[header], name: header})
			var ylabel = header
		}
	}
	updateSummary()
	var layout = {displayModeBar: true, modeBarButtonsToRemove: ['sendDataToCloud','hoverCompareCartesian'], 
		      title: 'Click Here<br>to Edit Chart Title', 
		      xaxis: {title: {text: xlabel, font: {family: 'Courier New, monospace', size: 30, color: '#7f7f7f'}}},
		      }
	var confg = { displayModeBar: true, editable: true, displaylogo: true }
	Plotly.newPlot("PlotlyTest", datasets, layout, confg);

	if(!hasPlottedOnce) {
		document.getElementById("PlotlyTest").on('plotly_relayout',
	    function(eventdata){  
	    	var xmin = eventdata['xaxis.range[0]']
	    	var xmax = eventdata['xaxis.range[1]']
	    	updateSummary(xmin, xmax)
	    })
	}
	hasPlottedOnce = true
}

columnEnabled = function(header) {
	var plotColumn = document.getElementById(header).checked
	if(plotColumn) return true

	var input = document.getElementById("input").value
	var inputWords = input.trim().split(/[ ]+/)
	for(var i in inputWords) {
		var word = inputWords[i]
		if(header.toLowerCase()===word.toLowerCase()) {
			return true
		}
	}

	return false
}

updateSummary = function(xmin, xmax) {
	var summaryHtml = ""

	var input = document.getElementById("input").value
	var inputWords = input.trim().split(/[ ]+/)
	for(var header in columns) {
		if(columnEnabled(header)) {
			var sum = 0
			var sumSquared = 0
			var count = 0
			for(var i=0; i<columns[header].length; i++) {
				if(xmin !== undefined) {
					if(currentXValues[i] < xmin) continue
				}
				if(xmax !== undefined) {
					if(xmax < currentXValues[i]) continue
				}

				count += 1
				sum += columns[header][i]
				sumSquared += columns[header][i]*columns[header][i]
			}

			var mean = sum / count
			var meanSquared = sumSquared / count
			var variance = meanSquared - mean*mean
			summaryHtml += "Mean("+header+") = "+mean.toFixed(3)
			summaryHtml += "   Stddev("+header+") = "+Math.sqrt(variance).toFixed(3)+"<br>"
		}
	}
	setContents("summary", summaryHtml)
}

createMenu = function() {
	var htmlObject = ""
	htmlObject += 'Choose x-axis: <select id="xaxis" class="menu" onchange="updateChart()"><option value="linenumber">Line number</option>'
	for(var i in headers) {
		htmlObject+='<option value="'+headers[i]+'">'+headers[i]+'</option>'
	}
	htmlObject+="</select><br>"

	for(var i in headers) {
		htmlObject+='<input id='+headers[i]+' type="checkbox" onchange="updateChart()" value="'+headers[i]+'">'+headers[i]
	}
	htmlObject += '<span button onclick="clearSelection()">Clear</button><br>'
	htmlObject += '<span title="Write the names of any property, space separated.">Properties:</span> <input id="input" type="text" onchange="updateChart()" />'
	setContents("menu", htmlObject)
	if (localStorage.getItem('input')) {
        document.getElementById("input").value = localStorage.getItem('input');
    }
}

clearSelection = function() {
	for(var header in columns) {
		document.getElementById(header).checked = false
	}
	document.getElementById("input").value = ""

	updateChart()
}

function setContents(id, html)
{
	document.getElementById(id).innerHTML = html;
}

function addContent(id, html)
{
	document.getElementById(id).innerHTML += html;
}
