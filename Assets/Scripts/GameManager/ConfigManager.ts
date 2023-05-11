import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import * as UnityEngine from "UnityEngine";
import { ZepetoWorldMultiplay } from "ZEPETO.World";
import { Mathf, Random } from 'UnityEngine';

export const enum RankType {
    RANK,       // 前100名排名奖励
    RATE,       // Top 30, 60, 90
    ETC,        // 参与奖励
}
export const enum RewardType {
    COIN,
    ZEM,
    GIFT,
}

export default class ConfigManager extends ZepetoScriptBehaviour {

    public mStartPointsJson: UnityEngine.TextAsset;
    public mPlayerInfoJson: UnityEngine.TextAsset;
    public mModelInfoJson: UnityEngine.TextAsset;
    public mModelCostJson: UnityEngine.TextAsset;

    private mSpawnInfoVO: SpawnPointVO;
    private mPlayerInfoVO: PlayerInfoVO[];
    private mModelInfoVO: ModelInfoVO[];
    private mModelCostVO: ModelCostVO[];

    static RANK_REWARD_TABLE: RankRewardData[] = [
        {
            rankType: RankType.RANK,
            rankValue: 1,
            rewardType: RewardType.ZEM,
            rewardValue: 50,
        }, {
            rankType: RankType.RANK,
            rankValue: 2,
            rewardType: RewardType.ZEM,
            rewardValue: 25,
        }, {
            rankType: RankType.RANK,
            rankValue: 5,
            rewardType: RewardType.ZEM,
            rewardValue: 5,
        }, {
            rankType: RankType.RANK,
            rankValue: 10,
            rewardType: RewardType.ZEM,
            rewardValue: 1,
        }, {
            rankType: RankType.RANK,
            rankValue: 50,
            rewardType: RewardType.COIN,
            rewardValue: 5000,
        }, {
            rankType: RankType.RATE,
            rankValue: 30,
            rewardType: RewardType.COIN,
            rewardValue: 1000,
        }, {
            rankType: RankType.RATE,
            rankValue: 60,
            rewardType: RewardType.COIN,
            rewardValue: 500,
        }, {
            rankType: RankType.ETC,
            rankValue: 0,
            rewardType: RewardType.COIN,
            rewardValue: 100,
        }
    ]

    static WEEK_NEED_ACTIVITY = {
        activityValue: 580,
        rewardType: RewardType.ZEM,
        rewardValue: 3,
    };

    static STAR_REWARD_ARRAY: StarReward[] = [
        {
            id: 1,
            amount: 8,
            rewardType: RewardType.ZEM
        },
        {
            id: 2,
            amount: 5888,
            rewardType: RewardType.COIN
        },
        {
            id: 3,
            amount: 20,
            rewardType: RewardType.ZEM
        },
        {
            id: 4,
            amount: 388,
            rewardType: RewardType.COIN
        },
        {
            id: 5,
            amount: 3,
            rewardType: RewardType.ZEM
        },
        {
            id: 6,
            amount: 88,
            rewardType: RewardType.COIN
        },
        {
            id: 7,
            amount: 1,
            rewardType: RewardType.ZEM
        },
        {
            id: 8,
            amount: 228,
            rewardType: RewardType.COIN
        },
        {
            id: 9,
            amount: 10,
            rewardType: RewardType.ZEM
        },
        {
            id: 10,
            amount: 888,
            rewardType: RewardType.COIN
        },
        {
            id: 11,
            amount: 2,
            rewardType: RewardType.ZEM
        },
        {
            id: 12,
            amount: 108,
            rewardType: RewardType.COIN
        },
    ]

    static SEASON_REWARD_ARRAY: SeasonReward[] = [
        {
            id: 1,
            amount: 10,
            rewardType: RewardType.ZEM,
            score: 400000
        },
        {
            id: 2,
            amount: 25,
            rewardType: RewardType.ZEM,
            score: 800000
        },
        {
            id: 3,
            amount: 50,
            rewardType: RewardType.ZEM,
            score: 1200000
        },
        {
            id: 4,
            amount: 150,
            rewardType: RewardType.ZEM,
            score: 1600000
        },
        {
            id: 5,
            amount: 300,
            rewardType: RewardType.ZEM,
            score: 2000000
        },
    ]

    static STAR_REWARD = {
        cost: 80,
        luckMax: 100,
        luckAdd: 2,
        exchangeMax: 5,
    }


    /* Singleton */

    private static _instance: ConfigManager;
    public static get Instance(): ConfigManager {
        return ConfigManager._instance;
    }
    Awake() {
        ConfigManager._instance = this;

        this.mSpawnInfoVO = JSON.parse(this.mStartPointsJson.text);
        this.mPlayerInfoVO = JSON.parse(this.mPlayerInfoJson.text);
        this.mModelInfoVO = JSON.parse(this.mModelInfoJson.text);
        this.mModelCostVO = JSON.parse(this.mModelCostJson.text);

    }

    public GetStartPoint(index: number, gameState: number): StartPoint {

        let result: StartPoint = null;
        switch (gameState) {
            case 0:
                index %= this.mSpawnInfoVO.idle.length;
                result = this.mSpawnInfoVO.idle[index];
                break;
            case 1:
                index %= this.mSpawnInfoVO.hider.length;
                result = this.mSpawnInfoVO.hider[index];
                break;
            case 2:
                index %= this.mSpawnInfoVO.hunter.length;
                result = this.mSpawnInfoVO.hunter[index];
                break;
        }
        return result;
    }

    public GetPlayerInfoVO(playerRole: number): PlayerInfoVO {
        for (var i = 0; i < this.mPlayerInfoVO.length; i++) {
            if (this.mPlayerInfoVO[i].playerRole == playerRole) {
                return this.mPlayerInfoVO[i];
            }
        }
    }

    public GetModelInfoVO(name: string): ModelInfoVO {
        for (var i = 0; i < this.mModelInfoVO.length; i++) {
            if (this.mModelInfoVO[i].name === name) {
                return this.mModelInfoVO[i];
            }
        }
    }

    public GetModelInfoVOById(id: number): ModelInfoVO {
        return this.mModelInfoVO[id];
    }

    public GetModelCostVO(): ModelCostVO[] {
        return this.mModelCostVO;
    }

    public GetModelCostVOByCostId(costId: number): ModelCostVO {
        for (var i = 0; i < this.mModelCostVO.length; i++) {
            if (this.mModelCostVO[i].costId === costId) {
                return this.mModelCostVO[i];
            }
        }
    }

    public GetRankRewardTable(): RankRewardData[] {
        return ConfigManager.RANK_REWARD_TABLE;
    }

}

class SpawnPointVO {
    public idle: StartPoint[];
    public hunter: StartPoint[];
    public hider: StartPoint[];
}

class StartPoint {
    category: number;
    pos: UnityEngine.Vector3;
    rot: UnityEngine.Vector3;
    camAngle: UnityEngine.Vector3;
}

class PlayerInfoVO {
    playerRole: number;
    runSpeed: number;
    jumpPower: number;
    zoomMin: number;
    zoomMax: number;
}

class ModelInfoVO {
    name: string;
    centerY: number;
    radius: number;
    height: number;
}
class ModelCostVO {
    name: string;
    cost: number;
    costId: number;
}

export interface RankRewardData {
    rankType: RankType,
    rankValue: number,
    rewardType: RewardType,
    rewardValue: number,
}

export interface StarReward {
    id: number;
    rewardType: RewardType;
    amount: number;
}

export interface SeasonReward extends StarReward {
    score: number
}
