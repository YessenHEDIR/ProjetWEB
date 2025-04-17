document.addEventListener("DOMContentLoaded", () => {
    const player = document.getElementById("player");
    const terrain = document.getElementById("terrain");
    const minimap = document.getElementById("minimap");
    const miniplayer = document.getElementById("miniplayer");
    const mapScale = 5000 / 150; // Échelle pour la mini-map

    let playerX = 2500; // Position initiale
    let playerY = 4800;
    let velocityX = 0, velocityY = 0;
    const speed = 4.5;
    const acceleration = 0.5;
    const friction = 0.85;
    const gridSize = 50; // Taille d'une case
    let keys = {}; // Stocke les touches actives
    let lastDirection = "right"; // Par défaut, personnage tourné vers la droite
    let rockPositions = []; // 🔹 Stocke les positions des rochers

    let isAttacking = false; // indique si on est déjà en train d’attaquer
const slashDuration = 700; // durée (en ms) pour laisser jouer le GIF slash


  // Coordonnées du bot dans la map
let botX = 2600;
let botY = 600;

// Vitesse et direction du bot
const botSpeed = 4;  
let botDirectionX = 0;
let botDirectionY = 0;

// Points de vie du bot
let botHealth = 10;

// Indique qu'au début de la partie, le bot veut se rapprocher du joueur
let approachPlayer = true;

// À quelle distance du joueur on considère que le bot est “assez proche”
const approachDistance = 300; 



// Gère l’attaque du bot
let isBotAttacking = false;       // Indique si le bot est déjà en plein slash
const slashBotDurationBot = 1500;  // Durée de l’animation d’attaque du bot (ms)

// Cooldown pour éviter le spam (1 seconde entre deux attaques)
let lastBotAttackTime = 0;        
const botAttackCooldown = 1000;  


let canPlay = false; // autorise le jeu après l’intro

let gameOver = false;







    generateFixedRocks(); // Génération des rochers

    // 🔹 Met à jour l'image du joueur en fonction du mouvement
    function updatePlayerImage() {
        const isMoving = Object.keys(keys).some(key => ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(key));


        if (isAttacking) {
            // on ne change pas l’animation
            return;
        }
       
        // 2) Sinon si on se déplace, GIF de course
        else if (isMoving) {
            player.style.backgroundImage = "url('img/run-unscreen.gif')";
            player.style.width = "240px";
            player.style.height = "240px";
        } 
        // 3) Sinon, image immobile
        else {
            player.style.backgroundImage = "url('img/stand-removebg-preview.png')";
            player.style.width = "120px";
            player.style.height = "120px";
        }
    }



    function showEndGameMessage(msg){
        const overlay = document.getElementById("end-game-overlay");
        const txt      = document.getElementById("end-game-text");
        const btn      = document.getElementById("restart-button");
      
        txt.textContent = msg;        // place le bon texte
        overlay.style.display = "flex";
      
        btn.onclick = () => window.location.reload();   // relance la partie
      }
      





    function doSlash() {
        isAttacking = true;
    
        // On met l’animation de coup d’épée
        player.style.backgroundImage = "url('img/slash-perso-unscreen.gif')";
        player.style.width = "240px";
        player.style.height = "240px";
        // Conserver la bonne orientation (gauche/droite)
        if (lastDirection === "left") {
            player.style.transform = "translate(-50%, -50%) scaleX(-1)";
        } else {
            player.style.transform = "translate(-50%, -50%) scaleX(1)";
        }

        
// Vérifier la distance entre le joueur et le bot
 let dx = playerX - botX;
 let dy = playerY - botY;
 let distance = Math.sqrt(dx * dx + dy * dy);

 // Si la distance est < 80 px, le bot perd 1 PV
 if (distance < 80) {
    botHealth--;
    if (botHealth < 0) botHealth = 0;
    createBotHealthBar();
    console.log("Le bot perd 1 PV, il lui reste : ", botHealth);

    if(botHealth<=0){
        showEndGameMessage("Félicitations, tu as gagné !");
        gameOver = true;
        return;                       // facultatif : stoppe l’attaque
      }
}


  


        // Au bout de X millisecondes, on arrête l’attaque
        setTimeout(() => {
            isAttacking = false;
            updatePlayerImage(); 
            // (revient à l’animation statique ou course, selon les touches fléchées)
        }, slashDuration);
    }
    


    function doBotSlash() {
        // Empêche une nouvelle attaque immédiate
        isBotAttacking = true;
    
        // 1) Sélectionne l’élément HTML du bot
        const botElement = document.getElementById("bot");
    
        // 2) Mets le GIF d’attaque
        //    (Utilise "slash-bot-unscreen.gif" si tu as, sinon mets le même que le joueur)
        botElement.style.backgroundImage = "url('img/slash-perso-unscreen.gif')";
        botElement.style.width = "240px";
        botElement.style.height = "240px";
    
        // 3) Oriente le bot vers le joueur (facultatif)
        if (playerX < botX) {
            botElement.style.transform = "translate(-50%, -50%) scaleX(-1)";
        } else {
            botElement.style.transform = "translate(-50%, -50%) scaleX(1)";
        }
    
        // 4) Calcul de la distance bot → joueur
        const dx = botX - playerX;
        const dy = botY - playerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
    
        // 5) Si le joueur est assez proche, on lui retire 1 PV
        if (distance < 80) {
            takeDamage(1);
            console.log("Le bot t’a frappé ! PV restants (joueur) :", playerHealth);
        }
    
        // 6) Après slashBotDurationBot ms, retour à l'état normal
        setTimeout(() => {
            isBotAttacking = false;
            updateBotImage();  // fait repasser le bot à stand/run
        }, slashBotDurationBot);
    }
    

    





    // 🔹 Gestion des touches directionnelles
    window.addEventListener("keydown", (e) => {

        if (gameOver) return; // bloque les mouvements après la fin
        keys[e.key] = true;
       



        if (e.key === "ArrowLeft" && !keys["ArrowRight"]) {
            lastDirection = "left";
            player.style.transform = "translate(-50%, -50%) scaleX(-1)";
        } else if (e.key === "ArrowRight" && !keys["ArrowLeft"]) {
            lastDirection = "right";
            player.style.transform = "translate(-50%, -50%) scaleX(1)";
        }

        // Quand on appuie sur espace, on ne lance le slash que si on n’est pas déjà en attaque
    if (e.key === " " && e.repeat === false && !isAttacking) {
        doSlash(); 
    } 
        updatePlayerImage();
    });

    window.addEventListener("keyup", (e) => {
        if (gameOver) return;
        delete keys[e.key];
        updatePlayerImage();
    });

    // 🔹 Génère les rochers et les ajoute à la carte
    function generateFixedRocks() {
        const positions = [
            { x: 600, y: 600 },
            { x: 1200, y: 800 },
            { x: 2000, y: 1300 },
            { x: 3000, y: 900 },
            { x: 4000, y: 1800 },
            { x: 2500, y: 2300 },
            { x: 1500, y: 2700 },
            { x: 3500, y: 3200 },
            { x: 4500, y: 3600 },
            { x: 500, y: 4000 },
            { x: 2500, y: 4500 }
        ];

        positions.forEach(pos => {
            let rock = document.createElement("div");
            rock.classList.add("rock");

            rock.style.left = `${pos.x}px`;
            rock.style.top = `${pos.y}px`;

            terrain.appendChild(rock);
            rockPositions.push({ x: pos.x, y: pos.y, size: 100 });
        });

        console.log(`✅ ${rockPositions.length} rochers placés.`);
    }

    function isCollidingWithRock(newX, newY) {
        const playerSize = 60; 
        const offsetX = 50; // 🔹 Décalage horizontal
        const offsetY = 40; // 🔹 Décalage vertical
    
        for (let i = 0; i < rockPositions.length; i++) {
            let rock = rockPositions[i];
    
            if (
                newX + playerSize > rock.x + offsetX &&  
                newX - playerSize < rock.x + rock.size + offsetX &&  
                newY + playerSize > rock.y + offsetY &&  
                newY - playerSize < rock.y + rock.size + offsetY  
            ) {
                return true; 
            }
        }
        return false; 
    }





    let playerHealth = 10; // 🔹 Début avec 10 PV

    function createHealthBar() {
        const healthContainer = document.getElementById("health-container");
        healthContainer.innerHTML = ""; // 🔹 Vide le conteneur avant de recréer
    
        for (let i = 0; i < 10; i++) {
            let healthPoint = document.createElement("div");
            healthPoint.classList.add("health-point");
    
            // 🔹 Changer la couleur en fonction des PV restants
            if (i >= playerHealth) {
                healthPoint.style.backgroundColor = "gray"; // PV perdu
            } else if (playerHealth > 6) {
                healthPoint.style.backgroundColor = "limegreen"; // Beaucoup de PV
            } else if (playerHealth > 3) {
                healthPoint.style.backgroundColor = "orange"; // Milieu de vie
            } else {
                healthPoint.style.backgroundColor = "red"; // Danger
            }
    
            healthContainer.appendChild(healthPoint);
        }
    }



    

    
    
    // 🔹 Simuler une perte de PV
    function takeDamage(amount) {
        playerHealth -= amount;
        if (playerHealth < 0) playerHealth = 0;
        createHealthBar();
    
        if(playerHealth<=0){
            showEndGameMessage("Tu as perdu...");
            gameOver = true;
            return;                  
          }
          
    }
    
    
      
    
    // 🔹 Simuler un gain de PV
    function heal(amount) {
        playerHealth += amount;
        if (playerHealth > 10) playerHealth = 10;
        createHealthBar();
    }
    
    // 🔹 Initialise la barre de vie
    createHealthBar();
    

    // Ne pas sortir de la map

    function isOutOfGrass(newX, newY) {
        const grassMinX = 25;  // Bord gauche de l’herbe
        const grassMaxX = 4960; // Bord droit de l’herbe
        const grassMinY = 25;  // Bord haut de l’herbe
        const grassMaxY = 4960; // Bord bas de l’herbe
    
        return (newX < grassMinX || newX > grassMaxX || newY < grassMinY || newY > grassMaxY);
    }





    function createBotHealthBar() {
        const botHealthContainer = document.getElementById("bot-health-container");
        if (!botHealthContainer) return; // si tu n'as pas de div HTML pour le bot
        botHealthContainer.innerHTML = ""; // Vide avant de recréer
        
        for (let i = 0; i < 10; i++) {
            let healthPoint = document.createElement("div");
            healthPoint.classList.add("bot-health-point");
    
            if (i >= botHealth) {
                healthPoint.style.backgroundColor = "gray";
            } else if (botHealth > 6) {
                healthPoint.style.backgroundColor = "limegreen";
            } else if (botHealth > 3) {
                healthPoint.style.backgroundColor = "orange";
            } else {
                healthPoint.style.backgroundColor = "red";
            }
            botHealthContainer.appendChild(healthPoint);
        }
    }
    
    // On l’appelle au démarrage
    createBotHealthBar();
    

    setInterval(() => {
        // botDirectionX et botDirectionY vont prendre -1, 0 ou +1
        botDirectionX = Math.floor(Math.random() * 3) - 1; 
        botDirectionY = Math.floor(Math.random() * 3) - 1; 
    }, 1000);
    

    function updateBotImage() {
        // Détermine si le bot se déplace (direction != 0)
        const botIsMoving = (botDirectionX !== 0 || botDirectionY !== 0);
    

        if (isBotAttacking) {
                  return; 
              }


        // S’il bouge, on affiche le GIF "run". Sinon "stand"
        if (botIsMoving) {
            document.getElementById("bot").style.backgroundImage = "url('img/run-unscreen.gif')";
            document.getElementById("bot").style.width = "240px";
            document.getElementById("bot").style.height = "240px";
        } else {
            document.getElementById("bot").style.backgroundImage = "url('img/stand-removebg-preview.png')";
            document.getElementById("bot").style.width = "120px";
            document.getElementById("bot").style.height = "120px";
        }
    
        // Gérer l’orientation gauche/droite
        if (botDirectionX < 0) {
            document.getElementById("bot").style.transform = "translate(-50%, -50%) scaleX(-1)";
        } else if (botDirectionX > 0) {
            document.getElementById("bot").style.transform = "translate(-50%, -50%) scaleX(1)";
        }
        // Si botDirectionX = 0, on ne change pas l’orientation actuelle
    }
    

    
    
    
    
    function update() {
        let newPlayerX = playerX;
        let newPlayerY = playerY;

        if (!canPlay || gameOver) return;

    
        // Vérifie chaque direction indépendamment
        if (keys["ArrowUp"]) {
            let tempY = newPlayerY - speed;
            if (!isCollidingWithRock(playerX, tempY) && !isOutOfGrass(playerX, tempY)) {
                newPlayerY = tempY;
            }
        }
        if (keys["ArrowDown"]) {
            let tempY = newPlayerY + speed;
            if (!isCollidingWithRock(playerX, tempY) && !isOutOfGrass(playerX, tempY)) {
                newPlayerY = tempY;
            }
        }
        if (keys["ArrowLeft"]) {
            let tempX = newPlayerX - speed;
            if (!isCollidingWithRock(tempX, playerY) && !isOutOfGrass(tempX, playerY)) {
                newPlayerX = tempX;
            }
        }
        if (keys["ArrowRight"]) {
            let tempX = newPlayerX + speed;
            if (!isCollidingWithRock(tempX, playerY) && !isOutOfGrass(tempX, playerY)) {
                newPlayerX = tempX;
            }
        }
    
        playerX = newPlayerX;
        playerY = newPlayerY;
    
        // 🔹 Mise à jour de la mini-map
        const miniX = (playerX / mapScale);
        const miniY = (playerY / mapScale);
        miniplayer.style.left = `${miniX}px`;
        miniplayer.style.top = `${miniY}px`;



       // ─── 2) Mouvement du bot ─────────────────────────────
function updateBotPosition() {
    // Si on doit encore s'approcher du joueur
    if (approachPlayer) {
        // Calcule la direction (dx, dy) vers le joueur
        let dx = playerX - botX;
        let dy = playerY - botY;
        let dist = Math.sqrt(dx * dx + dy * dy);

        // Si la distance est > approachDistance, on avance vers le joueur
        if (dist > approachDistance) {
            // On normalise le vecteur (dx, dy)
            dx /= dist;
            dy /= dist;

            // On calcule la position potentielle
            let newBotX = botX + dx * botSpeed;
            let newBotY = botY + dy * botSpeed;

            // S'il n'y a pas collision ni sortie de la carte, on avance
            if (!isCollidingWithRock(newBotX, newBotY) && !isOutOfGrass(newBotX, newBotY)) {
                botX = newBotX;
                botY = newBotY;
            }
        }
        else {
            // On est assez proche du joueur, on arrête l'approche
            approachPlayer = false;
        }
    }
    // Sinon, le bot est en mode aléatoire
    else {
        let newBotX = botX + botDirectionX * botSpeed;
        let newBotY = botY + botDirectionY * botSpeed;

        if (!isCollidingWithRock(newBotX, newBotY) && !isOutOfGrass(newBotX, newBotY)) {
            botX = newBotX;
            botY = newBotY;
        }
    }

    // Mise à jour de l’apparence du bot
    const botElement = document.getElementById("bot");
    botElement.style.left = botX + "px";
    botElement.style.top = botY + "px";

    updateBotImage(); 
}



updateBotPosition(); 


   // ── Vérifier si le bot attaque le joueur ──
   let distanceBotPlayer = Math.sqrt((botX - playerX)**2 + (botY - playerY)**2);
   let now = Date.now();
   // Distance < 80 + pas déjà en train d'attaquer + cooldown ok
   if (distanceBotPlayer < 80 && !isBotAttacking && (now - lastBotAttackTime > botAttackCooldown)) {
       doBotSlash();
       lastBotAttackTime = now; // mémorise l'instant de l’attaque
   }


    
        // 🔹 Déplacer la carte en fonction du joueur
        terrain.style.transform = `translate(${-playerX + window.innerWidth / 2}px, ${-playerY + window.innerHeight / 2}px)`;
    
        requestAnimationFrame(update);
    }
    

    setTimeout(() => {
        canPlay = true;
        update(); // commence la boucle du jeu après 2 secondes
      }, 4000);
      
});
