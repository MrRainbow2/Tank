
## Description

玩家在提交的JS脚本中，需要提供一个`land`方法的实现，用于配置本队坦克的攻击行为和移动模式。
<br/>
<br/>

```typescript
// simple demo:  举例搜狐队的a b文件大体框架
// 搜狐队playerA.js
class PlayerA {
    // 具体参数签名见下方land说明
    // 返回的字符串是队伍名称
    land(args: any): string {}
}
// 搜狐队playerB.js
class PlayerB {
    land(args: any): string {}
}
```


## land

land方法能够获取游戏主程序提供的关键参数，并将在游戏主程序被调用：

签名如下：


```javascript
const playerName = land(aMyTankCount, aTankCount, aBulletCount, aMyBulletCount1, aMyBulletCount2, aworld, screenX, screenY, config)
```
### Return

1. playerName
   
   `string`

    玩家队伍名称。

### Parameters

1. aMyTankCount&#x20;
   
   `Array<MyTank>`
   
   我方坦克实例，其中`id == 100`的是A队坦克，（非aiRank模式下）`id == 200`的是B队坦克。

2. aTankCount&#x20;

    `Array<Tank>`

    所有敌方坦克（即ai坦克）。

3. aBulletCount&#x20;

    `Array<Bullet>`

    所有敌方子弹。

4. aMyBulletCount1

    `Array<Bullet>`

    我方A队的所有子弹。

5. aMyBulletCount2

    `Array<Bullet>`

    （非aiRank模式下）我方B队的所有子弹。

6. aworld

    `Array<[x, y, width, height, type, life]>`

    地图被划分为多个格子，按照从左到右、从上到下的顺序，被记录在一个数组中。

    单个格子的信息使用数组表示，其中`x、y`为位置坐标，`width、height`为宽高（固定为50px），`type`为格子类型，`life`为阻挡物的当前剩余血量。
    
    | type | description | maximum life |
    | ---- | ----------- | ---- |
    | 0    | 道路          | 9999 |
    | 1    | 金属          | 300  |
    | 2    | 水域          | 9999 |
    | 3    | 草丛          | 4000 |
    | 4    | 冰块          | 50   |
    | 5    | A队坦克的出生点    | —    |
    | 6    | B队坦克的出生点    | —    |
    | 7    | 敌方坦克的出生点    | —    |
    | 8    | 砖块          | 18   |
    | 9    | 再生砖         | 18   |
    | 10   | 再生冰         | 50   |


7. screenX

    `number`

    地图宽度。

8. screenY

    `number`

    地图高度。

9. config

    `Readonly Object`

    本场游戏配置：

    | property                                                       | type                      | description                                            |
    | -------------------------------------------------------------- | ------------------------- | ------------------------------------------------------ |
    | gameMode                                                       | 1 \| 2 \| 3 \| 4 \| 0         | 本场游戏模式：1 -> 预赛A组（aiRank），2 -> 预赛B组（车轮赛）  ，3 -> 预决赛（车轮战）， 4 -> 决赛 ，0 -> 未识别。 |                           |                                                        |
    | isAIRank                                                       | boolean                   | 当前是否处于aiRank模式。                                        |
    | isBattleMode                                                   | boolean                   | 是否能够击杀对面玩家。                           |
    | isFlagMode                                                   | boolean                   | 是否开启夺旗模式。                           |
    | weatherTypes                                                   | \["rain", "snow", "wind"] | 所有天气类型。                                                |
    | currentWeather                                                 | "rain" \| "snow" \| "wind"  | 当前天气。                                                  |
    | isAiSuperBullet                                                | boolean                   | AI坦克的子弹是否处于暴击状态，如果此时天气为雪天就是暴击。                       |
    | aiTankBulletSpeed                                              | number                    | AI坦克的子弹速度。                                           |
    | equip                                                          | { life: [number, number]; power: [number, number]; bullet: [number, number]; shield: [number, number]; } \| undefined                     | 道具位置坐标。
    | playerAKill              | number | A队当前击杀数。
    | flagArray              | Array<[x, y, width, height]> | 夺旗旗帜坐标及宽高。
    | playerBKill              | number | B队当前击杀数。
    | playerAFlag              | number | A队当前夺旗数。
    | playerBFlag              | number | B队当前夺旗数。
