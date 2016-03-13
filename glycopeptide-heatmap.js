Polymer({
    is: 'glycopeptide-heatmap',
    properties:{
        data: {
            type: Array,
            observer: '_dataChanged'
        },
        gridSize: {
            type: Number,
            value: 14},
        margin: {
            type: Array,
            value: { top: 100, right: 100, bottom: 50, left: 100}},
        sorting: {
            type: String,
            observer: '_sortObserver'
        }
    },
    attached: function() {
        if(this.data){
            var gridSize = this.gridSize,
                width = (this.gridSize*this.data.glycans.length),
                height = (this.gridSize*this.data.peptides.length)+30;

            //var svg = d3.selectAll("svg").remove();

            var svg = d3.select("#chart").append("svg")
                .attr("width", width + this.margin.left + this.margin.right)
                .attr("height", height + this.margin.top + this.margin.bottom)
                .append("g").attr("id", "main")
                .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

            this.createRowLabels();
            this.createColumnLabels();
            this.createCardsAndBar();
            this.formatChartDescription();
        }
    },
    _dataChanged: function(newValue) {
        if (newValue){
            var svg = d3.select("svg").remove();
            this.attached();
        }
    },
    _sortObserver : function(value) {
        if (value == "sequence&composition") {
            this.sortBySequenceAndComposition();
        }
    },
    formatChartDescription: function(){
        var dataPoints = this.data.map;
        if(dataPoints.length!=0){
            var chartDescDiv = document.getElementById("description");
            chartDescDiv.innerHTML="</br><strong>"+dataPoints.length
                +"</strong> theoretical N-glycopeptide combinations were found</br>";
        }else{
            var nothingFound = document.createElement('strong');
            nothingFound.textContent("Nothing found!");
            chartDescDiv.appendChild(nothingFound);
        }
    },
    createRowLabels: function(){

        var svg = d3.selectAll("svg").selectAll("g");//.select("#main");
        var peptides = this.data.peptides;
        var gridSize = this.gridSize;

        var tip = d3.tip()
            .attr('class', 'd3-tip')
            .offset([-10, 0])
            .html(function(d) {
                $(".d3-tip").append("mock");
                //return ajaxPeptide2Protein(d);
            });
        svg.call(tip);

        //var peptideSortOrder=false;
        var peptideLabels = svg.selectAll(".peptideLabel")
            .data(peptides)
            .enter().append("text")
            .text(function (d) { return d; })
            .attr("x", 0)
            .attr("y", function (d, i) { return i * gridSize; })
            .style("text-anchor", "end")
            .attr("transform", "translate(-10," + (gridSize-2) + ")")
            .attr("class", function (d,i) { return "peptideLabel mono r"+i;} )
            .on('mouseover', tip.show)
            .on('mouseout', tip.hide);
    },
    createColumnLabels: function(){
        var svg = d3.selectAll("svg").selectAll("g");//.select("#main");
        var glycans = this.data.glycans;
        var gridSize = this.gridSize;

        //var colSortOrder=false;
        var glycanLabels = svg.selectAll(".glycanLabel")
            .style("text-anchor", "beginning")
            .data(glycans)
            .enter().append("text")
            .text(function(d) { return d; })
            .attr("x", 10)
            .attr("y", function(d, i) { return i * gridSize-8; })
            .attr("transform", "translate(20,-10)rotate(-90)")
            .attr("class",  function (d,i) { return "glycanLabel mono c"+i;} );
    },
    createCardsAndBar: function(){

        var gridSize = this.gridSize,
            width = (this.gridSize*this.data.glycans.length),
            height = (this.gridSize*this.data.peptides.length)+30;

        var range = this.data.map.map(function(d){return d.value});
        var colorScale = d3.scale.linear().domain(d3.extent(range)).range(["green", "yellow"]);

        //color bar showing the ppm difference between glycan on the heatmap and query mass
        colorbar = Colorbar()
            .origin([this.margin.left+width+this.margin.right-30, this.margin.top-70])
            .scale(colorScale).barlength(height+50).thickness(14)
            .orient("vertical")
            .title("ppm accuracy");

        bar = d3.selectAll("svg").append("g").attr("id", "colorbar");
        d3.selectAll(".colorbar").append("text").text("match accuracy")
            .attr('class', 'barTitle');
        $("#legend").append('ppm accuracy');


        var svg = d3.select("#chart").select("svg").select("#main");
        var cards = svg.selectAll(".glycopeptide")
            .data(this.data.map, function(d) {return d.peptide+':'+d.glycan;});
        var gridSize = this.gridSize;

        cards.append("title");

        cards.enter().append("rect")
            .attr("x", function(d) { return (d.glycan-1)*gridSize})
            .attr("y", function(d) { return (d.peptide-1)*gridSize; })
            .attr("class", function(d){return "cell cell-border cr"+(d.peptide-1)+" cc"+(d.glycan-1);})
            .attr("rx", 3)
            .attr("ry", 3)
            .attr("width", this.gridSize-1)
            .attr("height", this.gridSize-1)
            .style("fill", "white")
            .on("click", function(d){
                //highlight text
                d3.select(this).classed("cell-hover",true);
                d3.selectAll(".peptideLabel").classed("text-highlight",function(r,ri){ return ri==(d.peptide-1);});
                d3.selectAll(".glycanLabel").classed("text-highlight",function(c,ci){ return ci==(d.glycan-1);});

                //Update the tooltip position and value
                d3.select("#tooltip")
                    .style("left", (d3.event.pageX+10) + "px")
                    .style("top", (d3.event.pageY-10) + "px")
                    .select("#value")
                    .text("works");
                //.text(peptides[d.peptide-1]+" + "+glycans[d.glycan-1]+" ("+Math.round(d.mass,4)+" Da)");
                //Show the tooltip
                d3.select("#tooltip").classed("hidden", false);
            })
            .on("mouseout", function(){
                d3.select(this).classed("cell-hover",false);
                d3.selectAll(".peptideLabel").classed("text-highlight",false);
                d3.selectAll(".glycanLabel").classed("text-highlight",false);
                d3.select("#tooltip").classed("hidden", true);
            });

        var whichValue = "value"

        cards.transition().duration(100)
            .style("fill", function(d) { return colorScale(d.value); });

        cards.select("title").text(function(d) { return d.value; });

        cards.exit().remove();

        var pointer = d3.selectAll("#colorbar").call(colorbar);

        cards.on("mouseover",function(d) {pointer.pointTo(d[whichValue])});
    },
    ajaxPeptideToProtein: function() {
      // generate ajax request that will return uniprot ID for peptide
    },
    sortBySequenceAndComposition: function(){

        // don't operate on this.gridSize
        // it will destroy the chart
        var gridSize = this.gridSize;

        var svg = d3.selectAll("svg");
        var t = svg.transition().duration(1000);

        var sortedGlycans = this.data.glycans.slice(0).sort();
        idx =0;
        for (var i=0; i<this.data.glycans.length; i++){
            glycan = this.data.glycans[i];
            sIdx = jQuery.inArray(glycan, sortedGlycans);
            var shift = sIdx-idx;
            t.selectAll("rect.cc"+idx)
                .attr("x", function(d, i) {
                    return sIdx * gridSize;
                });
            t.selectAll(".c"+idx)
                .attr("y", function(d, i) {
                    return sIdx * gridSize-8;
                })
            idx+=1;
        }

        var sortedPeptides = this.data.peptides.slice(0).sort();
        idx =0;
        for (var i=0; i<this.data.peptides.length; i++){
            peptide = this.data.peptides[i];
            sIdx = jQuery.inArray(peptide, sortedPeptides);
            t.selectAll(".cr"+idx)
                .attr("y", function(d,i) {
                    return sIdx * gridSize;
                });
            t.selectAll(".r"+idx)
                .attr("y", function(d, i) {
                    return sIdx * gridSize-2;
                })
                .attr("transform", function(d, i) {
                    return "translate(-10," + gridSize + ")";
                });
            idx+=1;
        }
    }

});

