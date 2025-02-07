class PokemonContest implements Feature {
    name: 'Pokemon Contest';
    saveKey: 'pokemonContest';

    public lastEnteredDate: KnockoutObservable<Date>;
    public entries: KnockoutObservableArray<ContestEntry>;

    constructor() {
        this.lastEnteredDate = ko.observable(undefined);
        this.entries = ko.observableArray(Array(3).fill(undefined).map(() => new ContestEntry()));
    }

    initialize(): void {

    }

    canAccess(): boolean {
        return true;
    }

    update(delta: number): void {
    }

    defaults: Record<string, any>;
    toJSON(): Record<string, any> {
        throw new Error('Method not implemented.');
    }
    fromJSON(json: Record<string, any>): void {
        throw new Error('Method not implemented.');
    }
}

class PokemonContestController {
    static contestStyle: KnockoutObservable<ContestStyle> = ko.observable(undefined);
    static pokemonType: KnockoutObservable<PokemonType> = ko.observable(PokemonType.None);
    static inProgress = ko.observable<boolean>(false);
    static contestText: KnockoutObservable<string> = ko.observable(undefined);

    static entryAmount = 3;

    public static generateDailyContest(date: Date) {
        SeededRand.seedWithDate(date);

        // Generate Contest Style and Pokemon Type constraints
        this.contestStyle(SeededRand.fromArray(GameHelper.enumNumbers(ContestStyle)));
        const validTypes = GameHelper.enumNumbers(PokemonType).filter((t) => t !== PokemonType.None);
        this.pokemonType(SeededRand.fromArray(validTypes));
    }

    public static getValidPokemonList(entryIndex: number) {
        return ko.pureComputed((): PartyPokemon[] => {
            const pokemonType = PokemonContestController.pokemonType();
            const otherEntries = App.game.pokemonContest.entries().filter((e, i) => i !== entryIndex && e.pokemonName()).map((e) => e.pokemonName());
            const validPokemon = App.game.party.caughtPokemon.filter((p) => pokemonMap[p.name].type.includes(pokemonType) && !otherEntries.includes(p.name));
            return validPokemon.sort((a, b) => a.displayName.localeCompare(b.displayName));
        });
    }

    public static getBerryList = ko.pureComputed(() => {
        const berries = App.game.farming.berryData.filter((b) => App.game.farming.unlockedBerries[b.type]() && App.game.farming.berryList[b.type]() > 0);
        return berries;
    });

    public static getTotalStylePoints = ko.pureComputed((): number => {
        return App.game.pokemonContest.entries().reduce((sum, e) => sum + e.getStylePoints(), 0);
    });

    private static canEnterContest() {
        return true;
    }

    public static startContest() {
        if (PokemonContestController.canEnterContest()) {
            return;
        }

        PokemonContestController.inProgress(true);


    }
}

class ContestEntry {
    public pokemonName: KnockoutObservable<PokemonNameType>;
    public berry: KnockoutObservable<BerryType>;

    constructor() {
        this.pokemonName = ko.observable(undefined);
        this.berry = ko.observable(BerryType.None);
    }

    public getPokemonImage() {
        return !this.pokemonName() ? '/assets/images/pokeball/Pokeball.svg' : PokemonHelper.getImage(pokemonMap[this.pokemonName()].id);
    }

    getStylePoints = ko.pureComputed((): number => {
        if (!this.pokemonName()) {
            return 0;
        }

        let stylePoints = 0;
        let flavorType: FlavorType;
        const baseStats = pokemonMap[this.pokemonName()].base;

        switch (PokemonContestController.contestStyle()) {
            case ContestStyle.Cool:
                stylePoints = baseStats.attack + baseStats.specialDefense;
                flavorType = FlavorType.Spicy;
                break;
            case ContestStyle.Beautiful:
                stylePoints = baseStats.specialAttack + baseStats.defense;
                flavorType = FlavorType.Dry;
                break;
            case ContestStyle.Cute:
                stylePoints = baseStats.specialDefense + baseStats.hitpoints;
                flavorType = FlavorType.Sweet;
                break;
            case ContestStyle.Clever:
                stylePoints = baseStats.specialAttack + baseStats.speed;
                flavorType = FlavorType.Bitter;
                break;
            case ContestStyle.Tough:
                stylePoints = baseStats.hitpoints + baseStats.defense;
                flavorType = FlavorType.Sour;
                break;
        }

        if (this.berry() && this.berry() !== BerryType.None) {
            stylePoints += App.game.farming.berryData[this.berry()].flavors[flavorType].value;
        }

        return stylePoints;
    });
}

enum ContestStyle {
    Cool,
    Beautiful,
    Cute,
    Clever,
    Tough,
}

class PokemonContestTownContent extends TownContent {
    constructor() {
        super([new DevelopmentRequirement()]);
    }
    public cssClass(): string {
        return 'btn btn-primary';
    }
    public text(): string {
        return 'Pokémon Contest';
    }
    public isVisible(): boolean {
        //return true;
        return new DevelopmentRequirement().isCompleted();
    }
    public onclick(): void {
        $('#pokemonContestModal').modal('show');
    }
}
