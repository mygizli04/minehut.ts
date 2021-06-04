//Originally designed for https://github.com/MrEnxo/minetron-react

//URL's must not have / at the end.
const loginURL = 'https://authentication-service-prod.superleague.com/v1/user/login/ghost'
const minetronURL = 'http://minetron.ml'
const apiURL = "https://api.minehut.com"
import fetch from 'node-fetch'

let loginInfo: {
    userId: string,
    servers: Array<string>,
    authorization: string,
    xSessionId: string,
    slgSessionId: string,
    xSlgUser: string
}

/**
 * Read files from minehut.
 * 
 * @param  {Server|string} server Server id or Server object
 * @param  {string} path File path you want to read.
 * 
 * @returns {Promise<string>}
 */
export async function readFile(server: Server | string, path: string): Promise<string> {
    return new Promise((resolve, reject) => {
        fetchAuthorized('/file/' + getServerId(server) + '/read/' + path).then(res => {
            resolve(res.content)
        })
    })
}

function getServerId(server: Server | string) {
    if (typeof server === "string") {
        return server
    }
    else {
        return server.id
    }
}
/**
 * Same as fetchServers() but returns a single server instead of an array.
 * 
 * @param  {string} serverName
 * 
 * @returns {Promise<Server>}
 */
export async function fetchServer(serverName: string): Promise<Server> {
    return new Promise((resolve, reject) => {
        fetchServers().then(servers => {
            let selected: Server | undefined
            servers.forEach(server => {
                if (serverName === server.name) {
                    selected = server
                }
            })

            if (selected) {
                resolve(selected)
            }
            else {
                reject("The server could not be found.")
            }
        })
    })
}

class FileInfo {
    blocked: boolean
    directory: boolean
    name: string
    server!: Server
    content?: string

    constructor (file: any, server: Server | string) {
        this.name = file.name
        this.directory = file.directory

        if (file.directory) {
            this.blocked = false
        }
        else {
            this.blocked = file.blocked
        }

        if (typeof server === "string") {
            fetchServer(server).then(server => {
                this.server = server
            })
        }
        else {
            this.server = server
        }
    }

    async fetch() {
        return new Promise((resolve, reject) => {
            readFile(this.server ,this.directory + '/' + this.name).then(res => {
                this.content = res
                resolve(res)
            })
        })
    }
}
/**
 * Lists the given directory.
 * 
 * @param  {Server|string} server The server that the directory will be listed from. Can be Server object or server id as a string.
 * @param  {string} path Directory that will be listed. (root is /)
 * 
 * @returns {Promise<File[]>}
 */
export async function listDir(server: Server | string, path: string): Promise<FileInfo[]> {
    return new Promise((resolve, reject) => {
        fetchAuthorized('/file/' + getServerId(server) + '/list/' + path).then(res => {
            if (res.error) {
                reject(res.error)
            }
            else {
                let files: Array<FileInfo> = []
                res.files.forEach((file: any) => {
                    files.push(new FileInfo(file, server))
                })
                resolve(files)
            }
        })
    })
}

/**
 * Fetches all servers available to the currently logged in user.
 * 
 * @returns {Promise<Array<Server>>}
 */
export async function fetchServers(): Promise<Array<Server>> {
    return new Promise((resolve, reject) => {
        if (!loginInfo) {
            reject("You are not logged in.")
            return
        }
        fetchAuthorized('/servers/' + loginInfo.userId + '/all_data').then(res => {
            if (res.expired) {
                reject()
            }
            else {
                let servers: Array<Server> = []
                res.forEach((server: any) => {
                    servers.push(new Server(server))
                })
                resolve(servers)
            }
        })
    })
}

class Server {

