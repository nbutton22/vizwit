var $ = require('jquery')
var Backbone = require('backbone')
var Card = require('./card')
var LoaderOn = require('../util/loader').on
var LoaderOff = require('../util/loader').off
;require('amcharts3')
;require('amcharts3/amcharts/serial')
;require('amcharts3/amcharts/themes/light')
;require('amcharts3/amcharts/plugins/responsive/responsive')
var AmCharts = window.AmCharts
AmCharts.path = './'

module.exports = Card.extend({
  settings: {},
  initialize: function (options) {
    Card.prototype.initialize.apply(this, arguments)

    // Save options to view
    this.vent = options.vent || null
    this.filteredCollection = options.filteredCollection || null

    // Listen to vent filters
    this.listenTo(this.vent, this.collection.getDataset() + '.filter', this.onFilter)

    // Listen to collection
    this.listenTo(this.collection, 'sync', this.render)
    this.listenTo(this.filteredCollection, 'sync', this.render)

    // Loading indicators
    this.listenTo(this.collection, 'request', LoaderOn)
    this.listenTo(this.collection, 'sync', LoaderOff)
    this.listenTo(this.filteredCollection, 'request', LoaderOn)
    this.listenTo(this.filteredCollection, 'sync', LoaderOff)

    // Set collection order if specified (necessary for datetime chart)
    if (this.settings.collectionOrder) this.collection.setOrder(this.settings.collectionOrder)

    // Fetch collection
    this.collection.fetch()
  },
  render: function () {
    // Initialize chart
    var config = $.extend(true, {}, this.settings.chart)
	if (this.settings.chart.type == "map") {
	  config.dataProvider = this.formatMapData(this.settings.limit)
	} else {
      config.dataProvider = this.formatChartData(this.settings.limit)
	}

	console.log(config)
    // Define the series/graph for the original amount
    if (this.settings.graphs) { config.graphs = [$.extend(true, {}, this.settings.graphs[0])] }

    // If there's a filtered amount, define the series/graph for it
    if (this.filteredCollection.getFilters().length) {
      // Change color of original graph to subdued
      config.graphs[0].lineColor = '#ddd'
      config.graphs[0].showBalloon = false

      config.graphs.push($.extend(true, {}, this.settings.graphs[1]))
    }

    if (this.settings.categoryAxis) { this.updateGuide(config) }


    // Initialize the chart
    this.chart = AmCharts.makeChart(null, config)

    this.chart.write(this.$('.card-content').get(0))
  },
  formatChartData: function (limit) {
    var self = this
    var chartData = []
    var records = limit ? new Backbone.Collection(this.collection.slice(0, limit)) : this.collection
    // Map collection(s) into format expected by chart library
    records.forEach(function (model) {
      var label = model.get('label')
      var data = {
        label: label,
        value: model.get('value'),
		sample_size: model.get('sample_size'),
		ci_low: model.get('ci_low'),
		ci_high: model.get('ci_high'),
		error: model.get('ci_high') - model.get('ci_low')
      }
      // If the filtered collection has been fetched, find the corresponding record and put it in another series
      if (self.filteredCollection.length) {
        var match = self.filteredCollection.get(label)
        // Push a record even if there's no match so we don't align w/ the wrong bar in the other collection
        data.filteredValue = match ? match.get('value') : 0
      }

      chartData.push(data)
    })
    return chartData
  },
  //Make collection for map chart
  formatMapData: function (limit) {
    var self = this
    var chartData = []
	var stateIDs = [
		"US-AL", "US-AK", "US-AZ", "US-AR", "US-CA", "US-CO", "US-CT", "US-DE", "US-FL", "US-GA",
		"US-HI", "US-ID", "US-IL", "US-IN", "US-IA", "US-KS", "US-KY", "US-LA", "US-ME", "US-MD",
		"US-MA", "US-MI", "US-MN", "US-MS", "US-MO", "US-MT", "US-NE", "US-NV", "US-NH", "US-NJ",
		"US-NM", "US-NY", "US-NC", "US-ND", "US-OH", "US-OK", "US-OR", "US-PA", "US-RI", "US-SC",
		"US-SD", "US-TN", "US-TX", "US-UT", "US-VT", "US-VA", "US-WA", "US-WV", "US-WI", "US-WY"
	]
    var records = limit ? new Backbone.Collection(this.collection.slice(0, limit)) : this.collection
    // Map collection(s) into format expected by chart library
	var i = 0
	var j = 0
    records.forEach(function (model) {
	  if (i != 2 && i != 3 && i != 10 && i != 13 && i != 42) {
		var label = model.get('label')
		var data = {
			label: label,
			id: stateIDs[j],
			value: model.get('value'),
			description: "<b>" + model.get('value') + "%</b><br>n: " + model.get('sample_size')
		}
		// If the filtered collection has been fetched, find the corresponding record and put it in another series
		if (self.filteredCollection.length) {
			var match = self.filteredCollection.get(label)
			// Push a record even if there's no match so we don't align w/ the wrong bar in the other collection
			data.filteredValue = match ? match.get('value') : 0
		}

		chartData.push(data)
		j++
	  }
	  i++
    })
	var dataProv = {
		map: 'usaLow',
		areas: chartData
	}
    return dataProv
  },  
  // Show guide on selected item or remove it if nothing's selected
  updateGuide: function (config) {
    var guide = config.categoryAxis.guides[0]
    var filter = this.filteredCollection.getFilters(this.filteredCollection.getTriggerField())
    if (filter) {
      if (config.categoryAxis.parseDates) {
        guide.date = filter.expression.value[0].value
        guide.toDate = filter.expression.value[1].value
      } else {
        guide.category = guide.toCategory = filter.expression.value
      }
    } else {
      if (guide.date) delete guide.date
      if (guide.toDate) delete guide.toDate
      if (guide.category) delete guide.category
    }
  },  
  // When a chart has been filtered
  onFilter: function (data) {
    // Add the filter to the filtered collection and fetch it with the filter
    this.filteredCollection.setFilter(data)
    this.renderFilters()
    this.filteredCollection.fetch()
  }
})
