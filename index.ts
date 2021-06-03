//Originally designed for https://github.com/MrEnxo/minetron-js

const loginURL = 'https://authentication-service-prod.superleague.com/v1/user/login/ghost'
const minetronURL = 'http://minetron.ml'
import fetch from 'node-fetch'

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
            resolve({
                userId: res.minehutSessionData._id,
                servers: res.minehutSessionData.servers,
                authorization: res.minehutSessionData.token,
                xSessionId: res.minehutSessionData.sessionId,
                slgSessionId: res.slgSessionData.slgSessionId,
                xSlgUser: res.slgSessionData.slgUserId
            })
        }))
    })
}