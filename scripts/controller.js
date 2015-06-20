$("#urlSearch").on('click' , function(){
  // http://www.theguardian.com/technology/live/2015/mar/09/apple-watch-macbook-launch-event-smartwatch-spring-forward
  var url = $("#url").val();
  var find = '/';
  var re = new RegExp(find, 'g');
  url = url.replace(re, '~');
  console.log(url);
  var topic = $("#topic").val();
  $.get('http://127.0.0.1:5000/parseNews/'+topic+'/'+url).success(function(data){
    var all_tweets_data = JSON.parse(data);
    //var html = "<ul>";
    var keywordOb = all_tweets_data["all_tweets"];
    var sentimentDataObj = all_tweets_data["sentiment_chart"];
    var word_list = all_tweets_data.word_cloud;

    $("#my_favorite_latin_words").jQCloud(JSON.parse(word_list));
    var freqData = JSON.parse(all_tweets_data.feature_data)

    dashboard('#dashboard',freqData);
    var summary_html = "<p>";
    summary = all_tweets_data.summary;
    summary_html+=summary+"</p>";
	for (var key in keywordOb) {
	    if (keywordOb.hasOwnProperty(key)) {
        	var value = keywordOb[key];
			console.log(value);
			addTab(key, "id_" + key, value);
			//html += "<li>"+key+"</li>";
            var svg = d3.select("#chart_" + key).append("svg").attr("width",200).attr("height",80);
            svg.append("g").attr("id","donut_" + key);
            Donut3D.draw("donut_" + key, JSON.parse(sentimentDataObj[key]), 200, 200, 100, 80, 30, 0);
    	}
	}
    $("#summary").append(summary_html);
  }).error(function(data){
    alert("Error getting keywords");
  });
});

function addTab(title, id,value){
    if ($('#tt').tabs('exists', title)){
        $('#tt').tabs('select', title);
    } else {
		var json_data = [];
		var tweet = [];
		for(var i=0; i< value.length; i++){ 
			console.log(value[i]["_source"].text);
			var tweet = {"tweet_date":value[i]["_source"].created_at,"tweet_text":value[i]["_source"].text}
			json_data.push(tweet);
		}
        //var content = '<iframe scrolling="auto" frameborder="0"  src="'+url+'" style="width:100%;height:100%;"></iframe>';
        // content = '<div style="margin:20px 0;"></div><div id="chart_' + title + '"></div><table id="' + id + '" class="easyui-datagrid" title="Tweet list" style="width:708px;height:299px" rownumbers="true" fitColumns="true"><thead><tr><th data-options="field:\'tweet_date\',width:80">Tweet Date</th><th data-options="field:\'tweet_text\',width:600">Tweet Text</th></tr></thead></table>'
        // content = '<div style="width: 30%; height: 50%; float:left;"><div id="chart_' + title + '"></div></div><div style="width: 70%; height: 50%; float:right;"><table id="' + id + '" class="easyui-datagrid" title="Tweet list" style="width:708px;height:299px" rownumbers="true" fitColumns="true"><thead><tr><th data-options="field:\'tweet_date\',width:80">Tweet Date</th><th data-options="field:\'tweet_text\',width:600">Tweet Text</th></tr></thead></table></div><div style="width: 100%; height: 50%; background-color: red; clear:both"></div>'
        // content = '<div style="margin:20px 0;"></div><div style="width: 30%; height: 100%; float:left;"><div id="chart_' + title + '"></div></div><div style="width: 70%; height: 100%; float:right;"><table id="' + id + '" class="easyui-datagrid" title="Tweet list" style="width:100%;height:100%" rownumbers="true" fitColumns="true"><thead><tr><th data-options="field:\'tweet_date\',width:80">Tweet Date</th><th data-options="field:\'tweet_text\',width:600">Tweet Text</th></tr></thead></table></div><div style="width: 100%; height: 50%; background-color: red; clear:both"></div>'
        content = '<div class="yui-g"><div class="yui-u first" style="width: 40%! important; height: 100%! important"><div class="content"><div id="chart_' + title + '"></div></div></div><div class="yui-u" style="width: 59.1%! important; height: 100%! important"><div class="content"><table id="' + id + '" class="easyui-datagrid" title="Tweet list" style="width:100%;height:99%" rownumbers="true" fitColumns="true"><thead><tr><th data-options="field:\'tweet_date\',width:80">Tweet Date</th><th data-options="field:\'tweet_text\',width:600">Tweet Text</th></tr></thead></table></div></div></div>'
        $('#tt').tabs('add',{
            title:title,
            content:content,
            closable:false
        });
        $('#' + id).datagrid({
            data: json_data
        });
    }
}

