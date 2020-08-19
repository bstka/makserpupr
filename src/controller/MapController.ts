import { ParsedUrlQuery } from 'querystring';
import PGbase from "../database/PGbase";
import Cache from "../utils/Cache";
import { IncomingHttpHeaders } from "http";
import Validation from "../utils/validation/Validation";

interface dataRequest {
    trimmedPath :string,
    queryStringObject :ParsedUrlQuery,
    method :string,
    headers :IncomingHttpHeaders,
    payload :any
}

export default class MapController {
    public static async initpage(data :dataRequest, callback) {
        const acceptedMethod = "GET";
        if (data.method.toUpperCase() === acceptedMethod) {
            const initCache = Cache.GetCache("initPage")
            if (initCache === undefined) {
                try {
                    const katalog = await PGbase.PGclient.query("SELECT * FROM grouplayer where id_parent='0' order by id");
                    const skala = await PGbase.PGclient.query("SELECT * FROM skala");
                    const provinsi = await PGbase.PGclient.query("SELECT * FROM provinsi order by kodeprovinsi");
                    const basemap = await PGbase.PGclient.query("SELECT * FROM basemap ORDER BY id");
                    const layer = await PGbase.PGclient.query("SELECT * FROM layer ORDER BY kodelayer");
                    const subgroup = await PGbase.PGclient.query("SELECT * FROM grouplayer");
                    const result = { katalog: katalog.rows, subgroup: subgroup.rows ,skala: skala.rows, provinsi: provinsi.rows, basemap: basemap.rows, layer: layer.rows }
                    Cache.SetCache("initPage", result)
                    callback(200, result)
                } catch (error) {
                    callback(500, error)   
                }
            } else {
                callback(200, initCache);
            }
        } else {
            callback(404, {error: "Page Not Found"})
        }
    }

    public static async searchKatalog(data :dataRequest, callback) {
        const acceptedMethod = "POST";
        if (data.method.toUpperCase() === acceptedMethod) {
            let finalSql;
            let skalaSql;
            let provinsiSql;
            let id_nums;

            const { value, error } = Validation.searchKatalog(data.payload)
            const groupData = await PGbase.PGclient.query("SELECT * FROM grouplayer")

            value.skalapeta > 0 ? skalaSql = "AND skala="  + value.skalapeta + " " : skalaSql = ""
            value.provinsi > 0 ? provinsiSql = "AND id_provinsi=" + value.provinsi + " " : provinsiSql = ""

            if (typeof(error) === "undefined") {
                if ( value.idgrouplayer > 0) {
                    if ( value.subgroup > 0) {
                        finalSql = "SELECT * FROM petakatalog WHERE id_grouplayer in( SELECT id FROM grouplayer WHERE grouplayer.id in( SELECT id FROM grouplayer WHERE id_parent= "+ value.idgrouplayer +" ) AND id= "+ value.subgroup +" ) AND UPPER(namapetakatalog) LIKE '%"+ value.search +"%' " + skalaSql +  provinsiSql
                    } else {
                        const arrayGroup = [];
                        for (let index = 0; index <= groupData.rowCount -1; index++) {
                            if (value.idgrouplayer == groupData.rows[index]['id_parent']) {
                                arrayGroup.push(groupData.rows[index]['id'])
                            }
                        }
                        arrayGroup.push(value.idgrouplayer);
                        id_nums = arrayGroup.join(", ");
                        finalSql = "SELECT id,kodepetakatalog,namapetakatalog,id_provinsi,skala,thumbnail,x_min,y_min,x_max,y_max,id_grouplayer FROM petakatalog WHERE UPPER(namapetakatalog) LIKE '%"+ value.search +"%' AND id_grouplayer in( "+ id_nums +" )" + skalaSql + provinsiSql
                    }
                } else {
                    finalSql = "SELECT id,kodepetakatalog,namapetakatalog,id_provinsi,skala,thumbnail,x_min,y_min,x_max,y_max,id_grouplayer FROM petakatalog WHERE UPPER(namapetakatalog) LIKE '%"+ value.search +"%' " + skalaSql + provinsiSql + " ORDER BY id"
                }

                try {
                    const finalData = await PGbase.PGclient.query(finalSql);
                    callback(200, { data: finalData.rows })
                } catch (errors) {
                    callback(500, { error: "error", any: [ error ] })
                }
            } else {
                callback(403, { error: "Special Chars Not Allowed", h: error })
            }
        } else {
            callback(404, { error: "page not found" })
        }
    }

    public static async getMetadata(data :dataRequest, callback) {
        const acceptedMethod = "POST";
        if (data.method.toUpperCase() === acceptedMethod) {
            const { value, error } = Validation.getMetadata(data.payload);
            if (typeof(error) === "undefined") {
                const metadata = await PGbase.PGclient.query("SELECT namapetakatalog, lokasi, tahun, pembuatpeta, jenispeta, sensor, tanggalperekaman FROM petakatalog WHERE kodepetakatalog =$1::text", [value.kodepeta])
                callback(200, { data: metadata.rows })
            } else {
                console.log(error)
                callback(405, { error: "does not accept special chars" })
            }
        } else [
            callback(404, {error: "page not found"})
        ]
    }

    public static async testA(data :dataRequest, callback) {
        const acceptedMethod = "POST";
        if (data.method.toUpperCase() === acceptedMethod) {
            callback(200, { a: "ehhehe" })
        }
    }
}