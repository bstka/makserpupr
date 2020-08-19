export default class Helper {
    public static parseJsonToObject(payload) {
        try {
            return JSON.parse(payload)
        } catch (err) {
            return {
                
            }
        }
    }
}