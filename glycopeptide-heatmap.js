Polymer({
    is: 'glycopeptide-heatmap',
    properties:{
        data: {
            type: Array,
            observer: '_dataChanged'
        },
        gridSize: {
            type: Number,
            value: 14
        },
        margin: {
            type: Array,
            value: { top: 400, right: 50, bottom: 20, left: 400}
        },
        sorting: {
            type: String,
            observer: '_sortObserver'
        }
    },
    attached: function() {
        if(this.data && this.data.map.length>0){
            var gridSize = this.gridSize,
                width = (this.gridSize*this.data.glycans.length),
                height = (this.gridSize*this.data.peptides.length)+30;

            var svg = d3.select(this).select("#chart").select("svg").remove();

            var svg = d3.select(this).select("#chart").append("svg")
                .attr("width", width + this.margin.left + this.margin.right)
                .attr("height", height + this.margin.top + this.margin.bottom)
                .append("g").attr("id", "main")
                .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

            this.createRowLabels();
            this.createColumnLabels();
            this.createCardsAndBar();
            this.sortByPpm();
        }
        this.formatChartDescription();
    },
    _dataChanged: function(newValue) {
        if (newValue){
            var svg = d3.select(this).select("#chart").select("svg").remove();
            this.$.sorting.querySelector('paper-menu').selected=0;
            this.$.fragmenterContainer.setAttribute("class", "hidden");
            this.attached();
        }
    },
    _sortObserver : function(value) {
        if (value == "ppm") {
            this.sortByPpm();
        }else if (value == "mass") {
            this.sortByMass();
        }else if (value == "sequence&composition") {
            this.sortBySequenceAndComposition();
        }
    },
    formatChartDescription: function(){
        var chartDescDiv = this.$.description;
        if(this.data){
            if(this.data.map.length!=0){
                chartDescDiv.innerHTML="<h3><b>"+this.data.map.length
                    +"</b> theoretical peptide + glycan combinations were found</h3>";
                this.$.sorting.setAttribute("class", "sort");
                this.$.comment.setAttribute("class", "");
                this.$.fragmenterContainer.removeAttribute("hidden");
            }else{
                chartDescDiv.innerHTML="<h3>Nothing found!</h3>";
                this.$.sorting.setAttribute("class", "sort hidden");
                this.$.comment.setAttribute("class", "hidden");
            }

        }
    },
    createRowLabels: function(){

        var svg = d3.select(this).select("#chart").select("svg").select("g");
        var peptides = this.data.peptides;
        var gridSize = this.gridSize;

        var self = this;
        var rowTip = d3.tip()
            .attr('class', 'd3-tip')
            .offset([-10, 0])
            .html(function(d) {
                self.$.ajax.url = "http://129.194.71.205:9000/proteins/"+d;
                self.$.ajax.generateRequest();
                if (self.proteins){
                    return 'Mass: <peptide-mass-calculator decimals=4 peptide="'+d+'"></peptide-mass-calculator> Da'
                        + "</br>Proteins: "+self.proteins;
                }else{
                    return 'Mass: <peptide-mass-calculator decimals=4 peptide="'+d+'"></peptide-mass-calculator>';
                }
            });
        svg.call(rowTip);

        var peptideLabels = svg.selectAll(".peptideLabel")
            .data(peptides)
            .enter().append("text")
            .text(function (d) { return d; })
            .attr("x", 0)
            .attr("y", function (d, i) { return i * gridSize; })
            .style("text-anchor", "end")
            .attr("transform", "translate(-10," + (gridSize-2) + ")")
            .attr("class", function (d,i) { return "peptideLabel mono r"+i;} )
            .on('mouseover', rowTip.show)
            .on('mouseout', rowTip.hide);
    },
    createColumnLabels: function(){
        var svg = d3.select(this).select("#chart").select("svg").selectAll("g");
        var glycans = this.data.glycans;
        var gridSize = this.gridSize;

        var self = this;
        var columnTip = d3.tip()
            .attr('class', 'd3-tip')
            .offset([-10, 0])
            .html(function(d) {
                return d+' (<glycan-mass-calculator decimals=4 glycan="'+d+'"></glycan-mass-calculator> Da)';
            });
        svg.call(columnTip);

        var glycanLabels = svg.selectAll(".glycanLabel")
            .style("text-anchor", "beginning")
            .data(glycans)
            .enter().append("text")
            .text(function(d) { return d; })
            .attr("x", 10)
            .attr("y", function(d, i) { return i * gridSize-8; })
            .attr("transform", "translate(20,-10)rotate(-90)")
            .attr("class",  function (d,i) { return "glycanLabel mono c"+i;} )
            .on('mouseover', columnTip.show)
            .on('mouseout', columnTip.hide);
    },
    createCardsAndBar: function(){

        var gridSize = this.gridSize,
            width = (this.gridSize*this.data.glycans.length),
            height = (this.gridSize*this.data.peptides.length)+30;


        var range = this.data.map.map(function(d){return d.value});
        var max = Math.max.apply(Math, range);
        var colorScale = d3.scale.linear().domain(d3.extent([0,Math.ceil(max / 10) * 10])).range(["green", "yellow"]);
        //var colorScale = d3.scale.linear().domain([0, max/2, max]).range(['green', 'white', 'yellow']);

        //color bar showing the ppm difference between glycan on the heatmap and query mass
        colorbar = Colorbar(0)
            .origin([180, 300])
            .scale(colorScale).barlength(this.margin.left-200).thickness(14)
            .orient("horizontal")
            .title("Match accuracy (ppm)");

        bar = d3.select(this).select("#chart").select("svg").append("g").attr("id", "colorbar");

        var svg = d3.select(this).select("#chart").select("svg").select("#main");
        var cards = svg.selectAll(".glycopeptide")
            .data(this.data.map, function(d) {return d.peptide+':'+d.glycan;});
        var gridSize = this.gridSize;
        cards.append("title");

        var self = this;
        var cardTip = d3.tip()
            .attr('class', 'd3-tip')
            .offset([-10, 0])
            .html(function(d) {
                d.mass = Number(d.mass);
                return self.data.peptides[d.peptide-1]+" + "+self.data.glycans[d.glycan-1]+" ("+d.mass.toFixed(4)+" Da)"
            });
        svg.call(cardTip);

        cards.enter().append("rect")
            .attr("x", function(d) { return (d.glycan-1)*gridSize})
            .attr("y", function(d) { return (d.peptide-1)*gridSize; })
            .attr("class", function(d){return "cell cell-border cr"+(d.peptide-1)+" cc"+(d.glycan-1);})
            .attr("rx", 3)
            .attr("ry", 3)
            .attr("width", this.gridSize-1)
            .attr("height", this.gridSize-1)
            .style("fill", function(d) { return colorScale(d.value); })
            .on("mouseover",function(d) {
                cardTip.show(d);
                pointer.pointTo(d[whichValue]);

            })
            .on("mouseout", function(d){
                //d3.select(this).classed("cell-hover",false);
                cardTip.hide(d);
            })
            .on("click",function (d) {
                var rowSelection = d3.selectAll(".peptideLabel").filter(".r"+(d.peptide-1));
                var columnSelection = d3.selectAll(".glycanLabel").filter(".c"+(d.glycan-1));

                if(d3.select(this).classed("cell-hover")){
                    d3.select(this).classed("cell-hover",false);
                    var test = d3.selectAll(".cell-hover").filter(".cr"+(d.peptide-1));
                    if(d3.selectAll(".cell-hover").filter(".cr"+(d.peptide-1)).size() == 0){
                        rowSelection.classed("text-highlight",false);
                    }
                    if(d3.selectAll(".cell-hover").filter(".cc"+(d.glycan-1)).size() == 0){
                        columnSelection.classed("text-highlight",false);
                    }
                } else {
                    d3.select(this).classed("cell-hover",true);
                    columnSelection.classed("text-highlight",true);
                    rowSelection.classed("text-highlight",true);
                    d3.select(self).select("peptide-fragmenter").attr("peptide",self.data.peptides[d.peptide-1]);
                    d3.select(self).select("#fragmenterContainer").attr("class", "description");
                }
            });

        var whichValue = "value"
        var t = svg.transition().duration(1000);

        cards.select("title").text(function(d) { return d.value; });

        cards.exit().remove();

        var pointer = d3.select(this).select("#colorbar").call(colorbar);
    },
    sortBySequenceAndComposition: function(){
        // don't operate on this.gridSize
        // it will destroy the chart
        var gridSize = this.gridSize;

        var svg = d3.select(this).select("#chart").select("svg");
        var t = svg.transition().duration(1000);

        var sortedGlycans = this.data.glycans.slice(0).sort();
        idx =0;
        for (var i=0; i<this.data.glycans.length; i++){
            glycan = this.data.glycans[i];
            sIdx = this.inArray(glycan, sortedGlycans);
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
            sIdx = this.inArray(peptide, sortedPeptides);
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
    },
    sortByMass: function(){
        // don't operate on this.gridSize
        // it will destroy the chart
        var gridSize = this.gridSize;

        var svg = d3.select(this).select("#chart").select("svg");
        var t = svg.transition().duration(1000);

        var peptideMassCalc = this.$.peptideMassCalc;
        var peptideMasses = {};
        for (var pep in this.data.peptides){
            peptideMassCalc.peptide = this.data.peptides[pep].toString();
            peptideMasses[this.data.peptides[pep]] = peptideMassCalc.mass;
        }
        var sortedPeptides = Object.keys(peptideMasses).sort(function(a,b){return peptideMasses[a]-peptideMasses[b]});
        idx =0;
        for (var i=0; i<this.data.peptides.length; i++){
            peptide = this.data.peptides[i].toString();
            sIdx = this.inArray(peptide, sortedPeptides);
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

        var glycanMassCalc = this.$.glycanMassCalc;
        var glycanMasses = {};
        for (var glycan in this.data.glycans){
            glycanMassCalc.glycan = this.data.glycans[glycan]
            glycanMasses[this.data.glycans[glycan]] = glycanMassCalc.mass;
        }
        var sortedGlycans = Object.keys(glycanMasses).sort(function(a,b){return glycanMasses[a]-glycanMasses[b]});
        idx =0;
        for (var i=0; i<this.data.glycans.length; i++){
            glycan = this.data.glycans[i];
            sIdx = this.inArray(glycan, sortedGlycans);
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
    },
    sortByPpm: function() {
        // don't operate on this.gridSize
        // it will destroy the chart
        var gridSize = this.gridSize;

        var svg = d3.select(this).select("#chart").select("svg");
        var t = svg.transition().duration(1000);

        var peptidePpms = {};
        var glycanPpms = {};
        for (var i in this.data.map){
            console.log(this.data.peptides[this.data.map[i].peptide-1]);
            if (this.inArray(this.data.peptides[this.data.map[i].peptide-1].toString(),Object.keys(peptidePpms))<0
                || peptidePpms[this.data.peptides[this.data.map[i].peptide-1].toString()]>this.data.map[i].value){
                peptidePpms[this.data.peptides[this.data.map[i].peptide-1].toString()] = this.data.map[i].value;
            }
            if (this.inArray(this.data.glycans[this.data.map[i].glycan-1],Object.keys(glycanPpms))<0
                || glycanPpms[this.data.glycans[this.data.map[i].glycan-1]]>this.data.map[i].value){
                glycanPpms[this.data.glycans[this.data.map[i].glycan-1]] = this.data.map[i].value;
            }
        }
        var sortedPeptides = Object.keys(peptidePpms).sort(function(a,b){return peptidePpms[a]-peptidePpms[b]});
        idx =0;
        for (var i=0; i<this.data.peptides.length; i++){
            peptide = this.data.peptides[i].toString();
            sIdx = this.inArray(peptide, sortedPeptides);
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
        var sortedGlycans = Object.keys(glycanPpms).sort(function(a,b){return glycanPpms[a]-glycanPpms[b]});
        idx =0;
        for (var i=0; i<this.data.glycans.length; i++){
            glycan = this.data.glycans[i];
            sIdx = this.inArray(glycan, sortedGlycans);
            var shift = sIdx-idx;
            t.selectAll("rect.cc"+idx)
                .attr("x", function(d, i) {
                    return sIdx * gridSize;
                });
            t.selectAll(".c"+idx)
                .attr("y", function(d, i) {
                    return sIdx * gridSize-8;
                });
            idx+=1;
        }
    },
    handleResponse: function(request) {
        response = request.detail.response;
        this.proteins = response.map;
    },
    handleErrorResponse: function(request) {
        this.proteins = '';
    },
    inArray: function( elem, array ) {
        if ( array.indexOf ) {
            return array.indexOf( elem );
        }

        for ( var i = 0, length = array.length; i < length; i++ ) {
            if ( array[ i ] === elem ) {
                return i;
            }
        }

        return -1;
    }

});