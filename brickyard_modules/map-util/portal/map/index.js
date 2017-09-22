require('./main.css')
const _ = require('lodash')
const html = require('html-loader!./index.html')
const sidebarTemplate = _.template(require('html-loader!./sidebar.html'))
const baidu = require('./baidu')
const coordtransform = require('coordtransform')
const progressBar = require('../loader')

function normalize(v) {
	const n = Number(v)
	return (n >= -180 && n <= 180) ? n : n / 3600000
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

class MapManager {
	constructor() {
		this.mapInst = undefined
		this.renderList = []
		this.renderPoints = []
		this.lastClickSidebarPointIndex = undefined
	}

	async init(elementId) {
		const e = document.getElementById(elementId)
		e.innerHTML = html
		this.mapInst = await baidu.init('map')
	}

	setRenderList(list) {
		this.renderList = list
		this.renderPoints = []
		for (let i = 0; i < this.renderList.length; i += 1) {
			const point = getMapPoint(this.renderList[i])
			if (point) {
				point.index = i
				this.renderPoints.push(point)
			}
		}

		const options = {
			size: BMAP_POINT_SIZE_BIGGER,
			shape: BMAP_POINT_SHAPE_STAR,
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
		const setProgress = _.debounce(progressBar.setProgress, 250, { trailing: true, maxWait: 250 })
		for (let i = 0; i < this.renderPoints.length; i += 1) {
			const p = this.renderPoints[i]
			const address = await this.mapInst.getGeoLocation(p)
			const data = this.renderList[p.index]
			_.assign(data, address)
			if (this.lastClickSidebarPointIndex === p.index) {
				renderSidebar(data)
			}
			setProgress(Math.ceil((i / this.renderPoints.length) * 100))
		}
		setProgress(100)
		progressBar.hideProgressBar()
	}
}

module.exports = new MapManager()
