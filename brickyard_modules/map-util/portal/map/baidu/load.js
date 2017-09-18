if (typeof (window) === 'undefined') { window = { document: { location: { protocol: null } } } }
if (typeof (document) === 'undefined') { document = window.document }

let map_url
let css_url
const b_isHttps = document.location.protocol === 'https:'
const now = Date.now()
if (b_isHttps) {
	window.BMAP_PROTOCOL = 'https'
	map_url = `https://sapi.map.baidu.com/getscript?v=1.3&ak=&services=&t=${now}`
	css_url = 'https://sapi.map.baidu.com/res/13/bmaps.css'
} else {
	window.BMAP_PROTOCOL = 'http'
	map_url = `http://api.map.baidu.com/getscript?v=2.0&ak=IP0OO8wiWGlANXqlEoDOqwHW&services=&t=${now}`
	css_url = 'http://api.map.baidu.com/res/13/bmaps.css'
}

window.BMap_loadScriptTime = now
window.BMap = window.BMap || {}
window.BMap.apiLoad = function () {
	delete window.BMap.apiLoad
	if (typeof baiduloadedMapApi === 'function') { baiduloadedMapApi() }
}

const link = document.createElement('link')
link.setAttribute('rel', 'stylesheet')
link.setAttribute('type', 'text/css')
link.setAttribute('href', css_url)
document.head.appendChild(link)

module.exports = map_url
