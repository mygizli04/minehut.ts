//Originally designed for https://github.com/MrEnxo/minetron-react

//URL's must not have / at the end.
const loginURL = 'https://authentication-service-prod.superleague.com/v1/user/login/ghost'
const minetronURL = 'http://minetron.ml'
const apiURL = "https://api.minehut.com"
import fetch from 'node-fetch'
import * as uuid from 'uuid'

let loginInfo: LoginInfo;

/**
 * Login information about the logged in user.
 */
export interface LoginInfo {
    userId: string,
    servers: Array<string>,
    authorization: string,
    xSessionId: string,
    slgSessionId: string,
    xSlgUser: string
}

interface unownedServer {
    id: string,
    online: boolean,
    name: string,
    maxPlayers: number,
    playerCount: number,
    serverPlan: string,
    status: string,
    startedAt: number,
}

interface rawUser {
    servers:                  string[];
    order_servers:            string[];
    max_servers:              number;
    flags:                    string[];
    _id:                      string;
    email:                    string;
    email_verified:           boolean;
    email_sent_at:            number;
    created_at:               number;
    birthday:                 string;
    __v:                      number;
    email_code:               string;
    last_password_change:     number;
    last_login:               number;
    slg_shadow_profile_id:    string;
    minecraft_link_code:      any;
    minecraft_last_link_time: number;
    minecraft_name:           string;
    minecraft_uuid:           string;
    slg_profile_id:           string;
    credits:                  number;
}

/**
 * Minehut user representation.
 */
export interface User {
    servers:                  string[];
    serverOrder:            string[];
    maxServers:              number;
    flags:                    string[];
    id:                      string;
    email:                    string;
    emailVerified:           boolean;
    emailSentAt:            number;
    createdAt:               Date;
    birthday:                 string;
    __v:                      number;
    email_code:               string;
    lastPasswordChange:     Date;
    lastLogin:               Date;
    slgShadowProfileId:    string;
    minecraftLinkCode:      any;
    minecraftLastLinkTime: Date;
    minecraftName:           string;
    minecraftUuid:           string;
    slgProfileId:           string;
    credits:                  number;
}

/**
 * Gets user info 
 * 
 * @param userId Current user id
 */
export async function getUserInfo(userId: string): Promise<User> {
    return new Promise((resolve, reject) => {
        fetchAuthorized('/v2/user/' + userId).then((user: {user: rawUser}) => {
            resolve({
                __v: user.user.__v,
                birthday: user.user.birthday,
                createdAt: new Date(user.user.created_at),
                credits: user.user.credits,
                email: user.user.email,
                emailSentAt: user.user.email_sent_at,
                emailVerified: user.user.email_verified,
                flags: user.user.flags,
                email_code: user.user.email_code,
                id: user.user._id,
                lastLogin: new Date(user.user.last_login),
                lastPasswordChange: new Date(user.user.last_password_change),
                maxServers: user.user.max_servers,
                minecraftLastLinkTime: new Date(user.user.minecraft_last_link_time),
                minecraftLinkCode: user.user.minecraft_link_code,
                minecraftName: user.user.minecraft_name,
                minecraftUuid: user.user.minecraft_uuid,
                serverOrder: user.user.order_servers,
                servers: user.user.servers,
                slgProfileId: user.user.slg_profile_id,
                slgShadowProfileId: user.user.slg_profile_id
            })
        }) 
    });
}

/**
 * This method is intended to be used when you have another login system implemented.
 * Just updates internal variables then returns the argument. 
 * 
 * @param  {LoginInfo} login Login information
 * @returns The login argument.
 */
export function _altLogin(login: LoginInfo): LoginInfo {
    loginInfo = login
    return login
}

/**
 * @param  {string} name Name of the server you want to create.
 * 
 * @returns {Promise<Server>}
 */
export async function createServer(name: string): Promise<Server> {
    return new Promise((resolve, reject) => {
        fetchAuthorized('/servers/create', 'POST', {}, {
            name: name,
            platform: 'java'
        }).then(res => {
            resolve(new Server(res.server))
        })
    })
}

