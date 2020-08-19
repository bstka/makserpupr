import { memoryUsage } from "process";
import PGbase from "../database/PGbase";

export default class InitController {
    public static async hello(data, callback) {
        await PGbase.PGclient.query("SELECT * FROM grouplayer where id_parent='0' order by id", (err, { rows }) => {
            if (err) {
                callback(500, err)
            } else {
                callback(200, rows)
            }
        });
    }
}