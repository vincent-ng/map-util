const _ = require('lodash')
const $ = require('jquery')
require('bootstrap')
require('bootstrap/dist/css/bootstrap.css')
require('github-fork-ribbon-css/gh-fork-ribbon.css')
require('./main.css')

const html = require('html-loader!./index.html')
const loader = require('./loader')
const file = require('./file')
const mapManager = require('./map')

$(async () => {
	$('title').html('Map Util')
	const app = $('#brickyard-app')
	app.html(html)
	await mapManager.init('mapComponent')
	loader.init('loaderComponent')

	file.init('fileComponent')
	file.onRead = (sheets) => {
		const list = _.concat(..._.values(sheets)) // array of every record
		mapManager.resetSidebar()
		mapManager.setRenderList(list)
		$('#getGeoLocations')
			.off('click')
			.click(async () => {
				await mapManager.fetchGeoLocations()
				$('#infoComponent span').html(
					`, passed ${mapManager.passedDistrictCount} districts`,
				)
			})
		$('#quickGetGeoLocations')
			.off('click')
			.click(async () => {
				await mapManager.quickFetchGeoLocations()
				$('#infoComponent span').html(
					`, passed ${mapManager.passedDistrictCount} districts`,
				)
			})
		$('#exportFile')
			.off('click')
			.click(() => {
				file.exportFile(list, `locations${Date.now()}`)
			})
		$('#operations').show()
		$('#infoComponent')
			.html(
				`total distance: ${(mapManager.totalDistance / 1000).toFixed(
					2,
				)} km, active time: ${mapManager.activeHours} hours<span></span>`,
			)
			.show()
	}
})
