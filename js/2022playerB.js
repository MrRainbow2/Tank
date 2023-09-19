var playerBPF = false
var playerBP = undefined
var playerBlastDic = undefined;

window.playerB = new (class PlayerControl {
  // A 选手   B 选手
  constructor(type) {
    this.type = type;
    this.#moveEv = new CustomEvent("keydown");
    this.#fireEv = new CustomEvent("keydown");
    this.firetimestamp = (new Date()).valueOf()

    this.aworld = undefined
    this.screenX = undefined
    this.screenY = undefined
    this.matrix = undefined
    this.matrixtestfire = undefined
    this.PF = undefined
  }
  // 方向的别名
  #DIRECTION = {
    UP: 0,
    RIGHT: 1,
    DOWN: 2,
    LEFT: 3,
    STOP: 4,//无子弹
    BLOCK: 5,//阻挡
    BORDER: 6//边界
  };
  // 开火事件
  #fireEv;
  // 移动事件
  #moveEv;

  land(aMyTankCount, aTankCount, aBulletCount, aMyBulletCount1, aMyBulletCount2, aworld, screenX, screenY, config, PF) {
    this.PF = PF

    this.aworld = aworld
    this.screenX = screenX
    this.screenY = screenY
    // 当前的坦克实例
    var cur = undefined
    var enr = undefined
    aMyTankCount.forEach(element => {
      var c = element
      if (c['id'] == 200) {
        cur = c
      }
      if (c['id'] == 100) {
        enr = c
      }
    });
    const currentTank = cur
    const enemyTank = enr
    if (!currentTank) return;
    //下面是方便读取的全局数据的别名
    // 所有的地方坦克实例数组
    const enemyTanks = aTankCount;
    // 所有的敌方子弹实例数组
    const enemyBullets = aBulletCount;
    // 坦克的宽高
    const currentTankWH = 50;
    // 子弹的宽高
    const bulletWH = 10;
    // 坦克的x,y  ===> 坦克左上角点
    const currentTankX = currentTank.X;
    const currentTankY = currentTank.Y;
    const currentTankDirect = currentTank.direction
    //我方子弹
    const myBullets = this.type === "A" ? aMyBulletCount1 : aMyBulletCount2;
    const eBullets = this.type === "A" ? aMyBulletCount2 : aMyBulletCount1;
    // 游戏限制的子弹数为5 = aMyBulletCount2
    const myBulletLimit = 5;
    // 当前策略移动方向
    let moveDirection = undefined
    // 中央逃逸点
    const cx = canvas.width / 2;
    const cy = canvas.height / 2

    function mybullet(X = 0, Y = 0) {
      this.direction = 4;//子弹方向
      this.X = X;//子弹坐标
      this.Y = Y;
    }

    // 躲AI子弹
    let Bullet = new Array(new mybullet(), new mybullet(), new mybullet(),
      new mybullet(), new mybullet(), new mybullet(), new mybullet(), new mybullet(),
      new mybullet(), new mybullet(), new mybullet(), new mybullet(), new mybullet(),
      new mybullet(), new mybullet(), new mybullet(), new mybullet(), new mybullet(),
      new mybullet(), new mybullet(), new mybullet());
    let Collide = new Array(this.#DIRECTION.STOP, this.#DIRECTION.STOP, this.#DIRECTION.STOP,
      this.#DIRECTION.STOP, this.#DIRECTION.STOP, this.#DIRECTION.STOP, this.#DIRECTION.STOP, this.#DIRECTION.STOP,
      this.#DIRECTION.STOP, this.#DIRECTION.STOP, this.#DIRECTION.STOP, this.#DIRECTION.STOP, this.#DIRECTION.STOP,
      this.#DIRECTION.STOP, this.#DIRECTION.STOP, this.#DIRECTION.STOP, this.#DIRECTION.STOP, this.#DIRECTION.STOP,
      this.#DIRECTION.STOP, this.#DIRECTION.STOP, this.#DIRECTION.STOP)
    this.#calcBulletDistance(enemyBullets, currentTankX, currentTankY, Bullet, currentTankWH, bulletWH, currentTankDirect, Collide)
    this.#calcBulletDistance(eBullets, currentTankX, currentTankY, Bullet, currentTankWH, bulletWH, currentTankDirect, Collide)
    //moveDirection = this.#avoidBullet(currentTankX, currentTankY, currentTankWH, Bullet, moveDirection)

    var lateEnemy = undefined
    var misDistanceOfEnemy = 100 * currentTankWH
    var secruitylevel = enemyTanks.length
    var escapedir = 3
    if(currentTank.Hp < 19 && enemyTanks.length>=35)
    {
      escapedir = 5
    }
    else if(currentTank.Hp < 11 && enemyTanks.length>20)
    {
      escapedir = 4 
    }
    var secruitydistance = currentTankWH * (escapedir + 1)
    var escapenum = 0

    for (const enemy of enemyTanks) {
      const dis = this.#calcTwoPointDistance(
        currentTankX,
        currentTankY,
        enemy.X,
        enemy.Y
      );

      if (secruitydistance > dis && secruitylevel >= 4) {
        escapenum++//逃亡系数，大了就要跑
      }
      if (misDistanceOfEnemy > dis) {
        misDistanceOfEnemy = dis;
        lateEnemy = enemy;
      }

      if (misDistanceOfEnemy < 6 * currentTankWH && (undefined != playerBP && playerBP.length < 8)) {
        playerBPF = false
      }
    }
    if (undefined != enemyTank) {
      const enemydis = this.#calcTwoPointDistance(
        currentTankX,
        currentTankY,
        enemyTank.X,
        enemyTank.Y
      );
      if (enemydis < misDistanceOfEnemy && secruitylevel <= 0) {
        lateEnemy = enemyTank;

        escapedir = 3
      }
    }
    if (secruitylevel <= 2 && undefined != enemyTank)//是否可以加速打电脑
    {
      escapedir = 3
    }

    moveDirection = this.#avoidBullet(currentTankX, currentTankY, currentTankWH, Bullet, moveDirection, Collide, currentTankDirect, bulletWH)
    if (undefined != moveDirection) {
      console.log("躲避子弹"+moveDirection)
    }
    {
      var testbaseUP = this.#DIRECTION.RIGHT != Bullet[3].direction && this.#DIRECTION.RIGHT != Bullet[4].direction && this.#DIRECTION.STOP == Bullet[5].direction && this.#DIRECTION.LEFT != Bullet[6].direction && this.#DIRECTION.LEFT != Bullet[7].direction && this.#DIRECTION.DOWN != Bullet[1].direction
      var testbaseDOWN = this.#DIRECTION.LEFT != Bullet[16].direction && this.#DIRECTION.LEFT != Bullet[17].direction && this.#DIRECTION.STOP == Bullet[15].direction && this.#DIRECTION.RIGHT != Bullet[13].direction && this.#DIRECTION.RIGHT != Bullet[14].direction && this.#DIRECTION.UP != Bullet[19].direction
      var testbaseLEFT = this.#DIRECTION.DOWN != Bullet[4].direction && this.#DIRECTION.DOWN != Bullet[0].direction && this.#DIRECTION.UP != Bullet[14].direction && this.#DIRECTION.UP != Bullet[18].direction && this.#DIRECTION.RIGHT != Bullet[8].direction && this.#DIRECTION.STOP == Bullet[9].direction
      var testbaseRIGHT = this.#DIRECTION.DOWN != Bullet[6].direction && this.#DIRECTION.DOWN != Bullet[2].direction && this.#DIRECTION.STOP == Bullet[11].direction && this.#DIRECTION.LEFT != Bullet[12].direction && this.#DIRECTION.UP != Bullet[16].direction && this.#DIRECTION.UP != Bullet[20].direction
      var testUP = testbaseUP && this.#DIRECTION.STOP == Collide[5]
      var testDOWN = testbaseDOWN && this.#DIRECTION.STOP == Collide[15]
      var testLEFT = testbaseLEFT && this.#DIRECTION.STOP == Collide[9]
      var testRIGHT = testbaseRIGHT && this.#DIRECTION.STOP == Collide[11]



      if (moveDirection == undefined /*&& escapenum < 4*/) {
        //不移动可以考虑炮击
        /*  
     0  1  2     
  3  4  5  6  7
  8  9  10 11 12
  13 14 15 16 17
     18 19 20
  */

        var testpath = this.#TestPF(currentTank.X, currentTank.Y, lateEnemy,Bullet,true);
        if (undefined != lateEnemy) {
          var disX = Math.abs(lateEnemy.X - currentTankX)
          var disY = Math.abs(lateEnemy.Y - currentTankY)
          var dis = this.#calcTwoPointDistance(currentTankX, currentTankY, lateEnemy.X, lateEnemy.Y)
          moveDirection = this.#TestFireDis(disX, disY, dis, currentTankDirect, testbaseUP, testbaseDOWN, testbaseRIGHT, testbaseLEFT, currentTankWH, lateEnemy, currentTank,testpath)


          //逃跑，敌人3倍距离就要逃跑了，因为2倍就是最小单位了
          if (/*(disX < escapedir * currentTankWH || disY < escapedir * currentTankWH) ||*/ dis < escapedir * currentTankWH && testpath.length<7) {
            var ctx = canvas.getContext('2d');
            const cy = ctx.canvas.clientHeight / 2;
            const cx = ctx.canvas.clientWidth / 2
            console.log("准备战术撤退")
            var list = []
            list[this.#DIRECTION.RIGHT] = false
            list[this.#DIRECTION.LEFT] = false
            list[this.#DIRECTION.UP] = false
            list[this.#DIRECTION.DOWN] = false
            if ((disX <= disY) && (lateEnemy.Y <= currentTankY)) {

              if (true == testRIGHT && lateEnemy.X <= currentTankX) {
                list[this.#DIRECTION.RIGHT] = true
              } else if (true == testLEFT && lateEnemy.X >= currentTankX) {
                list[this.#DIRECTION.LEFT] = true
              }
              if (true == testDOWN) {
                list[this.#DIRECTION.DOWN] = true
              }
            }
            if ((disX <= disY) && (lateEnemy.Y >= currentTankY)) {

              if (true == testRIGHT && lateEnemy.X <= currentTankX) {
                list[this.#DIRECTION.RIGHT] = true
              } else if (true == testLEFT && lateEnemy.X >= currentTankX) {
                list[this.#DIRECTION.LEFT] = true
              }
              if (true == testUP) {
                list[this.#DIRECTION.UP] = true
              }

            }
            if ((disX >= disY) && (lateEnemy.X >= currentTankX)) {

              if (true == testUP && lateEnemy.Y >= currentTankY) {
                list[this.#DIRECTION.UP] = true
              } else if (true == testDOWN && lateEnemy.Y <= currentTankY) {
                list[this.#DIRECTION.DOWN] = true
              }
              if (testLEFT) {
                list[this.#DIRECTION.LEFT] = true
              }
            }
            if ((disX >= disY) && (lateEnemy.X <= currentTankX)) {
              if (true == testUP && lateEnemy.Y >= currentTankY) {
                list[this.#DIRECTION.UP] = true
              } else if (true == testDOWN && lateEnemy.Y <= currentTankY) {
                list[this.#DIRECTION.DOWN] = true
              }
              if (testRIGHT) {
                list[this.#DIRECTION.RIGHT] = true
              }
            }
            var todirection = []
            todirection[this.#DIRECTION.RIGHT] = (currentTankX < cx ? 2 : 0)
              + ((disX > disY) ? 1 : 0)
              + (true == list[this.#DIRECTION.RIGHT] ? 1 : -100)
              + (currentTankX <= 1 / 2 * currentTankWH ? 3 : 0)
              + (currentTankDirect == this.#DIRECTION.RIGHT ? 3 : 0)
            todirection[this.#DIRECTION.LEFT] = (currentTankX > cx ? 2 : 0)
              + ((disX < disY) ? 1 : 0)
              + (true == list[this.#DIRECTION.LEFT] ? 1 : -100)
              + (currentTankX >= 2 * cx - 1 / 2 * currentTankWH ? 3 : 0)
              + (currentTankDirect == this.#DIRECTION.LEFT ? 3 : 0)
            todirection[this.#DIRECTION.UP] = (currentTankY > cy ? 2 : 0)
              + ((disY < disX) ? 1 : 0)
              + (true == list[this.#DIRECTION.UP] ? 1 : -100)
              + (currentTankY >= 2 * cy - 1 / 2 * currentTankWH ? 3 : 0)
              + (currentTankDirect == this.#DIRECTION.UP ? 3 : 0)
            todirection[this.#DIRECTION.DOWN] = (currentTankY < cy ? 2 : 0)
              + ((disY < disX) ? 1 : 0)
              + (true == list[this.#DIRECTION.DOWN] ? 1 : -100)
              + (currentTankY <= 1 / 2 * currentTankWH ? 3 : 0)
              + (currentTankDirect == this.#DIRECTION.DOWN ? 3 : 0)
            var direction = -1
            for (var x = 0; x < this.#DIRECTION.STOP; x++) {
              direction = todirection[x] > direction ? x : direction
            }
            if (-1 == direction) {
              console.log("战术撤退失败,尝试中央撤退,否则进入炮击区", moveDirection, todirection)
              if (escapenum >= 3 && undefined != lateEnemy) {
                if (false == testDOWN && testbaseDOWN && testUP) {
                  moveDirection = this.#DIRECTION.UP;
                } else if (false == testUP && testbaseUP && testDOWN) {
                  moveDirection = this.#DIRECTION.DOWN;
                } else if (false == testRIGHT && testbaseRIGHT && testLEFT) {
                  moveDirection = this.#DIRECTION.LEFT;
                } else if (false == testLEFT && testbaseLEFT && testRIGHT) {
                  moveDirection = this.#DIRECTION.RIGHT
                }
                if (undefined == moveDirection) {
                  console.log("中央撤退失败,进入直接炮击范围", moveDirection)
                }
                else {
                  console.log("中央撤退", moveDirection)
                }
              }
            }
            else {
              moveDirection = direction
              console.log("战术撤退", moveDirection, todirection)
            }
            if (true == playerBPF) {
              console.log("%c%s", "color: red", "关闭寻路,战术撤退")
              playerBPF = false
              playerBP = undefined

            }
          }
          //追击 2倍自身距离是最小追击单位，小于这个距离，不能躲开正面攻击
          else if (undefined == moveDirection && (disX > escapedir * currentTankWH || disY > escapedir * currentTankWH) && dis > secruitydistance) {


            //连续寻路
            if (playerBPF == true) {
              //检测连续寻路目标
              this.#TestPF(currentTankX, currentTankY, lateEnemy,Bullet)
              if (undefined == testpath || undefined == playerBP || testpath.length <= playerBP.length && testpath.length < 10) { 
                playerBPF = false 
              }
              var testmoveDirection = this.#DIRECTION.BLOCK
              if(playerBPF == true)
              {
                
                //判断连续寻路是否可以开启
                var PFCtestX = Math.ceil(currentTank.X / 50)
                var PFCtestY = Math.ceil(currentTank.Y / 50)
                var PFFtestX = Math.floor(currentTank.X / 50)
                var PFFtestY = Math.floor(currentTank.Y / 50)
                var PFDOWN = playerBP[0][0] == playerBP[1][0] && playerBP[0][1] < playerBP[1][1]
                var PFUP = playerBP[0][0] == playerBP[1][0] && playerBP[0][1] > playerBP[1][1]
                var PFRIGHT = playerBP[0][0] < playerBP[1][0] && playerBP[0][1] == playerBP[1][1]
                var PFLEFT = playerBP[0][0] > playerBP[1][0] && playerBP[0][1] == playerBP[1][1]
                var PFTLEFT = ((PFFtestX > 0) && 0 == this.matrix[PFCtestY][PFFtestX] &&
                  0 == this.matrix[PFFtestY][PFFtestX] &&
                  (0 == this.matrix[PFCtestY][PFFtestX - 1] || (1 == this.matrix[PFCtestY][PFFtestX - 1] && currentTank.X % 50 != 0)) &&
                  (0 == this.matrix[PFFtestY][PFFtestX - 1] || (1 == this.matrix[PFFtestY][PFFtestX - 1] && currentTank.X % 50 != 0))) == true
                var PFTRIGHT = ((PFCtestX < 80) && 0 == this.matrix[PFCtestY][PFCtestX] &&
                  0 == this.matrix[PFFtestY][PFCtestX] &&
                  (0 == this.matrix[PFCtestY][PFCtestX + 1] || (1 == this.matrix[PFCtestY][PFCtestX + 1] && currentTank.X % 50 != 0)) &&
                  (0 == this.matrix[PFFtestY][PFCtestX + 1] || (1 == this.matrix[PFFtestY][PFCtestX + 1] && currentTank.X % 50 != 0))) == true
                var PFTUP = ((PFFtestY > 0) && 0 == this.matrix[PFFtestY][PFCtestX] &&
                  0 == this.matrix[PFFtestY][PFFtestX] &&
                  (0 == this.matrix[PFFtestY - 1][PFCtestX] || (1 == this.matrix[PFFtestY - 1][PFCtestX] && currentTank.Y % 50 != 0)) &&
                  (0 == this.matrix[PFFtestY - 1][PFFtestX] || (1 == this.matrix[PFFtestY - 1][PFFtestX] && currentTank.Y % 50 != 0))) == true
                var PFTDOWN = ((PFCtestY < 35) && 0 == this.matrix[PFCtestY][PFCtestX] &&
                  0 == this.matrix[PFCtestY][PFFtestX] &&
                  (0 == this.matrix[PFCtestY + 1][PFCtestX] || (1 == this.matrix[PFCtestY + 1][PFCtestX] && currentTank.Y % 50 != 0)) &&
                  (0 == this.matrix[PFCtestY + 1][PFFtestX] || (1 == this.matrix[PFCtestY + 1][PFFtestX] && currentTank.Y % 50 != 0))) == true
                if (true == PFLEFT && true == PFTLEFT) {
                  testmoveDirection = this.#DIRECTION.LEFT
                }
                else if (true == PFRIGHT && true == PFTRIGHT) {
                  testmoveDirection = this.#DIRECTION.RIGHT
                }
                else if (true == PFUP && true == PFTUP) {
                  testmoveDirection = this.#DIRECTION.UP
                }
                else if (true == PFDOWN && true == PFTDOWN) {
                  testmoveDirection = this.#DIRECTION.DOWN
                } else if (true == PFLEFT && false == PFTLEFT && PFCtestY >= playerBP[0][1] && PFFtestY == playerBP[0][1]) {
                  testmoveDirection = this.#DIRECTION.UP
                }
                else if (true == PFLEFT && false == PFTLEFT && PFCtestY == playerBP[0][1] && PFFtestY <= playerBP[0][1]) {
                  testmoveDirection = this.#DIRECTION.DOWN
                }
                else if (true == PFRIGHT && false == PFTRIGHT && PFCtestY >= playerBP[0][1] && PFFtestY == playerBP[0][1]) {
                  testmoveDirection = this.#DIRECTION.UP
                } else if (true == PFRIGHT && false == PFTRIGHT && PFCtestY == playerBP[0][1] && PFFtestY <= playerBP[0][1]) {
                  testmoveDirection = this.#DIRECTION.DOWN
                } else if (true == PFUP && false == PFTUP && PFCtestX == playerBP[0][0] && PFFtestX <= playerBP[0][0]) {
                  testmoveDirection = this.#DIRECTION.RIGHT
                }
                else if (true == PFUP && false == PFTUP && PFCtestX >= playerBP[0][0] && PFFtestX == playerBP[0][0]) {
                  testmoveDirection = this.#DIRECTION.LEFT
                }
                else if (true == PFDOWN && false == PFTDOWN && PFCtestX == playerBP[0][0] && PFFtestX <= playerBP[0][0]) {
                  testmoveDirection = this.#DIRECTION.RIGHT
                } else if (true == PFDOWN && false == PFTDOWN && PFCtestX >= playerBP[0][0] && PFFtestX == playerBP[0][0]) {
                  testmoveDirection = this.#DIRECTION.LEFT
                } else {
                  testmoveDirection = this.#DIRECTION.BLOCK
                  console.log("%c%s", "color: red", "到达路径", playerBP[0][0], playerBP[0][1])
                }
  
  
               
              }
              if (this.#DIRECTION.BLOCK == testmoveDirection) {
                  moveDirection = this.#TestFireDis(disX, disY, dis, currentTankDirect, PFTUP, PFTDOWN, PFTRIGHT, PFTLEFT, currentTankWH, lateEnemy, currentTank,testpath)
              } else {
                moveDirection = testmoveDirection
              }
              

            }
            //没有寻路
            if (false == playerBPF && testpath.length<15) {
            if ((disX < disY) && (lateEnemy.Y < currentTankY)) {
              if (true == testRIGHT && lateEnemy.X > currentTankX) {
                moveDirection = this.#DIRECTION.RIGHT;
              } else if (true == testLEFT && lateEnemy.X < currentTankX) {
                moveDirection = this.#DIRECTION.LEFT
              }
              else if (true == testUP) {
                moveDirection = this.#DIRECTION.UP;
              }
            }
              if ((disX < disY) && (lateEnemy.Y > currentTankY) && false == playerBPF) {

              if (true == testRIGHT && lateEnemy.X > currentTankX) {
                moveDirection = this.#DIRECTION.RIGHT;
              } else if (true == testLEFT && lateEnemy.X < currentTankX) {
                moveDirection = this.#DIRECTION.LEFT
              }
              else if (true == testDOWN) {
                moveDirection = this.#DIRECTION.DOWN;
              }
            }
              if ((disX > disY) && (lateEnemy.X > currentTankX) && false == playerBPF) {

              if (true == testUP && lateEnemy.Y < currentTankY) {
                moveDirection = this.#DIRECTION.UP;
              } else if (true == testDOWN && lateEnemy.Y > currentTankY) {
                moveDirection = this.#DIRECTION.DOWN
              }
              else if (testRIGHT) {
                moveDirection = this.#DIRECTION.RIGHT;
              }
            }
              if ((disX > disY) && (lateEnemy.X < currentTankX) && false == playerBPF) {

              if (true == testUP && lateEnemy.Y < currentTankY) {
                moveDirection = this.#DIRECTION.UP;
              } else if (true == testDOWN && lateEnemy.Y > currentTankY) {
                moveDirection = this.#DIRECTION.DOWN
              }
              else if (undefined == moveDirection && testLEFT) {
                moveDirection = this.#DIRECTION.LEFT
              }
            }
            }


            if (undefined == moveDirection) {
              console.log("战术前进失败", moveDirection)
              //距离敌人足够远
              const dis = this.#calcTwoPointDistance(
                currentTankX,
                currentTankY,
                lateEnemy.X,
                lateEnemy.Y
              );
              //远距离射击不在弹道且距离过远，开启寻路
              if (testpath.length>9) {//&& aTankCount.length<25
                this.#TestPF(currentTankX, currentTankY, lateEnemy,Bullet)
              }
            }
            else {
              console.log(false == playerBPF?"格斗":"寻路", moveDirection)// 这里应该发动A星
            }
          }
          var c = (new Date()).valueOf()
          if (c - this.firetimestamp > 40) { //火炮要密集一些
            this.firetimestamp = c
            this.#fire();
            document.onkeyup(this.#fireEv);
          }
        }
      }
    }
    moveDirection = this.#avoidBullet(currentTankX, currentTankY, currentTankWH, Bullet, moveDirection, Collide, currentTankDirect, bulletWH)
    this.#move(moveDirection);
    if (undefined != moveDirection) {
      playerBlastDic = moveDirection;
    }


    this.#setName();
  }
  #TestFireDis(disX, disY, dis, currentTankDirect, testbaseUP, testbaseDOWN, testbaseRIGHT, testbaseLEFT, currentTankWH, lateEnemy, currentTank,testpath) {
    var moveDirection = undefined

    if (/*(disX > firedirectdis * currentTankWH || disY > firedirectdis * currentTankWH) ||*/ dis >= currentTankWH * 2 && testpath.length<9) {//调整炮口

      if ((disX < disY) && (lateEnemy.Y < currentTank.Y) && testbaseUP) {
        if (currentTankDirect != this.#DIRECTION.UP) {
          moveDirection = this.#DIRECTION.UP;
        }
      } else if ((disX < disY) && (lateEnemy.Y > currentTank.Y) && testbaseDOWN) {
        if (currentTankDirect != this.#DIRECTION.DOWN) {
          moveDirection = this.#DIRECTION.DOWN;
        }
      } else if ((disX > disY) && (lateEnemy.X > currentTank.X) && testbaseRIGHT) {
        if (currentTankDirect != this.#DIRECTION.RIGHT) {
          moveDirection = this.#DIRECTION.RIGHT;
        }
      } else if ((disX > disY) && (lateEnemy.X < currentTank.X) && testbaseLEFT) {
        if (currentTankDirect != this.#DIRECTION.LEFT) {
          moveDirection = this.#DIRECTION.LEFT;
         
        }
      }
      if (undefined != moveDirection && playerBlastDic !=moveDirection) {
        playerBPF = false
        console.log("炮口调整", moveDirection)
        return moveDirection
      } 
    }
    return undefined
  }
  #TestPF(currentTankX, currentTankY, lateEnemy,Bullet,testfire = false,) {
    if(undefined==lateEnemy) 
    {
      return new Array()
    }
    var testFP = false
    Bullet.forEach(i => {
      if(i.direction!=this.#DIRECTION.STOP)
      {
        testFP = true
      }
    });
    if(true==testFP)
    {
      return new Array()
    }

    //testfire只是测试火炮和寻路比较
    if (undefined == this.matrix) {
      var block = new Array();
      var blocktestfire = new Array();
      this.matrix = new Array()
      this.matrixtestfire= new Array
      for (var i = 0; i < this.aworld.length; i++) {
        if (1 == this.aworld[i][4] || 10 == this.aworld[i][4] || 2 == this.aworld[i][4]) {

          blocktestfire.push(1);
        } else {
          blocktestfire.push(0)
        }
        if (1 == this.aworld[i][4] || 10 == this.aworld[i][4] || 9 == this.aworld[i][4] || 8 == this.aworld[i][4] || 2 == this.aworld[i][4]) {
          block.push(1);
        } else {
          block.push(0)
        }
        if ((i + 1) % 80 == 0) {
          this.matrix.push(block);
          this.matrixtestfire.push(blocktestfire);
          block = new Array()
          blocktestfire = new Array()
        }
      }
    }


    var grid = new this.PF.Grid(this.matrix)
    if(true == testfire){
      grid = new this.PF.Grid(this.matrixtestfire)
    }
    grid.setWalkableAt(0, 1, false);
    var finder = new this.PF.BreadthFirstFinder();
    var path = finder.findPath(
      (currentTankX % 50  >25)  ? Math.ceil(currentTankX / 50) : Math.floor(currentTankX / 50), 
      (currentTankY % 50  >25)  ? Math.ceil(currentTankY / 50) : Math.floor(currentTankY / 50), 
      (lateEnemy.X % 50  >25)  ? Math.ceil(lateEnemy.X / 50): Math.floor(lateEnemy.X / 50),
      (lateEnemy.Y % 50  >25) ? Math.ceil(lateEnemy.Y / 50): Math.floor(lateEnemy.Y / 50), grid)
    if (false == testfire){
      if ( path.length > 7) {
        playerBPF = true
        playerBP = path
        console.log("%c%s",
          "color: red", "长路径开启寻路"+(new Date()).getTime())
      }
      else {
        console.log("%c%s",
          "color: red", "短路径关闭寻路"+(new Date()).getTime())
        playerBPF = false
        playerBP = undefined
      }
    }  

    return path;
  }

  leave() {
    this.#setName();
    document.onkeyup(this.#moveEv);
    document.onkeyup(this.#fireEv);
  }
  type;
  // private



  #calcTwoPointDistance(ax, ay, bx, by) {
    return Math.sqrt(Math.pow(ax - bx, 2) + Math.pow(ay - by, 2));
  }
  #collision(myTankx, myTanky, zonex, zoney, currentTankWHx, currentTankWHy, bulletWHx, bulletWHy) {
    return this.#PlayercheckCollide(myTankx, myTanky, currentTankWHx, currentTankWHy, zonex, zoney, bulletWHx, bulletWHy)
  }
  #PlayercheckCollide(A, B, C, D, E, F, G, H) {
    C += A;//算出矩形1右下角横坐标
    D += B;//算出矩形1右下角纵坐标
    G += E;//算出矩形2右下角横纵标
    H += F;//算出矩形2右下角纵坐标
    var rect
    if (C <= E || G <= A || D <= F || H <= B) {//两个图形没有相交
      rect = [0, 0, 0, 0];
      return (rect[2] - rect[0]) * (rect[3] - rect[1]) > 0
    }

    var tmpX, tmpY;
    if (E > A) {//图形2在图形1右边
      tmpX = G < C ? [E, G] : [E, C];
    } else {//图形2在图形1左边
      tmpX = C < G ? [A, C] : [A, G];
    }
    if (F > B) {//图形2在图形1下边
      tmpY = H < D ? [F, H] : [F, D];
    } else {//图形2在图形1上边
      tmpY = D < H ? [B, D] : [B, H];
    }
    rect = [tmpX[0], tmpY[0], tmpX[1], tmpY[1]];
    var r = (rect[2] - rect[0]) * (rect[3] - rect[1]) > 0
    return r
  }
  #avoidBullet(currentTankX, currentTankY, currentTankWH, Bullet, moveDirection, Collide, currentTankDirect, bulletWH) {
    var ctx = canvas.getContext('2d');
    const cy = ctx.canvas.clientHeight / 2;
    const cx = ctx.canvas.clientWidth / 2
    const speed = 7
    var test2up = 50
    var test2down = 50
    var test2left = 50
    var test2right = 50
    /*  
       0  1  2     
    3  4  5  6  7
    8  9  10 11 12
    13 14 15 16 17
       18 19 20
    */
    var arraydirectlist = new Array()
    var check = false
    arraydirectlist[this.#DIRECTION.UP] = false
    arraydirectlist[this.#DIRECTION.DOWN] = false
    arraydirectlist[this.#DIRECTION.LEFT] = false
    arraydirectlist[this.#DIRECTION.RIGHT] = false
    if ((this.#DIRECTION.LEFT == Bullet[11].direction || this.#DIRECTION.LEFT == Bullet[12].direction) || this.#DIRECTION.BORDER < Bullet[11].direction) { //考虑左垂直移动
      var ToUpY = Math.abs((Bullet[12].Y > Bullet[11].Y ? Bullet[12].Y : Bullet[11].Y) - currentTankY - speed - 1 * currentTankWH)
      var ToDownY = Math.abs(currentTankY - (Bullet[12].Y > Bullet[11].Y ? Bullet[12].Y : Bullet[11].Y) - speed)
      var disX = (Bullet[12].X > Bullet[11].X ? Bullet[12].X : Bullet[11].X) - speed - currentTankX - 1 / 2 * currentTankWH//子弹在右边，所以加一个坦克宽度
      if (this.#DIRECTION.RIGHT != Bullet[3].direction && this.#DIRECTION.RIGHT != Bullet[4].direction && (this.#DIRECTION.STOP == Bullet[5].direction) && this.#DIRECTION.LEFT != Bullet[6].direction && this.#DIRECTION.LEFT != Bullet[7].direction && this.#DIRECTION.DOWN != Bullet[1].direction) {
        if (false == this.#collisionMetal(currentTankX + 0 * currentTankWH, (Bullet[12].Y > Bullet[11].Y ? Bullet[12].Y : Bullet[11].Y) - 1 * currentTankWH - speed, currentTankWH, "tank")) {
          if (disX / bulletWH * speed > ToUpY) {
            console.log("安全左垂直躲避移动上", ToUpY)
            test2up = ToUpY > test2up ? test2up:ToUpY
            arraydirectlist[this.#DIRECTION.UP] = true
            check = true
          }
        }
      }
      if (this.#DIRECTION.LEFT != Bullet[16].direction && this.#DIRECTION.LEFT != Bullet[17].direction && (this.#DIRECTION.STOP == Bullet[15].direction) && this.#DIRECTION.RIGHT != Bullet[13].direction && this.#DIRECTION.RIGHT != Bullet[14].direction && this.#DIRECTION.UP != Bullet[19].direction) {
        if (false == this.#collisionMetal(currentTankX + 0 * currentTankWH, (Bullet[12].Y > Bullet[11].Y ? Bullet[12].Y : Bullet[11].Y) + speed, currentTankWH, "tank")) {
          if (disX / bulletWH * speed > ToDownY) {
            console.log("安全左垂直躲避移动下", ToDownY)
            test2down = ToDownY > test2down ? test2down:ToDownY
            arraydirectlist[this.#DIRECTION.DOWN] = true
            check = true
          }
        }
      }
    }
    if (this.#DIRECTION.UP == Bullet[15].direction || this.#DIRECTION.UP == Bullet[19].direction || this.#DIRECTION.BORDER < Bullet[15].direction) { //考虑上左右移动
      if (this.#DIRECTION.DOWN != Bullet[4].direction && this.#DIRECTION.DOWN != Bullet[0].direction && this.#DIRECTION.UP != Bullet[14].direction && this.#DIRECTION.UP != Bullet[18].direction && this.#DIRECTION.RIGHT != Bullet[8].direction && (this.#DIRECTION.STOP == Bullet[9].direction)) {
        if (false == this.#collisionMetal((Bullet[15].X > Bullet[19].X ? Bullet[15].X : Bullet[19].X) - 1 * currentTankWH - speed, currentTankY, currentTankWH, "tank")) {
          //if (false == this.#collisionMetal(currentTankX - 1 * currentTankWH, currentTankY, currentTankWH, "tank")) 
          {
            console.log("安全躲避移动左")
            arraydirectlist[this.#DIRECTION.LEFT] = true;
            check = true
          }
        }
      }
      if (this.#DIRECTION.DOWN != Bullet[2].direction && (this.#DIRECTION.STOP == Bullet[11].direction) && this.#DIRECTION.LEFT != Bullet[12].direction && this.#DIRECTION.UP != Bullet[16].direction && this.#DIRECTION.UP != Bullet[20].direction && this.#DIRECTION.DOWN != Bullet[6].direction) {
        if (false == this.#collisionMetal((Bullet[15].X > Bullet[19].X ? Bullet[15].X : Bullet[19].X) + speed, currentTankY, currentTankWH, "tank")) {
          //if (false == this.#collisionMetal(currentTankX + 1 * currentTankWH, currentTankY, currentTankWH, "tank")) 
          {
            console.log("安全躲避移动右")
            arraydirectlist[this.#DIRECTION.RIGHT] = true;
            check = true
          }
        }
      }
    }
    if (this.#DIRECTION.DOWN == Bullet[1].direction || this.#DIRECTION.DOWN == Bullet[5].direction || this.#DIRECTION.BORDER < Bullet[5].direction) { //必须下左右移动
      if (this.#DIRECTION.DOWN != Bullet[4].direction && this.#DIRECTION.UP != Bullet[14].direction && this.#DIRECTION.RIGHT != Bullet[8].direction && (this.#DIRECTION.STOP == Bullet[9].direction) && this.#DIRECTION.DOWN != Bullet[0].direction && this.#DIRECTION.UP != Bullet[18].direction) {
        if (false == this.#collisionMetal((Bullet[1].X > Bullet[5].X ? Bullet[1].X : Bullet[5].X) - 1 * currentTankWH - speed, currentTankY, currentTankWH, "tank")) {
          //if (false == this.#collisionMetal(currentTankX - 1 * currentTankWH, currentTankY, currentTankWH, "tank")) 
          {
            console.log("安全躲避移动左")
            arraydirectlist[this.#DIRECTION.LEFT] = true;
            check = true
          }
        }
      }
      if (this.#DIRECTION.DOWN != Bullet[6].direction && (this.#DIRECTION.STOP == Bullet[11].direction) && this.#DIRECTION.UP != Bullet[16].direction && this.#DIRECTION.LEFT != Bullet[12].direction && this.#DIRECTION.DOWN != Bullet[2].direction && this.#DIRECTION.UP != Bullet[20].direction) {

        if (false == this.#collisionMetal((Bullet[1].X > Bullet[5].X ? Bullet[1].X : Bullet[5].X) + speed, currentTankY, currentTankWH, "tank")) {
          //if (false == this.#collisionMetal(currentTankX + 1 * currentTankWH, currentTankY, currentTankWH, "tank")) 
          {
            console.log("安全躲避移动右")
            arraydirectlist[this.#DIRECTION.RIGHT] = true;
            check = true
          }
        }
      }
    }

    if (this.#DIRECTION.RIGHT == Bullet[8].direction || this.#DIRECTION.RIGHT == Bullet[9].direction || this.#DIRECTION.BORDER < Bullet[9].direction) { //必须右垂直移动
      var ToUpY = Math.abs((Bullet[8].Y > Bullet[9].Y ? Bullet[8].Y : Bullet[9].Y) - currentTankY - speed - 1 * currentTankWH)
      var ToDownY = Math.abs(currentTankY - (Bullet[8].Y > Bullet[9].Y ? Bullet[8].Y : Bullet[9].Y) - speed)
      var disX = currentTankX - (Bullet[8].X > Bullet[9].X ? Bullet[8].X : Bullet[9].X) - speed //子弹在左边
      if (this.#DIRECTION.RIGHT != Bullet[3].direction && this.#DIRECTION.RIGHT != Bullet[4].direction && (this.#DIRECTION.STOP == Bullet[5].direction) && this.#DIRECTION.LEFT != Bullet[6].direction && this.#DIRECTION.LEFT != Bullet[7].direction && this.#DIRECTION.DOWN != Bullet[1].direction) {
        if (false == this.#collisionMetal(currentTankX + 0 * currentTankWH, (Bullet[8].Y > Bullet[9].Y ? Bullet[8].Y : Bullet[9].Y) - 1 * currentTankWH - speed, currentTankWH, "tank")) {
          if (disX / bulletWH * speed > ToUpY) {
            console.log("安全右垂直躲避移动上", ToUpY)
            test2up = ToUpY > test2up ? test2up:ToUpY
            arraydirectlist[this.#DIRECTION.UP] = true
            check = true
          }
        }
      }
      if (this.#DIRECTION.LEFT != Bullet[16].direction && this.#DIRECTION.LEFT != Bullet[17].direction && (this.#DIRECTION.STOP == Bullet[15].direction) && this.#DIRECTION.RIGHT != Bullet[13].direction && this.#DIRECTION.RIGHT != Bullet[14].direction && this.#DIRECTION.UP != Bullet[19].direction) {

        if (false == this.#collisionMetal(currentTankX + 0 * currentTankWH, (Bullet[8].Y > Bullet[9].Y ? Bullet[8].Y : Bullet[9].Y) + speed, currentTankWH, "tank")) {
          if (disX / bulletWH * speed > ToDownY) {
            console.log("安全右垂直躲避移动下", ToDownY)
            test2down = ToDownY > test2down ? test2down:ToDownY
            arraydirectlist[this.#DIRECTION.DOWN] = true
            check = true
          }
        }
      }
    }

    //如果一个都没命中，那就需要风险移动,只探索最小移动范围是否可行
    if (false == check) {
      if (this.#DIRECTION.UP == Bullet[15].direction || this.#DIRECTION.UP == Bullet[19].direction || this.#DIRECTION.BORDER < Bullet[15].direction) { //考虑上左右移动
        //左移动避开子弹的最大移动距离，左移动要加出一个坦克单位
        var ToLeftX = Math.abs((Bullet[19].X > Bullet[15].X ? Bullet[19].X : Bullet[15].X) - currentTankX - speed - 1 * currentTankWH)
        //右移动避开子弹的最大移动距离，右移动只要和子弹距离一个最小移动单位即可
        var ToRightX = Math.abs(currentTankX - (Bullet[19].X > Bullet[15].X ? Bullet[19].X : Bullet[15].X) - speed)
        //子弹在下边，所以加一个坦克宽度                   
        var disY = (Bullet[19].Y > Bullet[15].Y ? Bullet[19].Y : Bullet[15].Y) - speed - currentTankY - 1 * currentTankWH

        if (this.#DIRECTION.DOWN != Bullet[4].direction && this.#DIRECTION.UP != Bullet[14].direction && this.#DIRECTION.RIGHT != Bullet[8].direction) {
          //左移动是否存在一个移动单位空间，考虑9点存在子弹的情况
          var dis = (currentTankX - Bullet[9].X == currentTankX) ? currentTankWH : (currentTankX - Bullet[9].X - speed - 1 * currentTankWH)
          if ((dis > speed) && false == this.#collisionMetal((Bullet[19].X > Bullet[15].X ? Bullet[19].X : Bullet[15].X) - speed - 1 * currentTankWH, currentTankY - 0 * currentTankWH, currentTankWH, "tank")) {
            //子弹上移动时间是否足够完成向左安全移动，否则就全部禁止
            if (disY / bulletWH * speed > ToLeftX) {
              console.log("风险左移动")
              test2left = ToLeftX > test2left ? test2left:ToLeftX
              arraydirectlist[this.#DIRECTION.LEFT] = true;
              check = true
            }

          } else {
            arraydirectlist[this.#DIRECTION.LEFT] = false;
          }
        }
        if (this.#DIRECTION.LEFT != Bullet[12].direction && this.#DIRECTION.UP != Bullet[16].direction && this.#DIRECTION.DOWN != Bullet[6].direction) {
          //右移动的最小单位是否存在
          var dis = (currentTankX - Bullet[11].X == currentTankX) ? currentTankWH : (Bullet[11].X - speed - currentTankX)
          if ((dis > speed) && false == this.#collisionMetal((Bullet[19].X > Bullet[15].X ? Bullet[19].X : Bullet[15].X) + speed, currentTankY - 0 * currentTankWH, currentTankWH, "tank")) {
            //子弹上移动时间是否足够完成向右安全移动，否则就全部禁止
            if (disY / bulletWH * speed > ToRightX) {
              console.log("风险右移动")
              test2right = ToRightX > test2right ? test2right:ToRightX
              arraydirectlist[this.#DIRECTION.RIGHT] = true;
              check = true
            }
          } else {
            arraydirectlist[this.#DIRECTION.RIGHT] = false;
          }
        }
        if (false == check)//大宫格检查失败，检查小宫格微动
        {
          console.log("完全不能上左右移动")
          arraydirectlist[this.#DIRECTION.UP] = true;
        }
      }
      if (this.#DIRECTION.DOWN == Bullet[1].direction || this.#DIRECTION.DOWN == Bullet[5].direction || this.#DIRECTION.BORDER < Bullet[5].direction) { //必须下左右移动
        //左移动避开子弹的最大移动距离，左移动要加出一个坦克单位
        var ToLeftX = Math.abs((Bullet[1].X > Bullet[5].X ? Bullet[1].X : Bullet[5].X) - currentTankX - speed - 1 * currentTankWH)
        //右移动避开子弹的最大移动距离，右移动只要和子弹距离一个最小移动单位即可
        var ToRightX = Math.abs(currentTankX - (Bullet[1].X > Bullet[5].X ? Bullet[1].X : Bullet[5].X) - speed)
        //子弹在上边，所以加一个子弹最小距离
        var disY = currentTankY - (Bullet[1].Y > Bullet[5].Y ? Bullet[1].Y : Bullet[5].Y) - speed

        if (this.#DIRECTION.DOWN != Bullet[4].direction && this.#DIRECTION.UP != Bullet[14].direction && this.#DIRECTION.RIGHT != Bullet[8].direction) {
          //左移动的最小单位是否存在
          var dis = (currentTankX - Bullet[9].X == currentTankX) ? currentTankWH : (currentTankX - Bullet[9].X - speed - 1 * currentTankWH)
          if ((dis > speed) && false == this.#collisionMetal((Bullet[1].X > Bullet[5].X ? Bullet[1].X : Bullet[5].X) - speed - 1 * currentTankWH, currentTankY - 0 * currentTankWH, currentTankWH, "tank")) {
            //子弹下移动时间是否足够完成向左安全移动，否则就全部禁止
            if (disY / bulletWH * speed > ToLeftX) {
              console.log("风险左移动")
              test2left = ToLeftX > test2left ? test2left:ToLeftX
              arraydirectlist[this.#DIRECTION.LEFT] = true;
              check = true
            }
          } else {
            arraydirectlist[this.#DIRECTION.LEFT] = false;
          }
        }
        if (this.#DIRECTION.DOWN != Bullet[6].direction && this.#DIRECTION.UP != Bullet[16].direction && this.#DIRECTION.LEFT != Bullet[12].direction) {
          //右移动的最小单位是否存在
          var dis = (currentTankX - Bullet[11].X == currentTankX) ? currentTankWH : (currentTankX - Bullet[11].X - speed)
          if ((dis > speed) && false == this.#collisionMetal((Bullet[1].X > Bullet[5].X ? Bullet[1].X : Bullet[5].X) + speed, currentTankY - 0 * currentTankWH, currentTankWH, "tank")) {
            //子弹下移动时间是否足够完成向右安全移动，否则就全部禁止
            if (disY / bulletWH * speed > ToRightX) {
              console.log("风险右移动")
              test2right = ToRightX > test2right ? test2right:ToRightX
              arraydirectlist[this.#DIRECTION.RIGHT] = true;
              check = true
            }
          } else {
            arraydirectlist[this.#DIRECTION.RIGHT] = false;
          }
        }
        if (false == check) {
          arraydirectlist[this.#DIRECTION.DOWN] = true;
          console.log("完全不能下左右移动")
        }
      }
      if ((this.#DIRECTION.LEFT == Bullet[11].direction || this.#DIRECTION.LEFT == Bullet[12].direction) || this.#DIRECTION.BORDER < Bullet[11].direction) { //考虑左垂直移动
        //上移动避开子弹的最大移动距离，上移动要加出一个坦克单位
        var ToUpY = Math.abs((Bullet[12].Y > Bullet[11].Y ? Bullet[12].Y : Bullet[11].Y) - currentTankY - speed - 1 * currentTankWH)
        //下移动避开子弹的最大移动距离，下移动只要和子弹距离一个最小移动单位即可
        var ToDownY = Math.abs(currentTankY - (Bullet[12].Y > Bullet[11].Y ? Bullet[12].Y : Bullet[11].Y) - speed)
        //子弹在右边，所以减一个最小移动空间和一个坦克空间
        var disX = (Bullet[12].X > Bullet[11].X ? Bullet[12].X : Bullet[11].X) - speed - currentTankX - 1 * currentTankWH//子弹在右边，所以加一个坦克宽度

        if ((this.#DIRECTION.RIGHT != Bullet[4].direction || currentTankY - Bullet[4].Y - speed > ToUpY) &&
          this.#DIRECTION.DOWN != Bullet[1].direction &&
          (this.#DIRECTION.LEFT != Bullet[6].direction || currentTankY - Bullet[6].Y - speed > ToUpY)) {
          //上移动的最小单位是否存在
          var dis = (currentTankY - Bullet[5].Y == currentTankY) ? currentTankWH : (currentTankY - Bullet[5].Y - speed)
          //可以上移动且有一个完整坦克空间
          if ((dis > speed) && false == this.#collisionMetal(currentTankX + 0 * currentTankWH, (Bullet[12].Y > Bullet[11].Y ? Bullet[12].Y : Bullet[11].Y) - speed, currentTankWH, "tank")) {
            //子弹左移动时间是否足够完成向上安全移动，否则就全部禁止
            if (disX / bulletWH * speed > ToUpY) {
              console.log("风险上移动")
              test2up = ToUpY > test2up ? test2up:ToUpY
              arraydirectlist[this.#DIRECTION.UP] = true;
              check = true
            }
          } else {
            arraydirectlist[this.#DIRECTION.UP] = false;
          }
        }
        if ((this.#DIRECTION.LEFT != Bullet[16].direction || Bullet[16].Y - speed - currentTankY > ToDownY) &&
          this.#DIRECTION.UP != Bullet[19].direction &&
          (this.#DIRECTION.RIGHT != Bullet[14].direction || Bullet[14].Y - speed - currentTankY > ToDownY)) {
          //下移动的最小单位是否存在
          var dis = (Bullet[15].Y - currentTankY) == -currentTankY ? currentTankWH : (Bullet[15].Y - currentTankY - currentTankWH)
          //可以下移动且有一个完整坦克空间
          if ((dis > speed) && false == this.#collisionMetal(currentTankX + 0 * currentTankWH, (Bullet[12].Y > Bullet[11].Y ? Bullet[12].Y : Bullet[11].Y) + speed, currentTankWH, "tank")) {
            //子弹左移动时间是否足够完成向下安全移动，否则就全部禁止
            if (disX / bulletWH * speed > ToDownY) {
              console.log("风险下移动")
              test2down = ToDownY > test2down ? test2down:ToDownY
              arraydirectlist[this.#DIRECTION.DOWN] = true;
              check = true
            }
          } else {
            arraydirectlist[this.#DIRECTION.DOWN] = false;
          }
        }
        if (false == check)//大宫格检查失败，检查小宫格微动
        {
          console.log("完全不能左垂直移动")
          arraydirectlist[this.#DIRECTION.LEFT] = true;
        }
      }
      if (this.#DIRECTION.RIGHT == Bullet[8].direction || this.#DIRECTION.RIGHT == Bullet[9].direction || this.#DIRECTION.BORDER < Bullet[9].direction) { //必须右垂直移动
        //上移动避开子弹的最大移动距离，上移动要加出一个坦克单位
        var ToUpY = Math.abs((Bullet[8].Y > Bullet[9].Y ? Bullet[8].Y : Bullet[9].Y) - currentTankY - speed - 1 * currentTankWH)
        //下移动避开子弹的最大移动距离，下移动只要和子弹距离一个最小移动单位即可
        var ToDownY = Math.abs(currentTankY - (Bullet[8].Y > Bullet[9].Y ? Bullet[8].Y : Bullet[9].Y) - speed)
        //子弹在左边，所以减一个最小移动空间 
        var disX = currentTankX - (Bullet[8].X > Bullet[9].X ? Bullet[8].X : Bullet[9].X) - speed

        if ((this.#DIRECTION.RIGHT != Bullet[4].direction || currentTankY - Bullet[4].Y - speed > ToUpY) &&
          this.#DIRECTION.DOWN != Bullet[1].direction &&
          (this.#DIRECTION.LEFT != Bullet[6].direction || currentTankY - Bullet[6].Y - speed > ToUpY)) {
          //上移动的最小单位是否存在
          var dis = (currentTankY - Bullet[5].Y == currentTankY) ? currentTankWH : (currentTankY - Bullet[5].Y - speed)
          //可以上移动且有一个完整坦克空间
          if ((dis > speed) && false == this.#collisionMetal(currentTankX + 0 * currentTankWH, (Bullet[8].Y > Bullet[9].Y ? Bullet[8].Y : Bullet[9].Y) - speed, currentTankWH, "tank")) {
            //子弹右移动时间是否足够完成向上安全移动，否则就全部禁止
            if (disX / bulletWH * speed > ToUpY) {
              console.log("风险上移动")
              test2up = ToUpY > test2up ? test2up:ToUpY
              arraydirectlist[this.#DIRECTION.UP] = true;
              check = true
            }
          } else {
            arraydirectlist[this.#DIRECTION.UP] = false;
          }
        }
        if ((this.#DIRECTION.LEFT != Bullet[16].direction || Bullet[16].Y - speed - currentTankY > ToDownY) &&
          this.#DIRECTION.UP != Bullet[19].direction &&
          (this.#DIRECTION.RIGHT != Bullet[14].direction || Bullet[14].Y - speed - currentTankY > ToDownY)) {
          //下移动的最小单位是否存在
          var dis = (Bullet[15].Y - currentTankY) == -currentTankY ? currentTankWH : (Bullet[15].Y - currentTankY - currentTankWH)
          //可以下移动且有一个完整坦克空间
          if ((dis > speed) && false == this.#collisionMetal(currentTankX + 0 * currentTankWH, (Bullet[8].Y > Bullet[9].Y ? Bullet[8].Y : Bullet[9].Y) + speed, currentTankWH, "tank")) {
            //子弹右移动时间是否足够完成向下安全移动，否则就全部禁止
            if (disX / bulletWH * speed > ToDownY) {
              console.log("风险下移动")
              test2down = ToDownY > test2down ? test2down:ToDownY
              arraydirectlist[this.#DIRECTION.DOWN] = true;
              check = true
            }
          } else {
            arraydirectlist[this.#DIRECTION.DOWN] = false;
          }
        }
        if (false == check) {
          arraydirectlist[this.#DIRECTION.RIGHT] = true;
          console.log("完全不能右垂直移动")
        }
      }
    }
    var checklength = 0
    for (var x = 0; x < this.#DIRECTION.STOP; x++) {
      if (true == arraydirectlist[x]) {
        checklength++
      }
    }
    if (checklength > 0) {
      var ctx = canvas.getContext('2d');
      const cy = ctx.canvas.clientHeight / 2;
      const cx = ctx.canvas.clientWidth / 2
      var toLeft = 100 +
        + (this.#DIRECTION.LEFT == currentTankDirect ? 3 : 0)
        + (currentTankX < cx ? 0 : 1)
      var toRight = 100 +
        //(this.#DIRECTION.BLOCK == Collide[11] ? -50 : 0 )
        //+ (this.#DIRECTION.BLOCK == Collide[12]) ? 5 : 0 
        //+ (this.#DIRECTION.BLOCK== Collide[12] ? -5 : 0 )
        //+ (this.#DIRECTION.BORDER === Collide[11]) ? 5 : 0 
        + (this.#DIRECTION.RIGHT == currentTankDirect ? 3 : 0)
        //+ Bullet[9]<Bullet[11]? 3:0
        + (currentTankX > cx ? 0 : 1)
      var toUp = 100 +
        //(this.#DIRECTION.BLOCK == Collide[5] ? -50 : 0 )
        //+ (this.#DIRECTION.BLOCK == Collide[1]) ? 5 : 0 
        //+ (this.#DIRECTION.BLOCK == Collide[1] ? -5 : 0 )
        //+ (this.#DIRECTION.BORDER == Collide[5]) ? 5 : 0 
        + (this.#DIRECTION.UP == currentTankDirect ? 3 : 0)
        //+ Bullet[5]>Bullet[15]? 3:0
        + (currentTankY < cy ? 0 : 1)
      var toDown = 100 +
        //(this.#DIRECTION.BLOCK == Collide[15] ? -50 : 0 )
        //+ (this.#DIRECTION.BLOCK == Collide[19]) ? 5 : 0 
        //+ (this.#DIRECTION.BLOCK == Collide[19] ? -5 : 0 )
        //+ (this.#DIRECTION.BORDER == Collide[15]) ? 5 : 0 
        + (this.#DIRECTION.DOWN == currentTankDirect ? 3 : 0)
        //+ Bullet[5]<Bullet[15]? 3:0
        + (currentTankY > cy ? 0 : 1)
      toLeft = toLeft
        + (this.#DIRECTION.DOWN == Bullet[0].direction ? -10 : 0)
        //+ (this.#DIRECTION.DOWN == Bullet[3] ? 10 : 0)
        + (this.#DIRECTION.DOWN == Bullet[4].direction ? -10 : 0)
        //+ (this.#DIRECTION.UP == Bullet[13] ? 10 : 0)
        + (this.#DIRECTION.UP == Bullet[14].direction ? -10 : 0)
        + (this.#DIRECTION.UP == Bullet[18].direction ? -10 : 0)

      toRight = toRight
        + (this.#DIRECTION.DOWN == Bullet[2].direction ? -10 : 0)
        + (this.#DIRECTION.DOWN == Bullet[6].direction ? -10 : 0)
        //+ (this.#DIRECTION.DOWN  == Bullet[7] ? 10 : 0) 
        + (this.#DIRECTION.UP == Bullet[16].direction ? -10 : 0)
        + (this.#DIRECTION.UP == Bullet[17].direction ? -10 : 0)
      //+ (this.#DIRECTION.UP == Bullet[20] ? 10 : 0)
      toUp = toUp
        //+ (this.#DIRECTION.RIGHT == Bullet[0] ? 10 : 0) 
        + (this.#DIRECTION.RIGHT == Bullet[3].direction ? -10 : 0)
        + (this.#DIRECTION.RIGHT == Bullet[4].direction ? -10 : 0)
        //+ (this.#DIRECTION.LEFT == Bullet[2] ? 10 : 0) 
        + (this.#DIRECTION.LEFT == Bullet[6].direction ? -10 : 0)
        + (this.#DIRECTION.LEFT == Bullet[7].direction ? -10 : 0)
      toDown = toDown
        + (this.#DIRECTION.RIGHT == Bullet[13].direction ? -10 : 0)
        + (this.#DIRECTION.RIGHT == Bullet[14].direction ? -10 : 0)
        //+ (this.#DIRECTION.RIGHT  == Bullet[18] ? 10 : 0) 
        + (this.#DIRECTION.LEFT == Bullet[16].direction ? -10 : 0)
        + (this.#DIRECTION.LEFT == Bullet[17].direction ? -10 : 0)
      //+ (this.#DIRECTION.LEFT == Bullet[20] ? 10 : 0)
      toDown = toDown + 50 - test2down
      toUp = toUp + 50 - test2up
      toLeft = toLeft + 50 -test2left
      toRight = toRight + 50 -test2right
      for (var x = 0; x < this.#DIRECTION.STOP; x++) {

        if (this.#DIRECTION.RIGHT == x) {
          arraydirectlist[this.#DIRECTION.RIGHT] = false == arraydirectlist[this.#DIRECTION.RIGHT] ? false : toRight
        }
        else if (this.#DIRECTION.DOWN == x) {
          arraydirectlist[this.#DIRECTION.DOWN] = false == arraydirectlist[this.#DIRECTION.DOWN] ? false : toDown
        }
        else if (this.#DIRECTION.LEFT == x) {
          arraydirectlist[this.#DIRECTION.LEFT] = false == arraydirectlist[this.#DIRECTION.LEFT] ? false : toLeft
        }
        else if (this.#DIRECTION.UP == x) {
          arraydirectlist[this.#DIRECTION.UP] = false == arraydirectlist[this.#DIRECTION.UP] ? false : toUp
        }
      }
      var direct = this.#DIRECTION.STOP
      for (x = 0; x < this.#DIRECTION.STOP; x++) {
        direct = arraydirectlist[x] >= arraydirectlist[this.#DIRECTION.STOP==direct?0:direct] ? x : direct
      }
      moveDirection = direct
      if (true == playerBPF) {
        playerBPF = false
        playerBP = undefined
        console.log("%c%s",
          "color: red", "关闭寻路, 躲避火炮")
      }
      var printlist = new Array()
      printlist = printlist.concat(Bullet)
      console.log("list", direct, currentTankDirect, arraydirectlist,printlist,currentTankX,currentTankY)
      return moveDirection
    }
    else {
      return moveDirection
    }
  }
  /*  
     0  1  2     
  3  4  5  6  7
  8  9  10 11 12
  13 14 15 16 17
     18 19 20
  */
  #calcBulletDistance(arraybullet, currentTankX, currentTankY, Bullet, currentTankWH, bulletWH, currentTankDirect, Collide) {
    //0
    if (true == this.#collisionMetal(currentTankX - 1 * currentTankWH, currentTankY - 2 * currentTankWH, currentTankWH, "tank")) {
      Collide[0] = this.#DIRECTION.BLOCK//碰到了必须移动
    }
    if (true == this.#isNearBoundary(currentTankX - 1 * currentTankWH, currentTankY - 2 * currentTankWH, this.#DIRECTION.UP, currentTankWH)) {
      Collide[0] = this.#DIRECTION.BORDER
    }
    //1
    if (true == this.#collisionMetal(currentTankX, currentTankY - 2 * currentTankWH, currentTankWH, "tank")) {
      Collide[1] = this.#DIRECTION.BLOCK//碰到了必须移动
    }
    if (true == this.#isNearBoundary(currentTankX, currentTankY - 2 * currentTankWH, this.#DIRECTION.UP, currentTankWH)) {
      Collide[1] = this.#DIRECTION.BORDER
    }
    //2
    if (true == this.#collisionMetal(currentTankX + 1 * currentTankWH, currentTankY - 2 * currentTankWH, currentTankWH, "tank")) {
      Collide[2] = this.#DIRECTION.BLOCK//碰到了必须移动
    }
    if (true == this.#isNearBoundary(currentTankX + 1 * currentTankWH, currentTankY - 2 * currentTankWH, this.#DIRECTION.UP, currentTankWH)) {
      Collide[2] = this.#DIRECTION.BORDER
    }
    //3
    if (true == this.#collisionMetal(currentTankX - 2 * currentTankWH, currentTankY - 1 * currentTankWH, currentTankWH, "tank")) {
      Collide[3] = this.#DIRECTION.BLOCK//碰到了必须移动
    }
    if (true == this.#isNearBoundary(currentTankX - 2 * currentTankWH, currentTankY - 1 * currentTankWH, this.#DIRECTION.LEFT, currentTankWH)) {
      Collide[3] = this.#DIRECTION.BORDER
    }
    //4
    if (true == this.#collisionMetal(currentTankX - 1 * currentTankWH, currentTankY - 1 * currentTankWH, currentTankWH, "tank")) {
      Collide[4] = this.#DIRECTION.BLOCK//碰到了必须移动
    }
    if (true == this.#isNearBoundary(currentTankX - 1 * currentTankWH, currentTankY - 1 * currentTankWH, this.#DIRECTION.UP, currentTankWH)) {
      Collide[4] = this.#DIRECTION.BORDER
    }
    else if (true == this.#isNearBoundary(currentTankX - 1 * currentTankWH, currentTankY - 1 * currentTankWH, this.#DIRECTION.LEFT, currentTankWH)) {
      Collide[4] = this.#DIRECTION.BORDER
    }
    //5
    if (true == this.#collisionMetal(currentTankX - 0 * currentTankWH, currentTankY - 1 * currentTankWH, currentTankWH, "tank")) {
      Collide[5] = this.#DIRECTION.BLOCK//碰到了必须移动
    }
    if (true == this.#isNearBoundary(currentTankX - 0 * currentTankWH, currentTankY - 1 * currentTankWH, this.#DIRECTION.UP, currentTankWH)) {
      Collide[5] = this.#DIRECTION.BORDER
    }
    //6
    if (true == this.#collisionMetal(currentTankX + 1 * currentTankWH, currentTankY - 1 * currentTankWH, currentTankWH, "tank")) {
      Collide[6] = this.#DIRECTION.BLOCK//碰到了必须移动
    }
    if (true == this.#isNearBoundary(currentTankX + 1 * currentTankWH, currentTankY - 1 * currentTankWH, this.#DIRECTION.UP, currentTankWH)) {
      Collide[6] = this.#DIRECTION.BORDER
    }
    else if (true == this.#isNearBoundary(currentTankX + 1 * currentTankWH, currentTankY - 1 * currentTankWH, this.#DIRECTION.RIGHT, currentTankWH)) {
      Collide[6] = this.#DIRECTION.BORDER
    }
    //7
    if (true == this.#collisionMetal(currentTankX + 2 * currentTankWH, currentTankY - 1 * currentTankWH, currentTankWH, "tank")) {
      Collide[7] = this.#DIRECTION.BLOCK//碰到了必须移动
    }
    if (true == this.#isNearBoundary(currentTankX + 2 * currentTankWH, currentTankY - 1 * currentTankWH, this.#DIRECTION.RIGHT, currentTankWH)) {
      Collide[7] = this.#DIRECTION.BORDER
    }
    //8
    if (true == this.#collisionMetal(currentTankX - 2 * currentTankWH, currentTankY - 0 * currentTankWH, currentTankWH, "tank")) {
      Collide[8] = this.#DIRECTION.BLOCK//碰到了必须移动
    }
    if (true == this.#isNearBoundary(currentTankX - 2 * currentTankWH, currentTankY - 0 * currentTankWH, this.#DIRECTION.LEFT, currentTankWH)) {
      Collide[8] = this.#DIRECTION.BORDER
    }
    //9
    if (true == this.#collisionMetal(currentTankX - 1 * currentTankWH, currentTankY - 0 * currentTankWH, currentTankWH, "tank")) {
      Collide[9] = this.#DIRECTION.BLOCK//碰到了必须移动
    }
    if (true == this.#isNearBoundary(currentTankX - 1 * currentTankWH, currentTankY - 0 * currentTankWH, this.#DIRECTION.LEFT, currentTankWH)) {
      Collide[9] = this.#DIRECTION.BORDER
    }
    //10
    /*
    if(true==this.#collisionMetal(currentTankX - 0 * currentTankWH,currentTankY - 0 * currentTankWH,currentTankWH,"tank"))
    {
      Collide[10] = this.#DIRECTION.BLOCK//碰到了必须移动
    }else if(true==this.#isNearBoundary(currentTankX - 0 * currentTankWH,currentTankY - 0 * currentTankWH, currentTankDirect, currentTankWH)){
      Collide[10] = this.#DIRECTION.BORDER
    }
    */
    //11
    if (true == this.#collisionMetal(currentTankX + 1 * currentTankWH, currentTankY - 0 * currentTankWH, currentTankWH, "tank")) {
      Collide[11] = this.#DIRECTION.BLOCK//碰到了必须移动
    }
    if (true == this.#isNearBoundary(currentTankX + 1 * currentTankWH, currentTankY - 0 * currentTankWH, this.#DIRECTION.RIGHT, currentTankWH)) {
      Collide[11] = this.#DIRECTION.BORDER
    }
    //12
    if (true == this.#collisionMetal(currentTankX + 2 * currentTankWH, currentTankY - 0 * currentTankWH, currentTankWH, "tank")) {
      Collide[12] = this.#DIRECTION.BLOCK//碰到了必须移动
    }
    if (true == this.#isNearBoundary(currentTankX + 2 * currentTankWH, currentTankY - 0 * currentTankWH, this.#DIRECTION.RIGHT, currentTankWH)) {
      Collide[12] = this.#DIRECTION.BORDER
    }
    //13
    if (true == this.#collisionMetal(currentTankX - 2 * currentTankWH, currentTankY + 1 * currentTankWH, currentTankWH, "tank")) {
      Collide[13] = this.#DIRECTION.BLOCK//碰到了必须移动
    }
    if (true == this.#isNearBoundary(currentTankX - 2 * currentTankWH, currentTankY + 1 * currentTankWH, this.#DIRECTION.LEFT, currentTankWH)) {
      Collide[13] = this.#DIRECTION.BORDER
    }
    //14
    if (true == this.#collisionMetal(currentTankX - 1 * currentTankWH, currentTankY + 1 * currentTankWH, currentTankWH, "tank")) {
      Collide[14] = this.#DIRECTION.BLOCK//碰到了必须移动
    }
    if (true == this.#isNearBoundary(currentTankX - 1 * currentTankWH, currentTankY + 1 * currentTankWH, this.#DIRECTION.LEFT, currentTankWH)) {
      Collide[14] = this.#DIRECTION.BORDER
    }
    else if (true == this.#isNearBoundary(currentTankX - 1 * currentTankWH, currentTankY + 1 * currentTankWH, this.#DIRECTION.DOWN, currentTankWH)) {
      Collide[14] = this.#DIRECTION.BORDER
    }
    //15
    if (true == this.#collisionMetal(currentTankX - 0 * currentTankWH, currentTankY + 1 * currentTankWH, currentTankWH, "tank")) {
      Collide[15] = this.#DIRECTION.BLOCK//碰到了必须移动
    }
    if (true == this.#isNearBoundary(currentTankX - 0 * currentTankWH, currentTankY + 1 * currentTankWH, this.#DIRECTION.DOWN, currentTankWH)) {
      Collide[15] = this.#DIRECTION.BORDER
    }
    //16
    if (true == this.#collisionMetal(currentTankX + 1 * currentTankWH, currentTankY + 1 * currentTankWH, currentTankWH, "tank")) {
      Collide[16] = this.#DIRECTION.BLOCK//碰到了必须移动
    }
    if (true == this.#isNearBoundary(currentTankX + 1 * currentTankWH, currentTankY + 1 * currentTankWH, this.#DIRECTION.RIGHT, currentTankWH)) {
      Collide[16] = this.#DIRECTION.BORDER
    }
    else if (true == this.#isNearBoundary(currentTankX + 1 * currentTankWH, currentTankY + 1 * currentTankWH, this.#DIRECTION.DOWN, currentTankWH)) {
      Collide[16] = this.#DIRECTION.BORDER
    }
    //17
    if (true == this.#collisionMetal(currentTankX + 2 * currentTankWH, currentTankY + 1 * currentTankWH, currentTankWH, "tank")) {
      Collide[17] = this.#DIRECTION.BLOCK//碰到了必须移动
    }
    if (true == this.#isNearBoundary(currentTankX + 2 * currentTankWH, currentTankY + 1 * currentTankWH, this.#DIRECTION.RIGHT, currentTankWH)) {
      Collide[17] = this.#DIRECTION.BORDER
    }
    //18
    if (true == this.#collisionMetal(currentTankX - 1 * currentTankWH, currentTankY + 2 * currentTankWH, currentTankWH, "tank")) {
      Collide[18] = this.#DIRECTION.BLOCK//碰到了必须移动
    }
    if (true == this.#isNearBoundary(currentTankX - 1 * currentTankWH, currentTankY + 2 * currentTankWH, this.#DIRECTION.DOWN, currentTankWH)) {
      Collide[18] = this.#DIRECTION.BORDER
    }
    //19
    if (true == this.#collisionMetal(currentTankX - 0 * currentTankWH, currentTankY + 2 * currentTankWH, currentTankWH, "tank")) {
      Collide[19] = this.#DIRECTION.BLOCK//碰到了必须移动
    }
    if (true == this.#isNearBoundary(currentTankX - 0 * currentTankWH, currentTankY + 2 * currentTankWH, this.#DIRECTION.DOWN, currentTankWH)) {
      Collide[19] = this.#DIRECTION.BORDER
    }
    //20
    if (true == this.#collisionMetal(currentTankX + 1 * currentTankWH, currentTankY + 2 * currentTankWH, currentTankWH, "tank")) {
      Collide[20] = this.#DIRECTION.BLOCK//碰到了必须移动
    }
    if (true == this.#isNearBoundary(currentTankX + 1 * currentTankWH, currentTankY + 2 * currentTankWH, this.#DIRECTION.DOWN, currentTankWH)) {
      Collide[20] = this.#DIRECTION.BORDER
    }

    var dis
    for (const bullet of arraybullet) {

      //然后是1 8 12 19，去重复
      //1
      dis = this.#collision(
        currentTankX,
        currentTankY - 2 * currentTankWH,
        bullet.X - bulletWH / 2 - 1, bullet.Y - bulletWH / 2 - 1,
        currentTankWH, currentTankWH, bulletWH * 1.1, bulletWH * 1.1
      );
      if (true == dis && this.#DIRECTION.DOWN == bullet.direction) {
        Bullet[1] = bullet
        continue
      }
      //8
      dis = this.#collision(
        currentTankX - 2 * currentTankWH,
        currentTankY,
        bullet.X - bulletWH / 2 - 1, bullet.Y - bulletWH / 2 - 1,
        currentTankWH, currentTankWH, bulletWH * 1.1, bulletWH * 1.1
      );
      if (true == dis && this.#DIRECTION.RIGHT == bullet.direction) {
        Bullet[8] = bullet
        continue
      }
      //12
      dis = this.#collision(
        currentTankX + 2 * currentTankWH,
        currentTankY,
        bullet.X - bulletWH / 2 - 1, bullet.Y - bulletWH / 2 - 1,
        currentTankWH, currentTankWH, bulletWH * 1.1, bulletWH * 1.1
      );
      if (true == dis && this.#DIRECTION.LEFT == bullet.direction) {
        Bullet[12] = bullet
        continue
      }
      //19
      dis = this.#collision(
        currentTankX,
        currentTankY + 2 * currentTankWH,
        bullet.X - bulletWH / 2 - 1, bullet.Y - bulletWH / 2 - 1,
        currentTankWH, currentTankWH, bulletWH * 1.1, bulletWH * 1.1
      );
      if (true == dis && this.#DIRECTION.UP == bullet.direction) {
        Bullet[19] = bullet
        continue
      }
      //然后是其他，但是5 9 11 15去重
      //5
      dis = this.#collision(
        currentTankX,
        currentTankY - currentTankWH,
        bullet.X - bulletWH / 2 - 1, bullet.Y - bulletWH / 2 - 1,
        currentTankWH, currentTankWH, bulletWH * 1.1, bulletWH * 1.1
      );
      if (true == dis && this.#DIRECTION.UP != bullet.direction) {
        Bullet[5] = bullet
        continue
      }
      //9
      dis = this.#collision(
        currentTankX - currentTankWH,
        currentTankY,
        bullet.X - bulletWH / 2 - 1, bullet.Y - bulletWH / 2 - 1,
        currentTankWH, currentTankWH, bulletWH * 1.1, bulletWH * 1.1
      );
      if (true == dis && this.#DIRECTION.LEFT != bullet.direction) {
        Bullet[9] = bullet
        continue
      }
      //11
      dis = this.#collision(
        currentTankX + currentTankWH,
        currentTankY,
        bullet.X - bulletWH / 2 - 1, bullet.Y - bulletWH / 2 - 1,
        currentTankWH, currentTankWH, bulletWH * 1.1, bulletWH * 1.1
      );
      if (true == dis && this.#DIRECTION.RIGHT != bullet.direction) {
        Bullet[11] = bullet
        continue
      }
      //15
      dis = this.#collision(
        currentTankX,
        currentTankY + currentTankWH,
        bullet.X - bulletWH / 2 - 1, bullet.Y - bulletWH / 2 - 1,
        currentTankWH, currentTankWH, bulletWH * 1.1, bulletWH * 1.1
      );
      if (true == dis && this.#DIRECTION.DOWN != bullet.direction) {
        Bullet[15] = bullet
        continue
      }

      //最优先检查4 6 14 16，且不去重复，需要子弹落入宫内确认
      //4
      dis = this.#collision(
        currentTankX - currentTankWH,
        currentTankY - currentTankWH,
        bullet.X - bulletWH / 2 - 1, bullet.Y - bulletWH / 2 - 1,
        currentTankWH, currentTankWH, bulletWH * 1.1, bulletWH * 1.1
      );
      if (true == dis && (this.#DIRECTION.DOWN == bullet.direction || this.#DIRECTION.RIGHT == bullet.direction)) {
        Bullet[4] = bullet
      }
      //6
      dis = this.#collision(
        currentTankX + currentTankWH,
        currentTankY - currentTankWH,
        bullet.X - bulletWH / 2 - 1, bullet.Y - bulletWH / 2 - 1,
        currentTankWH, currentTankWH, bulletWH * 1.1, bulletWH * 1.1
      );
      if (true == dis && (this.#DIRECTION.DOWN == bullet.direction || this.#DIRECTION.LEFT == bullet.direction)) {
        Bullet[6] = bullet
      }
      //14 
      dis = this.#collision(
        currentTankX - currentTankWH,
        currentTankY + currentTankWH,
        bullet.X - bulletWH / 2 - 1, bullet.Y - bulletWH / 2 - 1,
        currentTankWH, currentTankWH, bulletWH * 1.1, bulletWH * 1.1
      );
      if (true == dis && (this.#DIRECTION.UP == bullet.direction || this.#DIRECTION.RIGHT == bullet.direction)) {
        Bullet[14] = bullet
      }
      //16
      dis = this.#collision(
        currentTankX + currentTankWH,
        currentTankY + currentTankWH,
        bullet.X - bulletWH / 2 - 1, bullet.Y - bulletWH / 2 - 1,
        currentTankWH, currentTankWH, bulletWH * 1.1, bulletWH * 1.1
      );
      if (true == dis && (this.#DIRECTION.UP == bullet.direction || this.#DIRECTION.LEFT == bullet.direction)) {
        Bullet[16] = bullet
      }
      //0
      dis = this.#collision(
        currentTankX - 1 * currentTankWH,
        currentTankY - 2 * currentTankWH,
        bullet.X - bulletWH / 2 - 1, bullet.Y - bulletWH / 2 - 1,
        currentTankWH, currentTankWH, bulletWH * 1.1, bulletWH * 1.1
      );
      if (true == dis && (this.#DIRECTION.DOWN == bullet.direction || this.#DIRECTION.RIGHT == bullet.direction)) {
        Bullet[0] = bullet
      }


      //2
      dis = this.#collision(
        currentTankX + 1 * currentTankWH,
        currentTankY - 2 * currentTankWH,
        bullet.X - bulletWH / 2 - 1, bullet.Y - bulletWH / 2 - 1,
        currentTankWH, currentTankWH, bulletWH * 1.1, bulletWH * 1.1
      );
      if (true == dis && (this.#DIRECTION.DOWN == bullet.direction || this.#DIRECTION.RIGHT == bullet.direction)) {
        Bullet[2] = bullet
      }
      //3
      dis = this.#collision(
        currentTankX - 2 * currentTankWH,
        currentTankY - currentTankWH,
        bullet.X - bulletWH / 2 - 1, bullet.Y - bulletWH / 2 - 1,
        currentTankWH, currentTankWH, bulletWH * 1.1, bulletWH * 1.1
      );
      if (true == dis && (this.#DIRECTION.DOWN == bullet.direction || this.#DIRECTION.RIGHT == bullet.direction)) {
        Bullet[3] = bullet
      }



      //7
      dis = this.#collision(
        currentTankX + 2 * currentTankWH,
        currentTankY - currentTankWH,
        bullet.X - bulletWH / 2 - 1, bullet.Y - bulletWH / 2 - 1,
        currentTankWH, currentTankWH, bulletWH * 1.1, bulletWH * 1.1
      );
      if (true == dis && (this.#DIRECTION.DOWN == bullet.direction || this.#DIRECTION.LEFT == bullet.direction)) {
        Bullet[7] = bullet
      }


      //13
      dis = this.#collision(
        currentTankX - 2 * currentTankWH,
        currentTankY + currentTankWH,
        bullet.X - bulletWH / 2 - 1, bullet.Y - bulletWH / 2 - 1,
        currentTankWH, currentTankWH, bulletWH * 1.1, bulletWH * 1.1
      );
      if (true == dis && (this.#DIRECTION.UP == bullet.direction || this.#DIRECTION.RIGHT == bullet.direction)) {
        Bullet[13] = bullet
      }



      //17
      dis = this.#collision(
        currentTankX + 2 * currentTankWH,
        currentTankY + currentTankWH,
        bullet.X - bulletWH / 2 - 1, bullet.Y - bulletWH / 2 - 1,
        currentTankWH, currentTankWH, bulletWH * 1.1, bulletWH * 1.1
      );
      if (true == dis && (this.#DIRECTION.UP == bullet.direction || this.#DIRECTION.LEFT == bullet.direction)) {
        Bullet[17] = bullet
      }
      //18
      dis = this.#collision(
        currentTankX - currentTankWH,
        currentTankY + 2 * currentTankWH,
        bullet.X - bulletWH / 2 - 1, bullet.Y - bulletWH / 2 - 1,
        currentTankWH, currentTankWH, bulletWH * 1.1, bulletWH * 1.1
      );
      if (true == dis && (this.#DIRECTION.UP == bullet.direction || this.#DIRECTION.RIGHT == bullet.direction)) {
        Bullet[18] = bullet
      }

      //20
      dis = this.#collision(
        currentTankX + currentTankWH,
        currentTankY + 2 * currentTankWH,
        bullet.X - bulletWH / 2 - 1, bullet.Y - bulletWH / 2 - 1,
        currentTankWH, currentTankWH, bulletWH * 1.1, bulletWH * 1.1
      );
      if (true == dis && (this.#DIRECTION.UP == bullet.direction || this.#DIRECTION.LEFT == bullet.direction)) {
        Bullet[20] = bullet
      }
    }
  }
  // 根据玩家返回正确的方向keyCode
  #helpDirectionKeyCode(direction) {
    switch (direction) {
      case this.#DIRECTION.UP:
        return this.type === "A" ? 87 : 38;
      case this.#DIRECTION.DOWN:
        return this.type === "A" ? 83 : 40;
      case this.#DIRECTION.LEFT:
        return this.type === "A" ? 65 : 37;
      case this.#DIRECTION.RIGHT:
        return this.type === "A" ? 68 : 39;
    }
  }
  // 设置队伍
  #setName() {
    document.getElementById(
      `Player${this.type === "A" ? 1 : 2}barName`
    ).value = "rank35"
    document.getElementById(
      `Player${this.type === "A" ? 1 : 2}Name`
    ).textContent = "rank35"
  }
  // 控制移动   举例子：  向左移动： this.#move(this.#DIRECTION.LEFT)
  #move(direction) {
    if (direction == undefined) return;
    this.#moveEv.keyCode = this.#helpDirectionKeyCode(direction);
    //console.log("移动", direction)
    document.onkeydown(this.#moveEv);
  }
  // 开火
  #fire(direction) {
    this.#fireEv.keyCode = this.type === "A" ? 32 : 8;
    document.onkeydown(this.#fireEv);
  }
  // TODO： 扫描轨道   预判走位  并给出开火和移动方向
  #scanner(currentTank) { }
  // 判断是否快到边界了
  #isNearBoundary(X = 0, Y = 0, currentDirection = undefined, currentTankWH) {
    if (currentDirection != undefined) {
      if (currentDirection === this.#DIRECTION.DOWN && (Y + currentTankWH > this.screenY)) { //下边界
        return true;
      } else if (currentDirection === this.#DIRECTION.UP && (Y < currentTankWH)) { //上边界
        return true;
      } else if (currentDirection === this.#DIRECTION.LEFT && (X < currentTankWH)) { //左边界
        return true;
      } else if (currentDirection === this.#DIRECTION.RIGHT && (X + currentTankWH > this.screenX)) { //右边界
        return true;
      }
    }
    return false
  }
  #checkCollide(A, B, C, D, E, F, G, H) {
    C += A;//算出矩形1右下角横坐标
    D += B;//算出矩形1右下角纵坐标
    G += E;//算出矩形2右下角横纵标
    H += F;//算出矩形2右下角纵坐标
    if (C <= E || G <= A || D <= F || H <= B) {//两个图形没有相交
      return [0, 0, 0, 0];
    }
    var tmpX, tmpY;
    if (E > A) {//图形2在图形1右边
      tmpX = G < C ? [E, G] : [E, C];
    } else {//图形2在图形1左边
      tmpX = C < G ? [A, C] : [A, G];
    }
    if (F > B) {//图形2在图形1下边
      tmpY = H < D ? [F, H] : [F, D];
    } else {//图形2在图形1上边
      tmpY = D < H ? [B, D] : [B, H];
    }
    return [tmpX[0], tmpY[0], tmpX[1], tmpY[1]];
  }
  #collisionMetal(x, y, r, type) {
    //障碍阻挡
    const metal = this.aworld
    var aworld = this.aworld
    if (undefined != metal) {
      for (var i = 0; i < metal.length; i++) {
        if ("tank" == type) {
          if ((1 == metal[i][4] || 2 == metal[i][4]) && x > metal[i][0] - r && x < metal[i][0] + metal[i][2] && y > metal[i][1] - r && y < metal[i][1] + metal[i][3]) {
            return true
          }
          //撞击冰效果
          if ((4 == aworld[i][4] && aworld[i][5] >= 0) && x > aworld[i][0] - r && x < aworld[i][0] + aworld[i][2] && y > aworld[i][1] - r && y < aworld[i][1] + aworld[i][3]) {
            return true
          }
          if ((8 == aworld[i][4] || 2 == aworld[i][4]) && x > aworld[i][0] - r && x < aworld[i][0] + aworld[i][2] && y > aworld[i][1] - r && y < aworld[i][1] + aworld[i][3]) {
            return true
          }
          if ((9 == aworld[i][4] && aworld[i][5] > 0) && x > aworld[i][0] - r && x < aworld[i][0] + aworld[i][2] && y > aworld[i][1] - r && y < aworld[i][1] + aworld[i][3]) {
            return true
          }
          if ((10 == aworld[i][4]) && x > aworld[i][0] - r && x < aworld[i][0] + aworld[i][2] && y > aworld[i][1] - r && y < aworld[i][1] + aworld[i][3]) {
            return true
          }
        }
        else if ("Bullet" == type) {
          if ((1 == metal[i][4]) && x > metal[i][0] - r && x < metal[i][0] + metal[i][2] && y > metal[i][1] - r && y < metal[i][1] + metal[i][3]) {
            return true
          }
          //墙体
          if ((8 == aworld[i][4]) && x > aworld[i][0] - r && x < aworld[i][0] + aworld[i][2] && y > aworld[i][1] - r && y < aworld[i][1] + aworld[i][3]) {
            return true
          }
          if ((9 == aworld[i][4]) && x > aworld[i][0] - r && x < aworld[i][0] + aworld[i][2] && y > aworld[i][1] - r && y < aworld[i][1] + aworld[i][3]) {
            return true
          }
          //冰块
          if ((4 == aworld[i][4] && aworld[i][5] > 0) && aworld[i][5] > 0 && x > aworld[i][0] - r && x < aworld[i][0] + aworld[i][2] && y > aworld[i][1] - r && y < aworld[i][1] + aworld[i][3]) {
            return true
          }
          if ((10 == aworld[i][4] && aworld[i][5] > 0) && aworld[i][5] > 0 && x > aworld[i][0] - r && x < aworld[i][0] + aworld[i][2] && y > aworld[i][1] - r && y < aworld[i][1] + aworld[i][3]) {
            return true
          }
        }
      }
    }
    return false
  }
})("B");