    id: string
    activePlugins: Array<string>
    activeServerPlan: string
    activeServerPlanDetails: {
        adFree: boolean,
        alwaysOnline: boolean,
        backupSlots: number,
        chargeInterval: number,
        cost: number,
        id: string,
        index: number,
        maxPlayers: number,
        maxPlugins: number,
        planName: string
    }
    backupSlots: number
    categories: Array<string>
    created: Date
    creditsPerDay: number
    exited: boolean
    hibernationPrepStartTime: number
    installedContentPacks: []
    lastOnline: Date
    maxPlayers: number
    maxRam: number
    metrics: {}
    motd: string
    name: string
    lowerName: string
    online: boolean
    owner: string
    platform: string
    playerCount: number
    players: []
    port: number
    purchasedIcons: []
    purchasedPlugins: []
    serverIp: string
    serverPlan: string
    serverPlanDetails: {
        adFree: boolean,
        alwaysOnline: boolean,
        backupSlots: number,
        chargeInterval: number,
        cost: number,
        id: string,
        index: number,
        maxPlayers: number,
        maxPlugins: number,
        planName: string
    }
    serverPort: number
    serverProperites: {
        allow_flight: boolean,
        allow_nether: boolean,
        announce_player_achievements: boolean,
        difficulty: number,
        enable_command_block: boolean,
        force_gamemode: boolean,
        gamemode: number,
        generate_structures: boolean,
        generator_settings: string,
        hardcore: boolean,
        level_name: string,
        level_seed: string,
        level_type: string,
        max_players: number,
        pvp: boolean,
        resource_pack: string,
        resource_pack_sha1: string,
        spawn_animals: boolean,
        spawn_mobs: boolean,
        spawn_protection: number,
        view_distance: number
    }
    serviceOnline: boolean
    shutdownReason: string
    shutdownScheduled: boolean
    startedAt: number
    starting: boolean
    status: string
    stoppedAt: number
    stopping: boolean
    storageNode: string
    suspended: boolean
    timeNoPlayers: number
    visiblity: boolean

    constructor (server: any) {
        this.id = server._id
        this.activePlugins = server.active_plugins
        this.activeServerPlan = server.active_server_plan
        this.activeServerPlanDetails = server.active_server_plan_detials
        this.backupSlots = server.backup_slots
        this.categories = server.categories
        this.created = new Date(server.creation)
        this.creditsPerDay = server.credits_per_day
        this.exited = server.exited
        this.hibernationPrepStartTime = server.hibernation_prep_start_time
        this.installedContentPacks = server.installed_content_packs
        this.lastOnline = new Date(server.last_online)
        this.maxPlayers = server.max_players
        this.maxRam = server.max_ram
        this.metrics = server.metrics
        this.motd = server.motd
        this.name = server.name
        this.lowerName = server.name_lower
        this.online = server.online
        this.owner = server.owner
        this.platform = server.platform
        this.playerCount = server.player_count
        this.players = server.players
        this.port = server.port
        this.purchasedIcons = server.purchased_icons
        this.purchasedPlugins = server.purchased_plugins
        this.serverIp = server.server_ip
        this.serverPlan = server.server_plan
        this.serverPlanDetails = server.server_plan_details
        this.serverPort = server.server_port
        this.serverProperites = server.server_properties
        this.serviceOnline = server.service_online
        this.shutdownReason = server.shutdown_reason
        this.shutdownScheduled = server.shutdown_scheduled
        this.startedAt = server.started_at
        this.starting = server.starting
        this.status = server.status
        this.stoppedAt = server.stopped_at
        this.stopping = server.stopping
        this.storageNode = server.storage_node
        this.suspended = server.suspended
        this.timeNoPlayers = server.time_no_players
        this.visiblity = server.visibility
    }

    start() {
        if (this.serviceOnline) {
            return startServer(this.id)
        }
        else {
            return startService(this.id)
        }
    }
}

async function startServer(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
        fetchAuthorized('/server/' + id + '/start', 'POST').then(res => {
            if (JSON.stringify(res) === "{}") {
                resolve()
            }
            else {
                reject(res)
            }
        })
    })
}

async function startService(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
        fetchAuthorized('/server/' + id + '/start_service', 'POST').then(res => {
            if (JSON.stringify(res) === "{}") {
                resolve()
            }
            else {
                if (res.error) {
                    reject(res.error)
                }
                else {
                    reject(res)
                }
            }
        })
    })
}


class Plugin {
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
        fetch(apiURL + endpoint, options).then(res => res.json().then(resolve).catch(reject))
    })
}

/**
 * Fetch all plugins publicly available from Minehut
 * 
 * @returns {Promise<Array<Plugin>>} Resolves to array of Plugin objects.
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
 * @returns {loginObject} Login object
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
 * @typedef {Object} loginObject
 * 
 * @property {string} userId Minehut user id
 * @property {Array<string>} servers Array of server id's
 * @property {string} authorization Authorization token
 * @property {string} xSessionId Current session id (minehut)
 * @property {string} slgSessionId Current session id (superleauge)
 * @property {string} xSlgUser Superleague user id
 */

/**
 * Login with minetron. Recommended form of login.
 * 
 * @see https://github.com/MrEnxo/minetron-server
 * @param  {string} token Minetron login token.
 * @returns {loginObject} Login object
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