/** 
* Get All Servers
* 
* @returns {Promise<Array<Object>>} Array of servers
*/
export async function getAllServers(): Promise<Array<unownedServer>> {
    return new Promise((resolve, reject) => {
        fetch(apiURL + '/servers_all').then(res => res.json().then(servers => {
            servers.forEach((server: any, index: number, array: any) => {
                server.serverPlan = server.server_plan
                delete server.server_plan
                array[index] = server
            })
            resolve(servers)
        }))
    })
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
            if (res.error) {
                reject(res.error)
            }
            else {
                resolve(res.content)
            }
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
 * @param  {string} serverName Name of the server to fetch.
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

import fs from 'fs'
harLogin(fs.readFileSync("./minehut.har").toString()).then(async () => {
    listDir(await fetchServer("youParkour"), "/plugins")
})

class FileInfo {
    blocked: boolean
    directory: boolean
    name: string
    server!: Server
    content?: string
    path: string

    constructor (file: {
        name: string,
        directory: boolean,
        blocked: boolean,
        size: number
    }, server: Server | string, path: string) {
        this.name = file.name
        this.directory = file.directory
        this.path = path

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
            readFile(this.server ,this.directory + '/' + this.directory + "/" + this.name).then(res => {
                this.content = res
                resolve(res)
            })
        })
    }

    async delete() {
        return new Promise(async (resolve, reject) => {
            resolve(await fetchAuthorized("/file/" + this.server.id + "/delete/" + this.path + "/" + this.name, "POST"))
        });
    }
}

process.on("unhandledRejection", (...e) => {
    debugger
})

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
                    files.push(new FileInfo(file, server, path))
                })
                resolve(files)
            }
        })
    })
}

/**
 * Uploads your file to minehut
 * 
 * @param {Server|string} The ServerID
 * @param {string} the filename
 * @param {object} File in binary
 * 
 * @returns {Promise<void>}
 */
