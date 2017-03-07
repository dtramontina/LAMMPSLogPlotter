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
	arrayOfLines = text.match(/[^\r\n]+/g);
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

updateChart = function(dataName1, dataName2) {
	dataset = {
		x: columns[dataName1],
		y: columns[dataName2]
	}
	Plotly.newPlot("PlotlyTest", [dataset],
	{
		margin: { t: 0 },
		displayModeBar: false,
		modeBarButtonsToRemove: ['sendDataToCloud','hoverCompareCartesian']
	},
	{displayModeBar: false}
	);
}

window.onload = function() {
	var fileInput = document.getElementById('fileInput');
	var fileDisplayArea = document.getElementById('fileDisplayArea');

	fileInput.addEventListener('change', function(e) {
		var file = fileInput.files[0];
		
		var reader = new FileReader();

		reader.onload = function(e) {
			// fileDisplayArea.innerText = reader.result;
			parse(reader.result)
			createColumns()
			updateChart("Time", "Temp")
		}

		reader.readAsText(file);	
	});
}
