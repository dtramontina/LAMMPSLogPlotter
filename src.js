timesteps = []
headers = []
columns = {}

createColumns = function() {
	columns = []
	for(var i=0; i<headers.length; i++) {
		var values = []
		for(var j=0; j<timesteps.length; j++) {
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
	var timestep = -1
	for(var i in arrayOfLines) {
		var line = arrayOfLines[i]
		if(line.search("Memory usage per processor =") > -1) {
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

			var words = line.trim().split(" ")
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
			timestep = 0
			continue
		}

		if(nextLineIsData) {
			timestep += 1
			var words = line.trim().split(/[ ]+/)
			var values = []
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

	var xaxis = document.getElementById("xaxis")
	var x = []
	var datasets = []

	var summaryHtml = ""

	if(xaxis.value==="linenumber") {
		for (var i = 0; i < columns[headers[0]].length; i++) {
		    x.push(i);
		}
	} else {
		x = columns[xaxis.value]
	}

	for(var header in columns) {
		var plotColumn = document.getElementById(header).checked
		var sum = 0
		var sumSquared = 0
		if(plotColumn) {
			datasets.push({x: x, y: columns[header], name: header})
			for(var i=0; i<columns[header].length; i++) {
				sum += columns[header][i]
				sumSquared += columns[header][i]*columns[header][i]
			}

			var mean = sum / columns[header].length
			var meanSquared = sumSquared / columns[header].length
			var variance = meanSquared - mean*mean

			summaryHtml += "Mean("+header+") = "+mean.toFixed(3)
			summaryHtml += "   Stddev("+header+") = "+Math.sqrt(variance).toFixed(3)+"<br>"
		}
	}
	setContents("summary", summaryHtml)

	Plotly.newPlot("PlotlyTest", datasets,
		{
			margin: { t: 0 },
			displayModeBar: false,
			modeBarButtonsToRemove: ['sendDataToCloud','hoverCompareCartesian']
		},
		{ displayModeBar: false }
	);
}

createMenu = function() {
	var htmlObject = ""
	htmlObject += 'Choose x-axis:<br> <select id="xaxis" class="menu" onchange="updateChart()"><option value="linenumber">Line number</option>'
	for(var i in headers) {
		htmlObject+='<option value="'+headers[i]+'">'+headers[i]+'</option>'
	}
	htmlObject+="</select><br>"

	for(var i in headers) {
		htmlObject+='<input id='+headers[i]+' type="checkbox" onchange="updateChart()" value="'+headers[i]+'">'+headers[i]
	}
	htmlObject += '<button onclick="clearSelection()">Clear</button>'
	setContents("menu", htmlObject)
}

clearSelection = function() {
	for(var header in columns) {
		document.getElementById(header).checked = false
	}
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

window.onload = function() {
	var fileInput = document.getElementById('fileInput')
	var fileDisplayArea = document.getElementById('fileDisplayArea')

	fileInput.addEventListener('change', function(e) {
		var file = fileInput.files[0]
		var reader = new FileReader()

		reader.onload = function(e) {
			// fileDisplayArea.innerText = reader.result;
			timesteps = []
			headers = []
			columns = {}

			parse(reader.result)
			createColumns()
			createMenu()
			updateChart()
		}

		reader.readAsText(file)
	});
}