export async function uploadFile(server: Server | string, filename: string, file: object): Promise<void> {
    return new Promise((resolve, reject) => {
        fetchAuthorized(`/file/upload/${getServerId(server)}//${filename}`, "POST", {}, { file }).then(res => {
            if (JSON.stringify(res) === "{}") {
                resolve()
            }
            else {
                reject(res)
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

export class Server {

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

    /**
     * Starts the server.
     * 
     * @returns Promise<void>
     */
    async start(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.serviceOnline) {
                startServer(this.id).then(resolve).catch(reject)
            }
            else {
                startService(this.id).then(resolve).catch(reject)
            }
        })
    }

    /**
     * Hibernate the server.
     * 
     * @returns Promise<void>
     */
    async hibernate(): Promise<void> {
        return new Promise((resolve ,reject) => {
            fetchAuthorized('/server/' + this.id + '/destroy_service').then(res => {
                if (JSON.stringify(res) === "{}") {
                    resolve()
                }
                else {
                    reject(res)
                }
            })
        })
    }
    /**
     * Stop the server.
     * 
     * @returns Promise<void>
     */
    async stop(): Promise<void> {
        return new Promise((resolve, reject) => {
            fetchAuthorized('/server/' + this.id + '/shutdown').then(res => {
                if (JSON.stringify(res) === "{}") {
                    resolve()
                }
                else {
                    reject(res)
                }
            })
        })
    }
    /**
     * Restart the server.
     * @returns Promise<void>
     */
    async restart(): Promise<void> {
        return new Promise((resolve, reject) => {
            fetchAuthorized('/server/' + this.id + '/restart').then(res => {
                if (JSON.stringify(res) === "{}") {
                    resolve()
                }
                else {
                    reject(res)
                }
            })
        })
    }
    /**
     * Change the visibility of the server.
     * 
     * @param  {boolean} state Whether the server is visible or not.
     * @returns Promise<void>
     */
    async changeVisibility(state: boolean): Promise<void> {
        return new Promise((resolve, reject) => {
            fetchAuthorized('/server/' + this.id + '/visibility', 'POST', {}, {visiblity: state}).then(res => {
                if (JSON.stringify(res) === "{}") {
                    resolve()
                }
                else {
                    reject(res)
                }
            })
        })
    }
    
    /**
     * Send console command to server.
     * 
     * @param  {string} command Console command that will be executed.
     * @returns Promise<void>
     */
    async sendServerCommand(command: string): Promise<void> {
        return new Promise((resolve, reject) => {
            fetchAuthorized('/server/' + this.id + '/send_command', 'POST', {}, {command: command}).then(res => {
                if (JSON.stringify(res) === "{}") {
                    resolve()
                }
                else {
                    reject(res)
                }
            })
        })
    }

    /**
     * Change the name of the server.
     * 
     * @param  {string} name The new name of the server.
     * @returns Promise<void>
     */
    async changeName(name: string): Promise<void> {
        return new Promise((resolve, reject) => {
            fetchAuthorized('/server/' + this.id + '/change_name', 'POST', {}, {name: name}).then(res => {
                if (JSON.stringify(res) === "{}") {
                    resolve()
                }
                else {
                    reject(res)
                }
            })
        })
    }

    /**
     * Change server.properties
     * 
     * @param  {string} field Field to change.
     * @param  {string} value The value it should be.
     * @returns Promise
     */
    async changeServerProperty(field: string, value: string): Promise<void> {
        return new Promise((resolve, reject) => {
            fetchAuthorized('/server/' + this.id + '/visibility', 'POST', {}, {field: field, value: value}).then(res => {
                if (JSON.stringify(res) === "{}") {
                    resolve()
                }
                else {
                    reject(res)
                }
            })
        })
    }

    /**
     * Install a plugin to the server.
     * 
     * @param  {string} plugin Plugin id.
     * @returns Promise<void>
     * @deprecated Plugin installing through the Server object is deprecated. Install through a Plugin object instead.
     */
    async installPlugin(plugin: string): Promise<void> {
        return new Promise((resolve ,reject) => {
            fetchAuthorized('/server/' + this.id + '/install_plugin', 'POST', {}, {plugin}).then(res => {
                if (JSON.stringify(res) === "{}") {
                    resolve()
                }
                else {
                    reject(res)
                }
            })
        })
    }

    /**
     * Save the world of the server.
     * @returns Promise<void>
     */
    async saveWorld(): Promise<void> {
        return new Promise((resolve, reject) => {
            fetchAuthorized('/server/' + this.id + '/save', 'POST').then(res => {
                if (JSON.stringify(res) === "{}") {
                    resolve()
                }
                else {
                    reject(res)
                }
            })
        })
    }
    
    /**
     * Reset the world of the server.
     * @returns Promise<void>
     */
    async resetWorld(): Promise<void> {
        return new Promise((resolve, reject) => {
            fetchAuthorized('/server/' + this.id + '/reset_world', 'POST').then(res => {
                if (JSON.stringify(res) === "{}") {
                    resolve()
                }
                else {
                    reject(res)
                }
            })
        })
    }

    /**
     * List available backups.
     * 
     * @returns Promise<{backups: Array<Backup>, rollingBackup: RollingBackup}>
     */
    async listBackups(): Promise<BackupResponse> {
        return new Promise((resolve, reject) => {
            fetchAuthorized('/v1/server/' + this.id + '/backups').then(res => {
                let ret: {
                    backups: Array<Backup>,
                    rollingBackup: RollingBackup
                } = {backups: [], rollingBackup: new RollingBackup(res.rolling_backup)}

                res.backups.forEach((backup: any) => {
                    ret.backups.push(new Backup(backup))
                })

                resolve(ret)
            })
        })
    }

    // I don't know why this is commented out but there should be a reason?
    /*async createBackup(): Promise<BackupResponse> {
        return new Promise((resolve, reject) => {
            fetchAuthorized('/v1/server/' + this.id + '/backup/create', 'POST', {}, {backup_id: uuid.v4()}).then(res => {
                resolve(res)
            })
        })
    }*/

    async getPlugins(): Promise<Plugin[]> {
        return new Promise(async (resolve, reject) => {
            resolve((await getPublicPlugins()).filter(value => this.activePlugins.includes(value.id)))
        });
    }
}

interface BackupResponse {
    backups: Array<Backup>,
    rollingBackup: RollingBackup
}

class Backup {
    id: string
    content: {}
    dataRemoved: boolean
    deleted: boolean
    description: string
    disabled: boolean
    lastBackupTime: Date
    pending: boolean
    serverId: string
    serverModelSnapshot: {
        id: string,
        activeIcon: string,
        activePlugins: Array<string>,
        backupSlots: number,
        categories: [],
        creation: Date,
        creditsPerDay: number,
        installedContentPacks: [],
        key: string,
        lastOnline: Date,
        motd: string,
        name: string,
        lowerName: string,
        owner: string,
        platform: 'java',
        port: number,
        purchasedIcons: Array<string>,
        purchasedPlugins: [],
        serverPlan: string,
        serverProperites: {
            allowFlight: boolean,
            allowNether: boolean,
            announcePlayerAchievements: boolean,
            difficulty: number,
            enableCommandBlocks: boolean,
            forceGamemode: boolean,
            gamemode: number,
            generateStructures: boolean,
            generatorSettings: string,
            hardcore: boolean,
            levelName: string,
            levelSeed: string,
            levelType: string,
            maxPlayers: number,
            pvp: boolean,
            resourcePack: string,
            resourcePackSha1: string,
            spawnAnimals: boolean,
            spawnMobs: boolean,
            spawnProtection: number,
            viewDistance: number
        },
        storageNode: string,
        suspended: boolean,
        visibility: boolean
    }

    constructor (backup: any) {
        this.id = backup._id
        this.content = backup.content
        this.dataRemoved = backup.data_removed
        this.deleted = backup.deleted
        this.description = backup.description
        this.disabled = backup.disabled
        this.lastBackupTime = new Date(backup.last_backup_time)
        this.pending = backup.pending
        this.serverId = backup.server_id
        this.serverModelSnapshot = {
            id: backup.server_model_snapshot._id,
            activeIcon: backup.server_model_snapshot.active_icon,
            activePlugins: backup.server_model_snapshot.active_plugins,
            backupSlots: backup.server_model_snapshot.backup_slots,
            categories: backup.server_model_snapshot.categories,
            creation: new Date(backup.server_model_snapshot.creation),
            creditsPerDay: backup.server_model_snapshot.credits_per_day,
            installedContentPacks: backup.server_model_snapshot.installed_content_packs,
            key: backup.server_model_snapshot.key,
            lastOnline: new Date(backup.server_model_snapshot.last_online),
            motd: backup.server_model_snapshot.motd,
            name: backup.server_model_snapshot.name,
            lowerName: backup.server_model_snapshot.name_lower,
            owner: backup.server_model_snapshot.owner,
            platform: 'java',
            port: backup.server_model_snapshot.port,
            purchasedIcons: backup.server_model_snapshot.purchased_icons,
            purchasedPlugins: backup.server_model_snapshot.purchased_plugins,
            serverPlan: backup.server_model_snapshot.server_plan,
            serverProperites: {
                allowFlight: backup.server_model_snapshot.server_properties.allow_flight,
                allowNether: backup.server_model_snapshot.server_properties.allow_nether,
                announcePlayerAchievements: backup.server_model_snapshot.server_properties.announce_player_achievements,
                difficulty: backup.server_model_snapshot.server_properties.difficulty,
                enableCommandBlocks: backup.server_model_snapshot.server_properties.enable_command_block,
                forceGamemode: backup.server_model_snapshot.server_properties.force_gamemode,
                gamemode: backup.server_model_snapshot.server_properties.gamemode,
                generateStructures: backup.server_model_snapshot.server_properties.generate_structures,
                generatorSettings: backup.server_model_snapshot.server_properties.generator_settings,
                hardcore: backup.server_model_snapshot.server_properties.hardcore,
                levelName: backup.server_model_snapshot.server_properties.level_name,
                levelSeed: backup.server_model_snapshot.server_properties.level_seed,
                levelType: backup.server_model_snapshot.server_properties.level_type,
                maxPlayers: backup.server_model_snapshot.server_properties.max_players,
                pvp: backup.server_model_snapshot.server_properties.pvp,
                resourcePack: backup.server_model_snapshot.server_properties.resource_pack,
                resourcePackSha1: backup.server_model_snapshot.server_properties.resource_pack_sha1,
                spawnAnimals: backup.server_model_snapshot.server_properties.spawn_animals,
                spawnMobs: backup.server_model_snapshot.server_properties.spawn_mobs,
                spawnProtection: backup.server_model_snapshot.server_properties.spawn_protection,
                viewDistance: backup.server_model_snapshot.server_properties.view_distance
            },
            storageNode: backup.server_model_snapshot.storage_node,
            suspended: backup.server_model_snapshot.suspended,
            visibility: backup.server_model_snapshot.visibility
        }
    }

    /**
     * Restore this backup.
     * 
     * @returns Promise
     */
    async restore(): Promise<void> {
        return new Promise((resolve, reject) => {
            fetchAuthorized('/v1/server/' + this.serverId + '/backup/apply', 'POST', {}, {backup_id: this.id}).then(res => {
                if (JSON.stringify(res) === "{}") {
                    resolve()
                }
                else {
                    reject(res)
                }
            })
        })
    }
}

class RollingBackup {
    id: string
    etag: string
    lastBackupTime: string
    lastModified: string
    metaData: {
        "content-type": "application/octet-stream"
        mtime: string
    }

    constructor (backup: any) {
        this.id = backup._id
        this.etag = backup.etag
        this.lastBackupTime = backup.last_backup_time
        this.lastModified = backup.lastModified
        this.metaData = backup.metaData
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
    /**
     * Install this plugin to a server.
     * @param  {Server|string} server Server to install this plugin to.
     * @returns Promise<void>
     */
    async install(server: Server | string): Promise<void> {
        return new Promise((resolve, reject) => {
            fetchAuthorized('/server/' + getServerId(server) + '/install_plugin', 'POST', {}, {plugin: this.id}).then(res => {
                if (JSON.stringify(res) === "{}") {
                    resolve()
                }
                else {
                    reject()
                }
            })
        })
    }

    /**
     * Uninstall this plugin from a server.
     * @param  {Server|string} server Server to uninstall the plugin from.
     * @returns Promise<void>
     */
    async uninstall(server: Server | string): Promise<void> {
        return new Promise((resolve,reject) => {
            fetchAuthorized('/server/' + getServerId(server) + '/remove_plugin', 'POST', {}, {plugin: this.id}).then(res => {
                if (JSON.stringify(res) === "{}") {
                    resolve()
                }
                else {
                    reject()
                }
            })
        })
    }
    
    /**
     * Reset plugin configurations.
     * 
     * @param  {Server|string} server The server the plugin data will be deleted from.
     * @returns Promise<void>
     */
    async resetPlugin(server: Server | string): Promise<void> {
        return new Promise((resolve,reject) => {
            fetchAuthorized('/server/' + getServerId(server) + '/remove_plugin_data', 'POST', {}, {plugin: this.id}).then(res => {
                if (JSON.stringify(res) === "{}") {
                    resolve()
                }
                else {
                    reject()
                }
            })
        })
    }

    isInstalled(server: Server): boolean {
        return server.activePlugins.includes(this.id)
    }
}

async function fetchAuthorized(endpoint: string, method?: string, headers?: object, body?: object): Promise<any> {
    let options: {
        method?: string,
        headers?: any, //this specific one is any because typescript is stupid
        body?: any
    } = {}

    if (method) {
        options.method = method
    }

    if (headers && JSON.stringify(headers) !== "{}") {
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
        options.body = JSON.stringify(body)
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
    return new Promise<LoginInfo>((resolve, reject) => {
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

        ghostLogin(response!.slgSessionData.slgUserId, response!.slgSessionData.slgSessionId).then(resolve)
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
// Nice - Creator Of Minetron: MrEnxo
export async function minetronLogin(token: string) {
    return new Promise<LoginInfo>((resolve, reject) => {
        fetch(minetronURL + '/api/loginobject/' + token).then(res => res.json().then(loginobj => {
            if (loginobj.error) {
                reject(loginobj.error)
                return
            }
            loginInfo = {
                userId: loginobj.minehutSessionData._id,
                servers: loginobj.minehutSessionData.servers,
                authorization: loginobj.minehutSessionData.token,
                xSessionId: loginobj.minehutSessionData.sessionId,
                slgSessionId: loginobj.slgSessionData.slgSessionId,
                xSlgUser: loginobj.slgSessionData.slgUserId
            }
            resolve(loginInfo)
        }))
    })
}

async function ghostLogin(xSlgUser: string, xSlgSession: string) { //Ghost login that used to be used by both login types.
    return new Promise<LoginInfo>((resolve, reject) => {
        fetch(loginURL, {
            headers: {
                "x-slg-user": xSlgUser,
                "x-slg-session": xSlgSession,
                "Content-Type": "application/json"
            },
            method: 'POST',
            body: JSON.stringify({
                minehutSessionId: uuid.v4(), // :O
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