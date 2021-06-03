//Originally designed for https://github.com/MrEnxo/minetron-js

//URL's must not have / at the end.
const loginURL = 'https://authentication-service-prod.superleague.com/v1/user/login/ghost'
const minetronURL = 'http://minetron.ml'
const apiURL = "https://api.minehut.com"
import fetch from 'node-fetch'

export class Plugin {
    id: string
    created: Date
    credits: number
    description: string
    extendedDescription: string
    disabled: boolean
    fileName: string
    htmlExtendedDesc: string
    lastUpdated: Date
    name: string
    version: string
    constructor (plugin: any) {
        this.id = plugin._id
        this.created = new Date(plugin.created)
        this.credits = plugin.credits
        this.description = plugin.desc
        this.extendedDescription = plugin.desc_extended
        this.disabled = plugin.disabled
        this.fileName = plugin.file_name
        this.htmlExtendedDesc = plugin.html_desc_extended
        this.lastUpdated = plugin.last_updated
        this.name = plugin.name
        this.version = plugin.version
    }
}

async function fetchAuthorized(endpoint: string, method?: string, headers?: HeadersInit, body?: BodyInit): Promise<any> {
    let options: {
        method?: string,
        headers?: any,
        body?: any
    } = {}

    if (method) {
        options.method = method
    }

    if (headers) {
        options.headers = headers
    }
    else {
        options.headers = {
            "Content-Type": "application/json"
        }
    }

    options.headers.authorization = loginInfo.authorization
    options.headers["x-session-id"] = loginInfo.xSessionId

    if (body) {
        options.body = body
    }

    return new Promise((resolve,reject) => {
        fetch(apiURL + endpoint, options).then(res => res.json().then(resolve))
    })
}

/**
 * Fetch all plugins publicly available from Minehut
 * 
 * @returns Array of Plugin objects.
 */
export async function getPublicPlugins(): Promise<Array<Plugin>> {
    return new Promise((resolve, reject) => {
        fetch(apiURL + '/plugins_public').then(res => res.json().then(res => {
            let plugins: Array<Plugin> = []
            res.all.forEach((plugin: any) => {
                plugins.push(new Plugin(plugin))
            })
            resolve(plugins)
        }))
    })
}

/**
 * Login with a HAR file. Designed to be used when Minetron is not available.
 * 
 * @param  {string} file The HAR file as a string.
 * @returns {Promise} Login object
 */
export async function harLogin(file: string) {
    return new Promise<{
        userId: string,
        servers: Array<string>,
        authorization: string,
        xSessionId: string,
        slgSessionId: string,
        xSlgUser: string
    }>((resolve, reject) => {
        let entries: Array<{
            request: {
                method: string,
                url: string
            },
            response: {
                content: {
                    text: string
                }
            }
        }>
        try {
            entries = JSON.parse(file).log.entries
        }
        catch (err) {
            reject(err)
            return
        }

        let response: {
            minehutSessionData: {
                _id: string,
                order_servers: [],
                servers: Array<string>,
                sessionId: string,
                sessions: Array<{
                    sessionId: string,
                    created: number
                }>,
                slgSessionId: '',
                slgUserId: '',
                token: string
            },
            slgSessionData: {
                slgRoles: {
                    minehut: {}
                },
                slgSessionId: string,
                slgUserId: string
            }
        }

        entries.forEach(value => {
            if (value.request.url === loginURL && value.request.method === "POST") {
                try {
                    response = JSON.parse(value.response.content.text)
                }
                catch (err) {
                    console.error("The specified file is corrupted.")
                    return
                }
            }
        })

        ghostLogin(response!.slgSessionData.slgUserId, response!.slgSessionData.slgSessionId, response!.minehutSessionData.sessionId).then(resolve)
    })
}

/**
 * Login with minetron. Recommended form of login.
 * 
 * @see https://github.com/MrEnxo/minetron-server
 * @param  {string} token Minetron login token.
 * @returns Login object
 */
export async function minetronLogin(token: string) {
    return new Promise<{
        userId: string,
        servers: Array<string>,
        authorization: string,
        xSessionId: string,
        slgSessionId: string,
        xSlgUser: string
    }>((resolve, reject) => {
        fetch(minetronURL + '/api/loginobject/' + token).then(res => res.json().then(loginobj => {
            ghostLogin(loginobj.slgSessionData.slgUserId, loginobj.slgSessionData.slgSessionId, loginobj.minehutSessionData.sessionId).then(resolve)
        }))
    })
}

let loginInfo: {
    userId: string,
    servers: Array<string>,
    authorization: string,
    xSessionId: string,
    slgSessionId: string,
    xSlgUser: string
}

async function ghostLogin(xSlgUser: string, xSlgSession: string, minehutSessionId: string) { //Ghost login that will be used by both login types.
    return new Promise<{
        userId: string,
        servers: Array<string>,
        authorization: string,
        xSessionId: string,
        slgSessionId: string,
        xSlgUser: string
    }>((resolve, reject) => {
        fetch(loginURL, {
            headers: {
                "x-slg-user": xSlgUser,
                "x-slg-session": xSlgSession,
                "Content-Type": "application/json"
            },
            method: 'POST',
            body: JSON.stringify({
                minehutSessionId: minehutSessionId, // :O
                slgSessionId: xSlgSession
            })
        }).then(res => res.json().then(res => {
            loginInfo = {
                userId: res.minehutSessionData._id,
                servers: res.minehutSessionData.servers,
                authorization: res.minehutSessionData.token,
                xSessionId: res.minehutSessionData.sessionId,
                slgSessionId: res.slgSessionData.slgSessionId,
                xSlgUser: res.slgSessionData.slgUserId
            }
            resolve(loginInfo)
        }))
    })
}