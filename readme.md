# map util

## This tool can

* Parse an excel file with location fields
* Display geo points in baidu map
* Display all fields in a sidebar
* Parse the address of the geo points
* Export the result as a xslx file

## Excel file

Upload a csv or xlsx file with a format like

| Field A | Field B | ... | latitude | longitude | ... | Field N |
| ---- | ---- | ---- | ---- | ---- | ---- | ---- |
| Data A | Data B | ... | latValue | lngValue | ... | Data N |

About corrdinate
* latitude, longitude are WGS84 coordinate
* clatitude, clongitude are BD09 coordinate
* latValue and lngValue can use degree or millisecond unit
* providing one coordinate is ok
* BD09 will be used if both coordinates are provided

About field names
* field names are case insensitive
* latitude field name can be: lat, latitude, '纬度'
* longitude filed name can be: lng, lon, longitude, '经度'
* clatitude field name can be: clat, clatitude, '偏转纬度'
* clongitude filed name can be: clng, clon, clongitude, '偏转经度'

## Use online

[map util website](https://vincentngthu.github.io/map-util)
