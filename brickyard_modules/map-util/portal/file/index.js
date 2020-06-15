const fileSaver = require('file-saver')
const XLSX = require('xlsx')
const spinner = require('../loader')
const FileDragReader = require('@brickyard/webpack-file-drag-reader')

const handler = {}
handler.onRead = () => {
	throw new Error('onRead handler not set')
}

let _counter = 1
const xlsxToObj = async ({ data, file }) => {
	const workbook = XLSX.read(data, {
		type: 'binary',
		cellText: false,
		cellDates: true,
	})
	const result = {}

	for (let index = 0; index < workbook.SheetNames.length; index++) {
		const sheetName = workbook.SheetNames[index]
		const roa = XLSX.utils.sheet_to_row_object_array(
			workbook.Sheets[sheetName],
			{ dateNF: 'YYYY-MM-DD HH:mm:ss' },
		)
		if (roa.length > 0) {
			result[sheetName] = roa
			result[sheetName].fileName = file.name.split('.')[0]

			console.log(_counter++, result[sheetName].fileName)
			await handler.onRead(result)
		}
	}

	// workbook.SheetNames.forEach((sheetName) => {
	// 	const roa = XLSX.utils.sheet_to_row_object_array(
	// 		workbook.Sheets[sheetName],
	// 		{ dateNF: 'YYYY-MM-DD HH:mm:ss' },
	// 	)
	// 	if (roa.length > 0) {
	// 		result[sheetName] = roa
	// 		result[sheetName].fileName = file.name.split('.')[0]
	// 		console.log(result[sheetName].fileName, _i++)
	// 	}
	// })
	// handler.onRead(result)
}

function init(elementId) {
	const reader = new FileDragReader(elementId, { readAs: 'BinaryString' })
	reader.onRead('start', () => spinner.showSpinner())
	reader.onRead('end', () => spinner.hideSpinner())
	// reader.onRead('file', xlsxToObj)
	reader.onRead('files', async (files) => {
		// 1. 传入的 files 是文件数组，需要将它们转为 obj 数组，再调用 onReadFiles
		// 2. 在 onReadFiles 中直接请求百度地图 api，用 for await 即可
		// 3. 将请求到的数据和原本计算得到的路程、时间一同打印到控制台中

		console.log(`files length: ${files.length}`)

		for (let index = 0; index < files.length; index++) {
			const file = files[index]
			await xlsxToObj(file)
		}

		console.log('==================== FIN ====================')
	})
}

function s2ab(s) {
	let buf
	let view
	if (typeof ArrayBuffer !== 'undefined') {
		buf = new ArrayBuffer(s.length)
		view = new Uint8Array(buf)
	} else {
		buf = new Array(s.length)
		view = buf
	}
	for (let i = 0; i !== s.length; i += 1) {
		view[i] = s.charCodeAt(i) & 0xff
	}
	return buf
}

function exportFile(objectList, fileName, type = 'xlsx') {
	const wb = XLSX.utils.book_new()
	const ws = XLSX.utils.json_to_sheet(objectList)
	XLSX.utils.book_append_sheet(wb, ws, 'sheet')
	const wbout = XLSX.write(wb, {
		bookType: type,
		bookSST: true,
		type: 'binary',
	})
	fileSaver.saveAs(
		new Blob([s2ab(wbout)], { type: 'application/octet-stream' }),
		`${fileName}.${type}`,
	)
}

handler.init = init
handler.exportFile = exportFile
module.exports = handler
