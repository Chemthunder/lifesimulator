namespace LifeSimulator {
    export enum Gender {
        MALE,
        FEMALE
    }

    export const CritterKind = SpriteKind.create();

    export class CritterSprite extends Sprite {
        // Constants
        public gender: Gender;
        public age: number;
        public breedCooldown: number = 75;

        public constructor( // Traits
            public color: number,
            public speed: number,
            public athletics: number,
            public timeToLive: number,
            public breedPower: number
        ) {
            super(image.create(0, 0));
            this.setKind(CritterKind);
            this.gender = randint(1, 2) == 1 ? Gender.MALE : Gender.FEMALE;

            if (this.gender == Gender.MALE) {
                this.setImage(assets.image`cMale`);
            } else {
                this.setImage(assets.image`cFemale`);
            }

            this.lifespan = this.timeToLive;

            replaceColor(this.image, 1, this.color);

            this.setFlag(SpriteFlag.BounceOnWall, true);

            forever(() => { // Movement
                this.setVelocity(
                    randint(-this.speed, this.speed),
                    randint(-this.speed, this.speed)
                );
                pause(this.athletics);
            });

            forever(() => { // Breed Cooldown
                if (this.breedCooldown > 0) {
                    this.breedCooldown--;
                }
            });

            SimManager.totalCritters++;
        }

        public static reproduceIfPossible(parentOne: CritterSprite, parentTwo: CritterSprite) {
            if (parentOne.breedCooldown <= 0 && parentTwo.breedCooldown <= 0) {
                for (let i = 0; i < parentOne.breedPower; i++) {
                    const avSpeed = (parentOne.speed + parentTwo.speed) / 2 + randint(-20, 20);
                    const avAth = (parentOne.athletics + parentTwo.athletics) / 2 + randint(-40, 40);

                    const offspring = SimManager.getOrCreate(
                        randint(1, 2) ? randint(1, 2) == 1 ? parentOne.color : parentTwo.color : randint(1, 14),
                        avSpeed,
                        avAth,
                        randint(1000, 50000),
                        randint(1, 3)
                    );

                    offspring.setPosition(parentTwo.x, parentTwo.y);

                    parentOne.breedCooldown = 500;
                    parentTwo.breedCooldown = 500;
                    SimManager.crittersBred++;
                }
            }
        }
    }

    export namespace SimManager {
        export let crittersBred = 0;
        export let totalCritters = 0;
        export let critterDeaths = 0;

        function initialize() {
            let stats = false;
            let end = false;

            sprites.onOverlap(CritterKind, CritterKind, (sprite, other) => {
                if (other instanceof CritterSprite && sprite instanceof CritterSprite) {
                    CritterSprite.reproduceIfPossible(sprite, other);
                }
            });

            scene.createRenderable(500, (handler, cam) => {
                handler.print(
                    sprites.allOfKind(CritterKind).length + " critters",
                    3,
                    0,
                    1
                )

                if (stats) {
                    handler.print(
                        crittersBred + " critters bred",
                        3,
                        20,
                        1
                    );

                    handler.print(
                        totalCritters + " total critters",
                        3,
                        30,
                        1
                    );

                    handler.print(
                        critterDeaths + " critters died",
                        3,
                        40,
                        1
                    );
                }
            });

            forever(() => {
                if (sprites.allOfKind(CritterKind).length <= 1) {
                    if (!end && !stats) {
                        game.reset();
                    }
                }

                if (sprites.allOfKind(CritterKind).length >= 150) {
                    stats = true;
                    sprites.destroyAllSpritesOfKind(CritterKind);
                    pause(3500);

                    game.reset();
                }
            });

            sprites.onDestroyed(CritterKind, (sprite) => {
                if (!stats) {
                    SimManager.critterDeaths++;
                }
            });
        }

        export function getOrCreate(color: number, speed: number, athletics: number, timeToLive: number, breedPower: number): CritterSprite {
            const sprite = new CritterSprite(color, speed, athletics, timeToLive, breedPower);
            game.currentScene().physicsEngine.addSprite(sprite);
            return sprite;
        }

        export function createEnvironment(n: number) {
            for (let i = 0; i < n; i++) {
                const critter = getOrCreate(randint(1, 14), randint(20, 120), randint(200, 1200), randint(1000, 50000), randint(1, 3));

                critter.setPosition(
                    randint(10, screen.width - 10),
                    randint(10, screen.height - 10)
                );
            }

            initialize();
        }
    }
}

LifeSimulator.SimManager.createEnvironment(randint(2, 7));