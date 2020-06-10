const _ = require('lodash')
const $ = require('jquery')

// copy from qiji110
function radians(n) {
	return n * (Math.PI / 180)
}

function degrees(n) {
	return n * (180 / Math.PI)
}

function getBearing(sLat, sLong, eLat, eLong) {
	const startLat = radians(sLat)
	const startLong = radians(sLong)
	const endLat = radians(eLat)
	const endLong = radians(eLong)

	let dLong = endLong - startLong

	const dPhi = Math.log(Math.tan((endLat / 2.0) + (Math.PI / 4.0)) / Math.tan((startLat / 2.0) + (Math.PI / 4.0)))
	if (Math.abs(dLong) > Math.PI) {
		if (dLong > 0.0) {
			dLong = -(2.0 * Math.PI) + dLong
		} else {
			dLong = (2.0 * Math.PI) + dLong
		}
	}

	return (degrees(Math.atan2(dLong, dPhi)) + 360.0) % 360.0
}

function getBearingString(start, end) {
	const names = ['北', '东北', '东', '东南', '南', '西南', '西', '西北', '北']
	const d = getBearing(start.lat, start.lng, end.lat, end.lng)
	return names[Math.round(d / 45)] || '附近'
}

function calcAddressWithPOI(point, result) {
	let address = result.address
	if (result.surroundingPois.length > 0) {
		_.forEach(result.surroundingPois, (poi) => {
			poi.distance = BMap.Map.prototype.getDistance(point, poi.point)
		})
		result.surroundingPois.sort((a, b) => a.distance - b.distance)
		const poi_info = result.surroundingPois[0]
		address += `，${poi_info.title}`
		address += getBearingString(poi_info.point, point)
		if (poi_info.distance < 1) {
			address += '小于1米'
		} else {
			address += `${poi_info.distance.toFixed(0)}米`
		}
	}
	return address
}
//

function getGeoLocation(p) {
	return new Promise((resolve) => {
		this.geo.getLocation(p, (rs) => {
			const geo = _.pick(rs.addressComponents, 'province', 'city', 'district', 'street', 'streetNumber')
			geo.address = calcAddressWithPOI(p, rs)
			resolve(geo)
		})
	})
}

function initMap(elemID) {
	const mapObject = new BMap.Map(elemID, {
		enableHighResolution: true,
		minZoom: 5,
	})

	mapObject.centerAndZoom(new BMap.Point(116.404, 39.915), 11);  // 初始化地图,设置中心点坐标和地图级别
	mapObject.enableScrollWheelZoom(true)    // 开启鼠标滚轮缩放
	mapObject.enableInertialDragging()       // 启用地图惯性拖拽
	mapObject.enableContinuousZoom()         // 启用连续缩放效果
	// 添加带有定位的导航控件

	// 导航定位控件
	const navigationControl = new BMap.NavigationControl({
		// 靠左上角位置
		anchor: BMAP_ANCHOR_TOP_LEFT,
		// LARGE类型
		type: BMAP_NAVIGATION_CONTROL_LARGE
		// 启用显示定位
		// enableGeolocation: true
	})

	// 地图比例尺控件
	const scaleControl = new BMap.ScaleControl({ anchor: BMAP_ANCHOR_BOTTOM_LEFT })

	// 地图类型控件
	const mtc = new BMap.MapTypeControl({
		type: BMAP_MAPTYPE_CONTROL_HORIZONTAL,
		mapTypes: [BMAP_NORMAL_MAP, BMAP_SATELLITE_MAP, BMAP_PERSPECTIVE_MAP, BMAP_HYBRID_MAP]
	})

	mtc.setOffset(new BMap.Size(15, 10))

	// if (!noTrafficControl) {
	//     var trafficControl = new BMapLib.TrafficControl()
	//     trafficControl.setAnchor(BMAP_ANCHOR_BOTTOM_RIGHT)
	//     trafficControl.setOffset(new BMap.Size(15, 10))
	//     BMapInstance.addControl(trafficControl)
	// }

	mapObject.addControl(navigationControl)
	mapObject.addControl(scaleControl)
	mapObject.addControl(mtc)

	mapObject.geo = new BMap.Geocoder()
	mapObject.getGeoLocation = getGeoLocation

	return mapObject
}

module.exports.init = mapElementId => new Promise((resolve) => {
	if (document.location.protocol === 'https:') {
		window.HOST_TYPE = '2'
	}

	const mapUrl = `//api.map.baidu.com/getscript?v=2.0&ak=IP0OO8wiWGlANXqlEoDOqwHW&services=&t=${Date.now()}`
	$.getScript(mapUrl, () => resolve(initMap(mapElementId)))
})
