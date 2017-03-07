timesteps = []
headers = []
columns = {}
ctx = undefined
chart = undefined

function transposeArray(array, arrayLength){

    var newArray = [];
    for(var i = 0; i < array.length; i++){
        newArray.push([]);
    };

    for(var i = 0; i < array.length; i++){
        for(var j = 0; j < arrayLength; j++){
            newArray[j].push(array[i][j]);
        };
    };

    return(newArray);
}

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

updateChart = function(dataName1, dataName2) {
	if(ctx === undefined) {
		ctx = document.getElementById("canvas").getContext("2d")
	}

	var numWantedPoints = 1000
	var numPoints = columns[headers[0]].length
	var keepEvery = Math.round(numPoints / numWantedPoints)
	var points = []
	for(var i=0; i<numPoints; i+=keepEvery) {
		points.push({x: columns[dataName1][i], y: columns[dataName2][i]})
	}
	if(chart === undefined) {
		chart = new Chart(ctx, {
		    type: 'line',
		    data: {
		        datasets: [{
		            label: 'Scatter Dataset',
		            data: points,
		            borderColor: window.chartColors.blue,
		            pointRadius: 0
		        }]
		    },
		    options: {
                responsive: false,
                title:{
                    display:true,
                    text:'Chart.js Line Chart'
                },
                tooltips: {
                    mode: 'index',
                    intersect: false,
                },
                hover: {
                    mode: 'nearest',
                    intersect: true
                },
                scales: {
                    xAxes: [{
		                type: 'linear',
		                position: 'bottom'
		            }]
                },
                pan: {
                	enabled: true,
                	mode: 'xy'
                },
                zoom: {
                	enabled: true,
                	mode: 'xy',
                	sensitivity: 3
                }
            }
		})
		window.myLine = chart
	} else {
		chart.data.datasets[0].data = points
	}
	chart.update();
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
