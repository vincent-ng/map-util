require('./main.css')
const _ = require('lodash')
const moment = require('moment')
const html = require('html-loader!./index.html')
const sidebarTemplate = _.template(require('html-loader!./sidebar.html'))
const baidu = require('./baidu')
const coordtransform = require('coordtransform')
const progressBar = require('../loader')

function normalize(v) {
	const n = Number(v)
	return n >= -180 && n <= 180 ? n : n / 3600000
}

function pick(obj, ...fields) {
	for (const k of _.keys(obj)) {
		if (fields.includes(k.toLowerCase())) {
			return obj[k]
		}
	}
	return null
}

function getMapPoint(p) {
	if (!p) {
		return null
	}
	const clng = normalize(pick(p, 'clng', 'clon', 'clongitude', '偏转经度'))
	const clat = normalize(pick(p, 'clat', 'clatitude', '偏转纬度'))
	if (clng && clat) {
		// console.log('bd09', clng, clat)
		return new BMap.Point(clng, clat)
	}
	const lng = normalize(pick(p, 'lng', 'lon', 'longitude', '经度'))
	const lat = normalize(pick(p, 'lat', 'latitude', '纬度'))
	if (lng && lat) {
		let coord = coordtransform.wgs84togcj02(lng, lat)
		coord = coordtransform.gcj02tobd09(coord[0], coord[1])
		// console.log('wgs 2 bd09', ...coord)
		return new BMap.Point(...coord)
	}
	return null
}

function renderSidebar(data) {
	const sidebar = document.getElementById('sidebar')
	sidebar.innerHTML = sidebarTemplate({ data })
}

function toRadians(n) {
	return (n * Math.PI) / 180
}

function distanceSimplify(start, end) {
	// https://tech.meituan.com/2014/09/05/lucene-distance.html
	const dx = start.lng - end.lng
	const dy = start.lat - end.lat
	const meanLat = (start.lat + end.lat) / 2
	const xDistance = toRadians(dx) * 6367000 * Math.cos(toRadians(meanLat))
	const yDistance = 6367000 * toRadians(dy)
	return (xDistance ** 2 + yDistance ** 2) ** 0.5
}

// const testPoints = [
// 	[
// 		{
// 			lng: 116.45,
// 			lat: 39.941,
// 		},
// 		{
// 			lng: 116.451,
// 			lat: 39.94,
// 		},
// 		140.028516722523,
// 	],
// 	[
// 		{
// 			lng: 116.45,
// 			lat: 39.96,
// 		},
// 		{
// 			lng: 116.4,
// 			lat: 39.94,
// 		},
// 		4804.42126283918,
// 	],
// 	[
// 		{
// 			lng: 116.45,
// 			lat: 39.96,
// 		},
// 		{
// 			lng: 117.3,
// 			lat: 39.94,
// 		},
// 		72444.815518822,
// 	],
// 	[
// 		{
// 			lng: 115.25,
// 			lat: 39.26,
// 		},
// 		{
// 			lng: 117.3,
// 			lat: 41.04,
// 		},
// 		263525.616783986,
// 	],
// 	[
// 		{
// 			lng: 1,
// 			lat: 1,
// 		},
// 		{
// 			lng: 2,
// 			lat: 2,
// 		},
// 		157127,
// 	],
// ]
// testPoints.forEach((pair) => {
// 	console.log(distanceSimplify(pair[0], pair[1]) - pair[2])
// })

class MapManager {
	constructor() {
		this.mapInst = undefined
		this.renderList = []
		this.renderPoints = []
		this.lastClickSidebarPointIndex = undefined
		this.totalDistance = 0
		this.activeHours = 0
		this.passedDistrict = []
	}

	async init(elementId) {
		const e = document.getElementById(elementId)
		e.innerHTML = html
		this.mapInst = await baidu.init('map')
	}

	setRenderList(list) {
		this.renderList = list
		this.renderPoints = list.map((value, index) => {
			const point = getMapPoint(value)
			if (point) {
				point.index = index
			}
			return point
		})
		this.totalDistance = this.renderPoints
			.map((point, index) => {
				if (index) {
					return distanceSimplify(this.renderPoints[index - 1], point)
				}
				return 0
			})
			.reduce((prev, curr) => prev + curr, 0)

		const group = _.groupBy(list, 'district')
		delete group.undefined
		this.passedDistrict = _.keys(group)

		const activePoints = list
			.filter((record) => record.category === '1')
			.map((record) => {
				const tempMoment = moment(record.timestamp)
				record.active_hour = tempMoment.format('YYYY-MM-DD HH')
				return record
			})
		this.activeHours = _.keys(_.groupBy(activePoints, 'active_hour')).length

		const options = {
			size: BMAP_POINT_SIZE_SMALL,
			shape: BMAP_POINT_SHAPE_CIRCLE,
			color: '#d340c3',
		}
		const pointCollection = new BMap.PointCollection(this.renderPoints, options)
		pointCollection.addEventListener('click', (e) => {
			this.lastClickSidebarPointIndex = e.point.index
			renderSidebar(this.renderList[e.point.index])
		})
		this.mapInst.addOverlay(pointCollection)

		this.mapInst.setViewport(this.renderPoints, {
			zoomFactor: -1,
			delay: 200,
		})
	}

	resetSidebar() {
		this.lastClickSidebarPointIndex = undefined
		renderSidebar({ '': 'Select marker to view info' })
	}

	async fetchGeoLocations() {
		progressBar.showProgressBar()
		progressBar.setProgress(0)
		const setProgress = _.debounce(progressBar.setProgress, 250, {
			trailing: true,
			maxWait: 250,
		})

		for (let i = 0; i < this.renderPoints.length; i += 1) {
			const p = this.renderPoints[i]
			const address = await this.mapInst.getGeoLocation(p)
			setProgress(Math.ceil((i / this.renderPoints.length) * 100))

			const data = this.renderList[p.index]
			Object.assign(data, address)
			if (this.lastClickSidebarPointIndex === p.index) {
				renderSidebar(data)
			}
		}

		setProgress(100)
		progressBar.hideProgressBar()

		const group = _.groupBy(this.renderList, 'district')
		this.passedDistrict = _.keys(group)
	}

	async quickFetchGeoLocations() {
		progressBar.showProgressBar()
		progressBar.setProgress(0)
		const setProgress = _.debounce(progressBar.setProgress, 250, {
			trailing: true,
			maxWait: 250,
		})

		const firstPoint = _.cloneDeep(this.renderPoints[0])
		const firstAddress = await this.mapInst.getGeoLocation(firstPoint)
		const checkpoints = [Object.assign(firstPoint, firstAddress)]

		for (let i = 0; i < this.renderPoints.length; i += 1) {
			const p = _.cloneDeep(this.renderPoints[i])
			if (distanceSimplify(checkpoints[checkpoints.length - 1], p) > 5000) {
				const address = await this.mapInst.getGeoLocation(p)
				await new Promise((reslove) => {
					setTimeout(reslove, 100)
				})
				checkpoints.push(Object.assign(p, address))

				const data = this.renderList[p.index]
				Object.assign(data, address)
				if (this.lastClickSidebarPointIndex === p.index) {
					renderSidebar(data)
				}
			}

			setProgress(Math.ceil((i / this.renderPoints.length) * 100))
		}

		setProgress(100)
		progressBar.hideProgressBar()

		const group = _.groupBy(checkpoints, 'district')
		this.passedDistrict = _.keys(group)
	}
}

module.exports = new MapManager()
