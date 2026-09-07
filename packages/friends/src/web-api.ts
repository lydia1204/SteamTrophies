import { FriendGameProgress } from './model';

export interface JsonTransport {
  getJson<T>(url: string, headers?: Readonly<Record<string,string>>): Promise<T>;
}

export interface SteamWebApiClientOptions {
  apiKey: string;
  transport: JsonTransport;
}

/** Backend-only client. Never instantiate this in the Steam web UI because it contains an API key. */
export class SteamWebApiClient {
  private readonly baseUrl = 'https://api.steampowered.com';
  constructor(private readonly options: SteamWebApiClientOptions) {
    if (!/^[A-Fa-f0-9]{16,64}$/.test(options.apiKey)) throw new Error('Steam Web API key has an unexpected format.');
  }

  async getPlayerAchievements(steamId: string, appId: number, language = 'english'): Promise<FriendGameProgress> {
    assertSteamId(steamId); assertAppId(appId);
    const url = new URL('/ISteamUserStats/GetPlayerAchievements/v1/', this.baseUrl);
    url.searchParams.set('steamid', steamId);
    url.searchParams.set('appid', String(appId));
    url.searchParams.set('l', language);
    const data = await this.options.transport.getJson<any>(url.toString(), { 'x-webapi-key': this.options.apiKey });
    if (data?.playerstats?.success === false) throw new Error('Steam did not expose achievements for this user/app.');
    const rows = Array.isArray(data?.playerstats?.achievements) ? data.playerstats.achievements : [];
    const achievements = rows.map((a:any) => ({ apiName:String(a.apiname ?? ''), achieved:Number(a.achieved)===1, unlockTimeUnix:Number(a.unlocktime)>0?Number(a.unlocktime):null }));
    const earnedCount = achievements.filter((a:{achieved:boolean}) => a.achieved).length;
    return { steamId, appId, achievements, earnedCount, totalCount:achievements.length, completionPercent:achievements.length?Math.round((earnedCount/achievements.length)*10000)/100:0 };
  }

  async getOwnedGames(steamId: string): Promise<Array<{appId:number;name:string;playtimeMinutes:number}>> {
    assertSteamId(steamId);
    const url = new URL('/IPlayerService/GetOwnedGames/v1/', this.baseUrl);
    url.searchParams.set('steamid', steamId);
    url.searchParams.set('include_appinfo', 'true');
    url.searchParams.set('include_played_free_games', 'true');
    const data = await this.options.transport.getJson<any>(url.toString(), { 'x-webapi-key': this.options.apiKey });
    const games = Array.isArray(data?.response?.games) ? data.response.games : [];
    return games.filter((g:any)=>Number.isSafeInteger(Number(g.appid))).map((g:any)=>({appId:Number(g.appid),name:String(g.name??`App ${g.appid}`),playtimeMinutes:Number(g.playtime_forever)||0}));
  }
}

function assertSteamId(value:string):void { if(!/^\d{17}$/.test(value)) throw new Error('Invalid SteamID64.'); }
function assertAppId(value:number):void { if(!Number.isSafeInteger(value)||value<=0||value>0xffffffff) throw new Error('Invalid app id.'); }
