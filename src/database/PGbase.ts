import { Client, Pool } from "pg";
import Config from "../Config";

export default class PGbase {
    static PGclient :Client = new Client(Config.PGConfig);
    static PGpool :Pool = new Pool(Config.PGConfig);
}