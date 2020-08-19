import {
    createServer as httpServer, IncomingMessage, OutgoingMessage, IncomingHttpHeaders, ServerResponse,
} from 'http';
import { createServer as httpsServer, ServerOptions } from 'https';
import { Readable, Writable } from 'stream';
import { parse, UrlWithParsedQuery } from 'url';
import { ParsedUrlQuery } from 'querystring';
import { StringDecoder } from 'string_decoder';
import Config from './Config';
import Routes from "./Routes";
import { log, error } from "console";
import { readFileSync } from "fs";
import { join } from "path";
import Helper from "./utils/Helper";
import PGbase from "./database/PGbase";

interface Request extends Readable, IncomingMessage { }
interface Response extends Writable, OutgoingMessage, ServerResponse { }

export default class Server {

    private readonly HttpsServerKeys: ServerOptions = {
        key: readFileSync(join(__dirname, '../key/key.pem')),
        cert: readFileSync(join(__dirname, '../key/cert.pem'))
    }

    private HttpsServer = httpsServer(this.HttpsServerKeys, (requset: Request, response: Response) => {
        this.RequestParser(requset, response);
    });


    private HttpServer = httpServer((request: Request, response: Response) => {
        this.RequestParser(request, response);
    });

    private async DatabaseConnection(callback) {
        try {
            await PGbase.PGclient.connect().then(e => callback('Database Connected'));
        } catch (error) {
            callback(error);
        }
    }

    private RequestParser(request: Request, response: Response): void {
        const parsedUrl: UrlWithParsedQuery = parse(request.url, true);
        const path: string = parsedUrl.pathname;
        const trimmedPath: string = path.replace(/^\/+|\/+$/g, '');
        const queryStringObject: ParsedUrlQuery = parsedUrl.query;
        const method: string = request.method.toLowerCase();
        const { headers } = request;
        const decoder: StringDecoder = new StringDecoder('utf-8');
        let buffer: string;

        request.on('data', (data: any) => {
            buffer = decoder.write(data);
        });

        request.on('end', () => {
            buffer += decoder.end();
            const chosenHandler = typeof (Routes[trimmedPath]) !== 'undefined' ? Routes[trimmedPath] : ((data, callback) => callback(405, { error: 'Page Not Found' }));
            const dataReq = {
                trimmedPath,
                queryStringObject,
                method,
                headers,
                payload: Helper.parseJsonToObject(buffer)
            }
            chosenHandler(dataReq, (statusCode: number, payload): void => {
                statusCode = typeof (statusCode) === 'number' ? statusCode : 200;
                payload = typeof (payload) === "object" ? payload : {};
                const payloadString = JSON.stringify(payload);
                response.setHeader('Access-Control-Allow-Origin', '*');
                response.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
                response.setHeader('Content-Type', 'application/json');
                response.writeHead(statusCode);
                response.end(payloadString);

                if (statusCode === 200) {
                    log('\x1b[32m%s\x1b[0m', method.toUpperCase() + ' ' + trimmedPath + ' ' + statusCode)
                } else {
                    error('\x1b[31m%s\x1b[0m', method.toUpperCase() + ' ' + trimmedPath + ' ' + statusCode)
                }
            })
        });
    }

    public init(): void {
        this.DatabaseConnection(e => {
            log('\x1b[32m%s\x1b[0m',e);
        })

        this.HttpsServer.listen(Config.HttpsPort, () => {
            log('\x1b[36m%s\x1b[0m', "[HTTPS] KatalogPUPR served at port: " + Config.HttpsPort)
        })

        this.HttpServer.listen(Config.Httpport, () => {
            log('\x1b[35m%s\x1b[0m', "[HTTP] KatalogPUPR served at port: " + Config.Httpport)
        })
    }
}
