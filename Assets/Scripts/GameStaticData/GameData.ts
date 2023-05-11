import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { ResetRule } from "ZEPETO.Script.Leaderboard";

export default class GameData {

    static LEADERBOARD = {
        WeekRank: {
            id: "",
            resetRule: ResetRule.week,
            resetDay: 1,  // 0 : Sunday ~ 6 : Saturdaya
            resetHour: 0,
            resetMin: 0,
            resetSec: 0,
        },
        playerStar: {
            id: "",
            resetRule: ResetRule.none,
        }
    }

    static GAME_HEART_RATE = 5;

}