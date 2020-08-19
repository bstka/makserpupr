import { object, required, string, number, ValidationResult } from 'joi'
export default class Validation {
    public static searchKatalog(payload) {
        const Schema:ValidationResult = object({
            idgrouplayer: number().integer().allow(""),
            subgroup: number().integer().allow(""),
            skalapeta: number().integer().allow(""),
            provinsi: number().integer().allow(""),
            search: string().alphanum().default("").allow(null, '')
        }).validate(payload)
        
        return Schema
    }

    public static getMetadata(payload) {
        const Schema :ValidationResult = object({
            kodepeta: string().required()
        }).validate(payload)

        return Schema
    }
}