function dashboard(id, fData){
 var barColor = 'steelblue';
 function segColor(c){ return {pos:"#807dba", neg:"#e08214",neu:"#41ab5d"}[c]; }

 // compute total for each state.
 fData.forEach(function(d){d.total=d.freq.pos+d.freq.neg+d.freq.neu;});

    // function to handle histogram.
 function histoGram(fD){
        var hG={},    hGDim = {t: 60, r: 0, b: 30, l: 0};
        hGDim.w = 400 - hGDim.l - hGDim.r,
        hGDim.h = 200 - hGDim.t - hGDim.b;

        //create svg for histogram.
        var hGsvg = d3.select(id).append("svg")
            .attr("width", hGDim.w + hGDim.l + hGDim.r)
            .attr("height", hGDim.h + hGDim.t + hGDim.b).append("g")
            .attr("transform", "translate(" + hGDim.l + "," + hGDim.t + ")");

        // create function for x-axis mapping.
        var x = d3.scale.ordinal().rangeRoundBands([0, hGDim.w], 0.1)
                .domain(fD.map(function(d) { return d[0]; }));

        // Add x-axis to the histogram svg.
        hGsvg.append("g").attr("class", "x axis")
            .attr("transform", "translate(0," + hGDim.h + ")")
            .call(d3.svg.axis().scale(x).orient("bottom"));

        // Create function for y-axis map.
        var y = d3.scale.linear().range([hGDim.h, 0])
                .domain([0, d3.max(fD, function(d) { return d[1]; })]);

        // Create bars for histogram to contain rectangles and freq labels.
        var bars = hGsvg.selectAll(".bar").data(fD).enter()
                .append("g").attr("class", "bar");

        //create the rectangles.
        bars.append("rect")
            .attr("x", function(d) { return x(d[0]); })
            .attr("y", function(d) { return y(d[1]); })
            .attr("width", x.rangeBand())
            .attr("height", function(d) { return hGDim.h - y(d[1]); })
            .attr('fill',barColor)
            .on("mouseover",mouseover)// mouseover is defined below.
            .on("mouseout",mouseout);// mouseout is defined below.

        //Create the frequency labels above the rectangles.
        bars.append("text").text(function(d){ return d3.format(",")(d[1])})
            .attr("x", function(d) { return x(d[0])+x.rangeBand()/2; })
            .attr("y", function(d) { return y(d[1])-5; })
            .attr("text-anchor", "middle");

        function mouseover(d){  // utility function to be called on mouseover.
            // filter for selected state.
            var st = fData.filter(function(s){ return s.Feature == d[0];})[0],
                nD = d3.keys(st.freq).map(function(s){ return {type:s, freq:st.freq[s]};});

            // call update functions of pie-chart and legend.
            pC.update(nD);
            leg.update(nD);
        }

        function mouseout(d){    // utility function to be called on mouseout.
            // reset the pie-chart and legend.
            pC.update(tF);
            leg.update(tF);
        }

        // create function to update the bars. This will be used by pie-chart.
        hG.update = function(nD, color){
            // update the domain of the y-axis map to reflect change in frequencies.
            y.domain([0, d3.max(nD, function(d) { return d[1]; })]);

            // Attach the new data to the bars.
            var bars = hGsvg.selectAll(".bar").data(nD);

            // transition the height and color of rectangles.
            bars.select("rect").transition().duration(500)
                .attr("y", function(d) {return y(d[1]); })
                .attr("height", function(d) { return hGDim.h - y(d[1]); })
                .attr("fill", color);

            // transition the frequency labels location and change value.
            bars.select("text").transition().duration(500)
                .text(function(d){ return d3.format(",")(d[1])})
                .attr("y", function(d) {return y(d[1])-5; });
        }
        return hG;
 }

    // function to handle pieChart.
 function pieChart(pD){
        var pC ={},    pieDim ={w:150, h: 150};
        pieDim.r = Math.min(pieDim.w, pieDim.h) / 2;

        // create svg for pie chart.
        var piesvg = d3.select(id).append("svg")
            .attr("width", pieDim.w).attr("height", pieDim.h).append("g")
            .attr("transform", "translate("+pieDim.w/2+","+pieDim.h/2+")");

        // create function to draw the arcs of the pie slices.
        var arc = d3.svg.arc().outerRadius(pieDim.r - 10).innerRadius(0);

        // create a function to compute the pie slice angles.
        var pie = d3.layout.pie().sort(null).value(function(d) { return d.freq; });

        // Draw the pie slices.
        piesvg.selectAll("path").data(pie(pD)).enter().append("path").attr("d", arc)
            .each(function(d) { this._current = d; })
            .style("fill", function(d) { return segColor(d.data.type); })
            .on("mouseover",mouseover).on("mouseout",mouseout);

        // create function to update pie-chart. This will be used by histogram.
        pC.update = function(nD){
            piesvg.selectAll("path").data(pie(nD)).transition().duration(500)
                .attrTween("d", arcTween);
        }
        // Utility function to be called on mouseover a pie slice.
        function mouseover(d){
            // call the update function of histogram with new data.
            hG.update(fData.map(function(v){
                return [v.Feature,v.freq[d.data.type]];}),segColor(d.data.type));
        }
        //Utility function to be called on mouseout a pie slice.
        function mouseout(d){
            // call the update function of histogram with all data.
            hG.update(fData.map(function(v){
                return [v.Feature,v.total];}), barColor);
        }
        // Animating the pie-slice requiring a custom function which specifies
        // how the intermediate paths should be drawn.
        function arcTween(a) {
            var i = d3.interpolate(this._current, a);
            this._current = i(0);
            return function(t) { return arc(i(t));    };
        }
        return pC;
 }

    // function to handle legend.
 function legend(lD){
        var leg = {};

        // create table for legend.
        var legend = d3.select(id).append("table").attr('class','legend');

        // create one row per segment.
        var tr = legend.append("tbody").selectAll("tr").data(lD).enter().append("tr");

        // create the first column for each segment.
        tr.append("td").append("svg").attr("width", '14').attr("height", '14').append("rect")
            .attr("width", '14').attr("height", '14')
			.attr("fill",function(d){ return segColor(d.type); });

        // create the second column for each segment.
        tr.append("td").text(function(d){ return d.type;});

        // create the third column for each segment.
        tr.append("td").attr("class",'legendFreq')
            .text(function(d){ return d3.format(",")(d.freq);});

        // create the fourth column for each segment.
        tr.append("td").attr("class",'legendPerc')
            .text(function(d){ return getLegend(d,lD);});

        // Utility function to be used to update the legend.
        leg.update = function(nD){
            // update the data attached to the row elements.
            var l = legend.select("tbody").selectAll("tr").data(nD);

            // update the frequencies.
            l.select(".legendFreq").text(function(d){ return d3.format(",")(d.freq);});

            // update the percentage column.
            l.select(".legendPerc").text(function(d){ return getLegend(d,nD);});
        }

        function getLegend(d,aD){ // Utility function to compute percentage.
            return d3.format("%")(d.freq/d3.sum(aD.map(function(v){ return v.freq; })));
        }

        return leg;
    }

    // calculate total frequency by segment for all state.
    var tF = ['pos','neg','neu'].map(function(d){
        return {type:d, freq: d3.sum(fData.map(function(t){ return t.freq[d];}))};
    });

    // calculate total frequency by state for all segment.
    var sF = fData.map(function(d){return [d.Feature,d.total];});

    var hG = histoGram(sF), // create the histogram.
        pC = pieChart(tF), // create the pie-chart.
        leg= legend(tF);  // create the legend.
}