<br/>
<br/>

## MyTank
我方坦克，包含以下属性：

| property  | type    | initialValue            | description                   |
| --------- | ------- | ----------------------- | ----------------------------- |
| Hp        | number  | n \* 10                 | 剩余血量，初始值由地图指定，如果该地图未指定则默认为10 |
| speed     | number  | 7                       | 移动速度                          |
| direction | 0｜1｜2｜3 | 0                       | 移动方向，0-上，1-右，2-下，3-左          
| X         | number  | A队：400，B队：screenX - 400 | 位置横坐标                         |
| Y         | number  | 400                     | 位置纵坐标                         |

<br/>
<br/>
<br/>

## Tank
AI坦克，包含以下属性：

| property  | type    | initialValue            | description                   |
| --------- | ------- | ----------------------- | ----------------------------- |
| Hp        |  10 \| 20 \| 30 \| 40  | n \* 10                 | 剩余血量，初始值由地图指定 |
| speed     | number  | 2                       | 移动速度                          |
| direction | 0｜1｜2｜3 | 随机值                       | 移动方向，0-上，1-右，2-下，3-左          |
| X         | number  | 地图指定 | 位置横坐标                         |
| Y         | number  | 地图指定                     | 位置纵坐标                         |

<br/>
<br/>
<br/>

## Bullet
子弹，包含以下属性：

| property  | type    | initialValue            | description                   |
| --------- | ------- | ----------------------- | ----------------------------- |
| direction | 0｜1｜2｜3 | 随机值                       | 移动方向，0-上，1-右，2-下，3-左          |
| X         | number  | 地图指定 | 位置横坐标                         |
| Y         | number  | 地图指定                     | 位置纵坐标                         |

<br/>
<br/>
<br/>

## 坦克操控原理

在js脚本中，玩家通过模拟不同按键的键盘事件来控制坦克移动和开火。

1. A队玩家使用 `W、S、A、D` 按键（keycode为87、83、65、68）控制坦克移动，使用 `Space` 按键（keycode为32）开火；

2. B队玩家使用 ⬆️、⬇️、⬅️、➡️ 按键（keycode为38、40、37、39）控制坦克移动，使用 `BackSpace` 按键（keycode为8）开火。
<br/>
<br/>
<br/>

## URL参数介绍

游戏配置参数可通过修改URL的查询字段进行配置：

| param    | description                              |
| -------- | ---------------------------------------- |
| campaign | 1-关闭互杀模式；其他-开启互杀模式（默认）                   |
| flag     | 0-关闭夺旗模式；其他-开启夺旗模式（默认）                   |
| debug    | 1-开启debug模式，比赛数据不上传至服务器（默认）；其他-关闭debug模式 |
| eCount   | AI坦克数量，未指定时则读取地图提供的默认值                 |
| equip    | 1-开启装备增强模式（默认）；其他-关闭装备增强模式                |

<br/>
<br/>
<br/>

## 天气属性

目前的天气类型包括风、雪、雨三种。

比赛开始一段时间后，会随机出现一种天气，目前天气出现的时间为开赛后2秒，在正式比赛中将延长为15秒。

开启天气后，会出现如下变化：

1. 💨 风：AI坦克移速（`speed`）加1。

2. ❄️ 雪：我方坦克子弹速度（`playerBulletSpeed`）增加10%（注：天气出现前射出的子弹不受影响）。

3. 🌧️ 雨：AI坦克开启暴击状态（`isAiSuperBullet`）。

<br/>
<br/>
<br/>

## ✨ 新的特性

### 🗺️ 地图升级

今年坦克大赛地图的尺寸升级为 <strong>80 * 36</strong> 方格（4000px * 1800px），扩展为去年的 230%。

### 🏆 夺旗模式

旗帜位于地图指定位置（config.flagArray），参赛队伍需通过控制坦克撞击才能夺得旗帜，对玩家的寻路及躲避障碍能力提出进一步的考验。

决赛之前的赛程中，参赛队伍可通过积累夺旗数量，角逐相关奖项。

### 🛡️ 新道具-防护罩

今年坦克大赛加入第四种道具——防护罩，其特性是能够为玩家坦克抵消一次子弹攻击。

与其他道具类似，防护罩道具每局游戏仅有一个，且位置随机。
